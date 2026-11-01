#!/usr/bin/env node
// Executa a bateria de regressão completa do DreamBuild PC e gera evidências:
//   reports/junit/*.xml              resultados por caso (JUnit)
//   reports/coverage/backend/        cobertura do back-end (lcov)
//   reports/coverage/frontend/       cobertura do front-end (html + lcov)
//   reports/relatorio-regressao.md   resumo legível com cada caso executado
//
// Uso: node scripts/regressao.mjs [--sem-e2e]
//   --sem-e2e  pula as suítes Cypress (útil sem navegador disponível)
import { spawn } from "node:child_process";
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const reports = join(root, "reports");
const junit = join(reports, "junit");
const withE2E = !process.argv.includes("--sem-e2e");
const isWindows = process.platform === "win32";

rmSync(junit, { recursive: true, force: true });
rmSync(join(reports, "coverage"), { recursive: true, force: true });
mkdirSync(junit, { recursive: true });
mkdirSync(join(reports, "coverage", "backend"), { recursive: true });

function run(label, command, args, cwd) {
  console.log(`\n▶ ${label}\n  ${command} ${args.join(" ")}`);
  return new Promise((done) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      // Shell só para o npx (.cmd no Windows); o node é chamado direto.
      shell: isWindows && command === "npx",
    });
    child.on("exit", (code) => done(code ?? 1));
  });
}

function startServer(label, args, cwd) {
  console.log(`\n▶ iniciando ${label}`);
  // node direto (sem npm/cmd no meio) para que encerrar o PID encerre o servidor.
  const child = spawn(process.execPath, args, {
    cwd,
    stdio: ["ignore", "inherit", "inherit"],
  });
  return child;
}

async function waitFor(url, check = () => true, timeoutMs = 60_000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try {
      const response = await fetch(url);
      if (response.ok && check(response)) return response;
    } catch {
      /* ainda subindo */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Tempo esgotado aguardando ${url}`);
}

async function inUse(url) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(1500) });
    return true;
  } catch {
    return false;
  }
}

const results = [];
const backendDir = join(root, "backend");
const frontendDir = join(root, "frontend");

results.push({
  suite: "Back-end: unitários, API e integração (node:test)",
  code: await run(
    "Back-end",
    process.execPath,
    [
      "--test",
      "--experimental-test-coverage",
      "--test-coverage-exclude=test/**",
      "--test-coverage-exclude=../frontend/**",
      "--test-reporter=spec",
      "--test-reporter-destination=stdout",
      "--test-reporter=junit",
      `--test-reporter-destination=${join(junit, "backend.xml")}`,
      "--test-reporter=lcov",
      `--test-reporter-destination=${join(reports, "coverage", "backend", "lcov.info")}`,
      "test/**/*.test.js",
    ],
    backendDir,
  ),
});

results.push({
  suite: "Front-end: unitários e componentes (Vitest)",
  code: await run(
    "Front-end",
    "npx",
    [
      "vitest",
      "run",
      "--coverage",
      "--reporter=default",
      "--reporter=junit",
      `--outputFile.junit=${join(junit, "frontend.xml")}`,
    ],
    frontendDir,
  ),
});

const servers = [];
if (withE2E) {
  try {
    if (await inUse("http://127.0.0.1:3001/api/health")) {
      const res = await fetch("http://127.0.0.1:3001/api/health");
      if (res.headers.get("x-dreambuild-e2e") !== "memory")
        throw new Error(
          "A porta 3001 já está ocupada por outro back-end (possivelmente ligado ao Firestore). " +
            "Encerre-o antes: o fluxo completo só roda contra o servidor E2E em memória.",
        );
    } else
      servers.push(
        startServer("API E2E (memória)", ["scripts/e2eServer.js"], backendDir),
      );
    if (!(await inUse("http://127.0.0.1:5173/")))
      servers.push(
        startServer(
          "Vite",
          [
            join(root, "node_modules", "vite", "bin", "vite.js"),
            "--host",
            "127.0.0.1",
            "--port",
            "5173",
            "--strictPort",
          ],
          frontendDir,
        ),
      );
    await waitFor(
      "http://127.0.0.1:3001/api/health",
      (r) => r.headers.get("x-dreambuild-e2e") === "memory",
    );
    await waitFor("http://127.0.0.1:5173/");

    for (const [suite, extra] of [
      ["E2E Cypress com API simulada", []],
      [
        "E2E Cypress fluxo completo (sem mocks)",
        ["--config-file", "cypress.fullstack.config.js"],
      ],
    ]) {
      const prefix = extra.length ? "cypress-full" : "cypress";
      results.push({
        suite,
        code: await run(
          suite,
          "npx",
          [
            "cypress",
            "run",
            "--e2e",
            ...extra,
            "--reporter",
            "junit",
            "--reporter-options",
            `mochaFile=${join(junit, `${prefix}-[hash].xml`)},toConsole=false`,
          ],
          frontendDir,
        ),
      });
    }
  } catch (error) {
    console.error(`\n✖ ${error.message}`);
    results.push({
      suite: "Preparação dos testes E2E",
      code: 1,
      error: error.message,
    });
  } finally {
    for (const server of servers) server.kill();
  }
}

// ---- Relatório a partir dos XMLs JUnit ------------------------------------
const decode = (s = "") =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
const attr = (tag, name) =>
  decode(tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1]);

function parse(file) {
  const xml = readFileSync(join(junit, file), "utf8");
  const cases = [];
  const re = /<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g;
  for (const m of xml.matchAll(re)) {
    const body = m[3] || "";
    const status = /<failure\b|<error\b/.test(body)
      ? "Reprovado"
      : /<skipped\b/.test(body)
        ? "Ignorado"
        : "Aprovado";
    const failure = body.match(/<failure\b[^>]*message="([^"]*)"/)?.[1];
    cases.push({
      group: attr(m[1], "classname") || "",
      name: attr(m[1], "name"),
      time: Number(attr(m[1], "time") || 0),
      status,
      failure: failure && decode(failure).slice(0, 160),
    });
  }
  return cases;
}

const groups = {
  "backend.xml": "Back-end (node:test)",
  "frontend.xml": "Front-end (Vitest)",
  cypress: "E2E Cypress — API simulada",
  "cypress-full": "E2E Cypress — fluxo completo",
};
const byFile = {};
for (const file of readdirSync(junit).filter((f) => f.endsWith(".xml"))) {
  const key = file.startsWith("cypress-full")
    ? "cypress-full"
    : file.startsWith("cypress")
      ? "cypress"
      : file;
  (byFile[key] ??= []).push(...parse(file));
}

const now = new Date();
const lines = [
  "# Relatório de execução da regressão",
  "",
  `Gerado automaticamente por \`scripts/regressao.mjs\` em ${now.toLocaleString("pt-BR")}.`,
  "",
  `Ambiente: Node ${process.version}, ${process.platform} ${process.arch}.`,
  "",
  "## Resumo",
  "",
  "| Suíte | Casos | Aprovados | Reprovados | Ignorados |",
  "|---|---:|---:|---:|---:|",
];
let total = 0,
  passed = 0,
  failed = 0;
for (const [key, label] of Object.entries(groups)) {
  const cases = byFile[key] || [];
  if (!cases.length) continue;
  const p = cases.filter((c) => c.status === "Aprovado").length;
  const f = cases.filter((c) => c.status === "Reprovado").length;
  total += cases.length;
  passed += p;
  failed += f;
  lines.push(
    `| ${label} | ${cases.length} | ${p} | ${f} | ${cases.length - p - f} |`,
  );
}
lines.push(
  `| **Total** | **${total}** | **${passed}** | **${failed}** | **${total - passed - failed}** |`,
  "",
);
for (const r of results.filter((r) => r.error))
  lines.push(`> ⚠️ ${r.suite}: ${r.error}`, "");
lines.push(
  `Resultado geral: **${failed === 0 && results.every((r) => r.code === 0) ? "APROVADO" : "REPROVADO"}**`,
  "",
);

for (const [key, label] of Object.entries(groups)) {
  const cases = byFile[key] || [];
  if (!cases.length) continue;
  lines.push(
    `## ${label}`,
    "",
    "| Grupo | Caso | Status | Tempo (s) |",
    "|---|---|---|---:|",
  );
  for (const c of cases)
    lines.push(
      `| ${c.group.replace(/\|/g, "\\|")} | ${c.name.replace(/\|/g, "\\|")}${c.failure ? `<br><sub>${c.failure.replace(/\|/g, "\\|")}</sub>` : ""} | ${c.status} | ${c.time.toFixed(3)} |`,
    );
  lines.push("");
}
writeFileSync(join(reports, "relatorio-regressao.md"), lines.join("\n"));
console.log(
  `\nRelatório: reports/relatorio-regressao.md — ${passed}/${total} aprovados, ${failed} reprovados.`,
);
process.exit(failed === 0 && results.every((r) => r.code === 0) ? 0 : 1);
