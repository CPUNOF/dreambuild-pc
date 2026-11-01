// CT-API-13 a CT-API-16 — Documentação Swagger/OpenAPI como contrato.
// Garante que a documentação é válida, cobre todas as rotas reais, é servida
// pela API e que as respostas reais usam apenas códigos documentados.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import SwaggerParser from "@apidevtools/swagger-parser";
import { openapi } from "../../src/config/openapi.js";
import { startServer, FIXTURE_IDS } from "../support/memory.js";

let ctx;
before(async () => (ctx = await startServer()));
after(() => ctx.close());

const toOpenApi = (path) => path.replace(/:(\w+)/g, "{$1}");

function expressRoutes(app) {
  const routes = [];
  for (const layer of app.router.stack) {
    const route = layer.route;
    if (
      !route ||
      typeof route.path !== "string" ||
      !route.path.startsWith("/api")
    )
      continue;
    for (const method of Object.keys(route.methods))
      routes.push(`${method.toUpperCase()} ${toOpenApi(route.path)}`);
  }
  return [...new Set(routes)].sort();
}
const documented = Object.entries(openapi.paths)
  .flatMap(([path, ops]) =>
    Object.keys(ops).map((m) => `${m.toUpperCase()} ${path}`),
  )
  .sort();

describe("CT-API-13 a especificação é OpenAPI 3.0 válida", () => {
  test("passa no validador oficial (swagger-parser)", async () => {
    await assert.doesNotReject(
      SwaggerParser.validate(structuredClone(openapi)),
    );
  });
  test("toda operação tem resumo, tag, operationId único e resposta 500", () => {
    const ids = new Set();
    for (const [path, ops] of Object.entries(openapi.paths))
      for (const [method, op] of Object.entries(ops)) {
        const where = `${method.toUpperCase()} ${path}`;
        assert.ok(op.summary, `${where} sem summary`);
        assert.equal(op.tags?.length, 1, `${where} sem tag`);
        assert.ok(
          !ids.has(op.operationId),
          `operationId repetido: ${op.operationId}`,
        );
        ids.add(op.operationId);
        assert.ok(op.responses["500"], `${where} sem 500`);
      }
  });
  test("rotas autenticadas documentam 401; alterações documentam 403 (CSRF)", () => {
    for (const [path, ops] of Object.entries(openapi.paths))
      for (const [method, op] of Object.entries(ops)) {
        const auth = op.security?.some((s) => "cookieAuth" in s);
        if (auth) assert.ok(op.responses["401"], `${method} ${path} sem 401`);
        if (method !== "get")
          assert.ok(op.responses["403"], `${method} ${path} sem 403`);
      }
  });
});

describe("CT-API-14 documentação cobre exatamente as rotas reais", () => {
  test("nenhuma rota do Express fica sem documentação e nada documentado deixa de existir", () => {
    const real = expressRoutes(ctx.app);
    assert.ok(real.length >= 40, `só ${real.length} rotas encontradas`);
    assert.deepEqual(
      real.filter((r) => !documented.includes(r)),
      [],
      "rotas sem documentação",
    );
    assert.deepEqual(
      documented.filter((r) => !real.includes(r)),
      [],
      "documentadas mas inexistentes",
    );
  });
});

describe("CT-API-15 a documentação é servida pela API", () => {
  test("GET /openapi.json devolve a mesma especificação", async () => {
    const res = await fetch(`${ctx.base}/openapi.json`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), JSON.parse(JSON.stringify(openapi)));
  });
  test("docs/api/openapi.json exportado está atualizado", () => {
    const exported = JSON.parse(
      readFileSync(new URL("../../../docs/api/openapi.json", import.meta.url)),
    );
    assert.deepEqual(
      exported,
      JSON.parse(JSON.stringify(openapi)),
      "rode: npm run docs:api --workspace backend",
    );
  });
  test("GET /api-docs/ devolve a interface Swagger UI", async () => {
    const res = await fetch(`${ctx.base}/api-docs/`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /text\/html/);
    assert.match(await res.text(), /swagger-ui/i);
  });
});

// Contrato: executa cenários reais (sucesso e erro) e exige que o código
// devolvido esteja documentado para aquela operação, com o envelope certo.
describe("CT-API-16 respostas reais usam somente códigos documentados", () => {
  const key = () => randomUUID().replaceAll("-", "");
  const checked = [];
  async function call(api, method, path, template, body, opts) {
    const res = await api.request(path, { method, body, ...opts });
    const op = openapi.paths[template]?.[method.toLowerCase()];
    assert.ok(op, `operação não documentada: ${method} ${template}`);
    assert.ok(
      op.responses[String(res.status)],
      `${method} ${path} respondeu ${res.status}, documentados: ${Object.keys(op.responses)}`,
    );
    assert.deepEqual(Object.keys(res.body).sort(), [
      "data",
      "errors",
      "message",
      "meta",
      "status",
    ]);
    assert.equal(res.body.status, res.status < 400 ? "success" : "error");
    checked.push(`${method} ${template} → ${res.status}`);
    return res;
  }

  test("cenários de visitante, cliente e administrador", async () => {
    const visitor = ctx.client();
    await call(visitor, "GET", "/api/health", "/api/health");
    await call(visitor, "GET", "/api/auth/session", "/api/auth/session");
    await call(visitor, "GET", "/api/components?limit=2", "/api/components");
    await call(visitor, "GET", "/api/components?limit=0", "/api/components");
    await call(
      visitor,
      "GET",
      `/api/components/${FIXTURE_IDS.gpu}`,
      "/api/components/{id}",
    );
    await call(
      visitor,
      "GET",
      "/api/components/nao-existe",
      "/api/components/{id}",
    );
    await call(visitor, "GET", "/api/components/a.b", "/api/components/{id}");
    await call(visitor, "GET", "/api/cart", "/api/cart");
    await call(
      visitor,
      "PUT",
      `/api/cart/items/${FIXTURE_IDS.ssd}`,
      "/api/cart/items/{id}",
      { quantity: 1 },
    );
    await call(
      visitor,
      "PUT",
      `/api/cart/items/${FIXTURE_IDS.ssd}`,
      "/api/cart/items/{id}",
      { quantity: 11 },
    );
    await call(
      visitor,
      "PUT",
      "/api/cart/items/nao-existe",
      "/api/cart/items/{id}",
      { quantity: 1 },
    );
    await call(
      visitor,
      "PUT",
      `/api/cart/items/${FIXTURE_IDS.cpuNoOffer}`,
      "/api/cart/items/{id}",
      { quantity: 1 },
    );
    await call(
      visitor,
      "PUT",
      `/api/cart/items/${FIXTURE_IDS.ssd}`,
      "/api/cart/items/{id}",
      { quantity: 1 },
      { csrfToken: "" },
    );
    await call(
      visitor,
      "DELETE",
      `/api/cart/items/${FIXTURE_IDS.ssd}`,
      "/api/cart/items/{id}",
    );
    await call(visitor, "DELETE", "/api/cart", "/api/cart");
    await call(visitor, "GET", "/api/orders/my", "/api/orders/my");
    await call(
      visitor,
      "POST",
      "/api/admin/components",
      "/api/admin/components",
      { name: "x" },
    );
    await call(visitor, "GET", "/api/games?limit=0", "/api/games");
    await call(visitor, "GET", "/api/games", "/api/games");
    await call(visitor, "POST", "/api/auth/register", "/api/auth/register", {
      name: "A",
      email: "x",
      password: "1",
    });
    await call(visitor, "POST", "/api/auth/register", "/api/auth/register", {
      name: "Contrato",
      email: `contrato-${key()}@dreambuild.test`,
      password: "senha-forte-123",
    });

    const client = ctx.client();
    await client.get("/api/auth/session");
    await call(client, "POST", "/api/auth/login", "/api/auth/login", {
      email: "cliente@dreambuild.test",
      password: "errada-123",
    });
    await call(client, "POST", "/api/auth/login", "/api/auth/login", {
      email: "cliente@dreambuild.test",
      password: "senha-de-teste-123",
    });
    await call(client, "POST", "/api/auth/register", "/api/auth/register", {
      name: "Duplicado",
      email: "admin@dreambuild.test",
      password: "senha-forte-123",
    });
    await client.login("cliente@dreambuild.test");
    await call(client, "GET", "/api/admin/metrics", "/api/admin/metrics");
    await call(
      client,
      "PUT",
      `/api/cart/items/${FIXTURE_IDS.ssd}`,
      "/api/cart/items/{id}",
      { quantity: 2 },
    );
    const cart = (await call(client, "GET", "/api/cart", "/api/cart")).body
      .data;
    const card = (
      await call(client, "POST", "/api/orders/card", "/api/orders/card")
    ).body.data;
    const items = [{ componentId: FIXTURE_IDS.ssd, quantity: 2 }];
    await call(
      client,
      "POST",
      "/api/orders/checkout-cart",
      "/api/orders/checkout-cart",
      { idempotencyKey: key(), card, items, quoteVersion: "velha" },
    );
    await call(
      client,
      "POST",
      "/api/orders/checkout-cart",
      "/api/orders/checkout-cart",
      { idempotencyKey: "curta", card, items, quoteVersion: cart.quoteVersion },
    );
    const order = await call(
      client,
      "POST",
      "/api/orders/checkout-cart",
      "/api/orders/checkout-cart",
      {
        idempotencyKey: key(),
        card,
        items,
        quoteVersion: cart.quoteVersion,
      },
    );
    assert.equal(order.status, 201);
    await call(client, "GET", "/api/orders/my", "/api/orders/my");
    await call(
      client,
      "GET",
      `/api/orders/${order.body.data.id}`,
      "/api/orders/{id}",
    );
    await call(client, "GET", "/api/orders/nao-existe", "/api/orders/{id}");
    await call(client, "GET", "/api/builds/my", "/api/builds/my");
    await call(client, "GET", "/api/builds/nao-existe", "/api/builds/{id}");
    await call(client, "POST", "/api/auth/logout", "/api/auth/logout");

    const admin = ctx.client();
    await admin.login("admin@dreambuild.test");
    await call(admin, "GET", "/api/admin/metrics", "/api/admin/metrics");
    await call(
      admin,
      "POST",
      "/api/admin/components",
      "/api/admin/components",
      { name: "incompleto" },
    );
    await call(
      admin,
      "PUT",
      "/api/admin/components/nao-existe",
      "/api/admin/components/{id}",
      { name: "x" },
    );
    await call(
      admin,
      "PATCH",
      `/api/admin/components/${FIXTURE_IDS.ssd}`,
      "/api/admin/components/{id}",
      { slug: "outro" },
    );
    await call(
      admin,
      "PUT",
      `/api/admin/components/${FIXTURE_IDS.ssd}`,
      "/api/admin/components/{id}",
      { name: "SSD renomeado" },
    );
    await call(
      admin,
      "DELETE",
      "/api/admin/components/nao-existe",
      "/api/admin/components/{id}",
    );
    const game = {
      id: "contrato",
      title: "Jogo do contrato",
      weight: 1,
      coverUrl: "/games/capa.jpg",
      screenshotUrl: "/games/cena.jpg",
      sourceUrl: "https://store.steampowered.com/app/1/",
    };
    await call(admin, "POST", "/api/admin/games", "/api/admin/games", game);
    await call(admin, "POST", "/api/admin/games", "/api/admin/games", game);
    await call(
      admin,
      "PUT",
      "/api/admin/games/contrato",
      "/api/admin/games/{id}",
      { weight: 2 },
    );
    await call(
      admin,
      "DELETE",
      "/api/admin/games/contrato",
      "/api/admin/games/{id}",
    );
    await call(
      admin,
      "DELETE",
      "/api/admin/games/contrato",
      "/api/admin/games/{id}",
    );

    assert.ok(
      checked.length >= 45,
      `apenas ${checked.length} chamadas verificadas`,
    );
  });
});
