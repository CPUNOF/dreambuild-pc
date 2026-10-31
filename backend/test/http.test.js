import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createApp } from "../src/app.js";

let server;
let baseUrl;

before(async () => {
  server = createApp({ origins: "http://localhost:5173" }).listen(
    0,
    "127.0.0.1",
  );
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

test("saúde informa que o servidor responde sem declarar banco conectado", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /application\/json/);
  assert.equal(body.status, "success");
  assert.equal(body.data.database, "not-configured");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-powered-by"), null);
});

test("rota inexistente mantém envelope JSON e status HTTP de erro", async () => {
  const response = await fetch(`${baseUrl}/api/nao-existe`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    status: "error",
    message: "Rota não encontrada.",
    data: null,
    errors: [],
    meta: {},
  });
});

test("JSON malformado recebe 400 sem revelar stack trace", async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{invalido",
  });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.message, "JSON inválido.");
  assert.equal(body.stack, undefined);
});

test("payload excessivo recebe 413", async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: "x".repeat(110_000) }),
  });
  assert.equal(response.status, 413);
  assert.equal((await response.json()).status, "error");
});

test("origem autorizada recebe permissão explícita com credenciais", async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: "http://localhost:5173" },
  });
  assert.equal(
    response.headers.get("access-control-allow-origin"),
    "http://localhost:5173",
  );
  assert.equal(
    response.headers.get("access-control-allow-credentials"),
    "true",
  );
});

test("origem não autorizada não recebe permissão CORS", async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: "https://outro-site.example" },
  });
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});

test("preflight permite métodos do contrato sem wildcard de origem", async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:5173",
      "Access-Control-Request-Method": "PATCH",
      "Access-Control-Request-Headers": "Content-Type",
    },
  });
  assert.equal(response.status, 204);
  assert.equal(
    response.headers.get("access-control-allow-origin"),
    "http://localhost:5173",
  );
  assert.match(response.headers.get("access-control-allow-methods"), /PATCH/);
});
