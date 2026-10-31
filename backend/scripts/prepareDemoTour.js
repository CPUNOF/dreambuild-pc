import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
const base = "http://127.0.0.1:3001/api";
const jar = new Map();
let csrf = "";
let step = "leitura das contas locais";
async function request(path, method = "GET", body) {
  step = `${method} ${path.split("?")[0]}`;
  const response = await fetch(base + path, {
    method,
    headers: {
      Cookie: [...jar].map(([key, value]) => `${key}=${value}`).join("; "),
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(20000),
  });
  for (const entry of response.headers.getSetCookie()) {
    const part = entry.split(";")[0],
      index = part.indexOf("=");
    jar.set(part.slice(0, index), part.slice(index + 1));
  }
  const result = await response.json();
  if (!response.ok || result.status !== "success") {
    step += ` (HTTP ${response.status})`;
    throw new Error("API indisponível.");
  }
  if (result.data?.csrfToken) csrf = result.data.csrfToken;
  return result;
}
async function records(path) {
  let cursor = null;
  const result = [];
  do {
    const query = new URLSearchParams({ limit: "100" });
    if (cursor) query.set("cursor", cursor);
    const page = await request(`${path}?${query}`);
    result.push(...page.data);
    cursor = page.meta.nextCursor;
  } while (cursor);
  return result;
}
let authenticated = false;
try {
  const account = JSON.parse(
    readFileSync(
      new URL("../.secrets/demo-accounts.json", import.meta.url),
      "utf8",
    ),
  ).find((item) => item.role === "CLIENT");
  if (!account)
    throw new Error("Crie as contas locais de demonstração primeiro.");
  await request("/auth/session");
  await request("/auth/login", "POST", {
    email: account.email,
    password: account.password,
  });
  authenticated = true;
  const name = "PC de demonstração — 8 peças";
  let build = (await records("/builds/my")).find((item) => item.name === name);
  if (!build)
    build = (
      await request("/builds", "POST", {
        name,
        paymentMethod: "pix",
        partIds: {
          cpu: "ryzen",
          gpu: "rtx4090",
          mobo: "tuf-b650",
          ram: "corsair",
          storage: "samsung",
          psu: "rm1000e",
          case: "5000d",
          cooler: "nh-u12a",
        },
      })
    ).data;
  const existing = (await records("/orders/my")).find(
    (order) => order.buildId === build.id,
  );
  let hasReceipt = Boolean(existing);
  if (!existing) {
    const current = (
      await request("/builds/analyze", "POST", {
        partIds: build.partIds,
        paymentMethod: "pix",
      })
    ).data;
    if (current.comparison.optimized.complete) {
      const card = (await request("/orders/card", "POST", {})).data;
      const body = { buildId: build.id, idempotencyKey: randomUUID(), card };
      const [first, second] = await Promise.all([
        request("/orders/checkout-dream", "POST", body),
        request("/orders/checkout-dream", "POST", body),
      ]);
      if (first.data.id !== second.data.id)
        throw new Error("A verificação de idempotência não passou.");
      console.log(
        "Pedido fictício criado; duas requisições simultâneas produziram o mesmo registro.",
      );
      hasReceipt = true;
    } else
      console.log(
        "Montagem salva. Recibo não criado: há peças sem oferta disponível. Nenhum estoque ou preço foi inventado.",
      );
  }
  console.log(
    hasReceipt
      ? "Montagem e recibo de demonstração disponíveis na conta CLIENT, sem cobrança."
      : "Montagem de demonstração disponível para análise e bancada na conta CLIENT.",
  );
} catch {
  console.error(
    `Não foi possível preparar o percurso na etapa: ${step}. Confira a API e as contas de demonstração.`,
  );
  process.exitCode = 1;
} finally {
  if (authenticated) await request("/auth/logout", "POST", {}).catch(() => {});
}
