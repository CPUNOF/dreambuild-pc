#!/usr/bin/env node
// Roda o Cypress subindo apenas os servidores que ainda não estiverem no ar.
//   node scripts/e2e.mjs          → testes de interface com API simulada
//   node scripts/e2e.mjs --full   → fluxo completo contra a API E2E em memória
//   node scripts/e2e.mjs --open   → abre o Cypress interativo (combina com --full)
//
// Se já houver um Vite em 127.0.0.1:5173, ele é reaproveitado. No modo --full,
// a porta 3001 só é aceita se for o servidor E2E em memória (cabeçalho
// X-DreamBuild-E2E); um back-end ligado ao Firestore real é recusado.
import { spawn } from "node:child_process";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const full = process.argv.includes("--full");
const open = process.argv.includes("--open");
const SITE = "http://127.0.0.1:5173/";
const API = "http://127.0.0.1:3001/api/health";

async function probe(url) {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(1500) });
  } catch {
    return null;
  }
}
async function waitFor(url, check = () => true, timeoutMs = 60_000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const res = await probe(url);
    if (res?.ok && check(res)) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Tempo esgotado aguardando ${url}`);
}
const isMemoryApi = (res) => res.headers.get("x-dreambuild-e2e") === "memory";

const started = [];
function start(label, args, cwd) {
  console.log(`▶ iniciando ${label}`);
  // node direto: encerrar o PID encerra o servidor (sem wmic, sem cmd no meio).
  const child = spawn(process.execPath, args, {
    cwd,
    stdio: ["ignore", "inherit", "inherit"],
  });
  started.push(child);
}
function stopAll() {
  for (const child of started) child.kill();
}
process.on("SIGINT", () => {
  stopAll();
  process.exit(130);
});

let code = 1;
try {
  if (full) {
    const api = await probe(API);
    if (api && !isMemoryApi(api))
      throw new Error(
        "A porta 3001 está ocupada por outro back-end (provavelmente o `npm run dev`, ligado ao Firestore). " +
          "Encerre-o: o fluxo completo só roda contra a API E2E em memória.",
      );
    if (api)
      console.log("✔ reaproveitando a API E2E em memória já ativa na 3001");
    else
      start(
        "API E2E (dados em memória)",
        ["scripts/e2eServer.js"],
        join(root, "backend"),
      );
  }

  if (await probe(SITE))
    console.log("✔ reaproveitando o Vite já ativo na 5173");
  else
    start(
      "Vite",
      [
        join(root, "node_modules", "vite", "bin", "vite.js"),
        "--host",
        "127.0.0.1",
        "--port",
        "5173",
        "--strictPort",
      ],
      join(root, "frontend"),
    );

  if (full) await waitFor(API, isMemoryApi);
  await waitFor(SITE);

  const args = ["cypress", open ? "open" : "run", "--e2e"];
  if (full) args.push("--config-file", "cypress.fullstack.config.js");
  code = await new Promise((done) => {
    const child = spawn("npx", args, {
      cwd: join(root, "frontend"),
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("exit", (c) => done(c ?? 1));
  });
} catch (error) {
  console.error(`\n✖ ${error.message}`);
} finally {
  stopAll();
}
process.exit(code);
