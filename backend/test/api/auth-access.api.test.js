// CT-API-01 a CT-API-06 — Autenticação e controle de acesso pela API REST.
// Exercita Express + middlewares + controllers + models + DAO (em memória).
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { startServer, PASSWORD } from "../support/memory.js";

let ctx;
before(async () => (ctx = await startServer()));
after(() => ctx.close());

const envelope = (body) =>
  assert.deepEqual(Object.keys(body).sort(), [
    "data",
    "errors",
    "message",
    "meta",
    "status",
  ]);

describe("CT-API-01 GET /api/auth/session", () => {
  test("visitante recebe 200, user null, token CSRF e cookie HttpOnly", async () => {
    const res = await ctx.client().get("/api/auth/session");
    assert.equal(res.status, 200);
    envelope(res.body);
    assert.equal(res.body.data.user, null);
    assert.match(res.body.data.csrfToken, /^[A-Za-z0-9_-]{20,}$/);
    assert.match(res.headers.get("set-cookie"), /HttpOnly/);
    assert.equal(res.headers.get("cache-control"), "no-store");
  });
});

describe("CT-API-02 POST /api/auth/register", () => {
  const body = {
    name: "Nova Pessoa",
    email: "nova@dreambuild.test",
    password: "senha-forte-1",
  };

  test("201 cria CLIENT mesmo se o corpo pedir ADMIN e não devolve hash", async () => {
    const api = ctx.client();
    await api.get("/api/auth/session");
    const res = await api.post("/api/auth/register", {
      ...body,
      role: "ADMIN",
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.user.role, "CLIENT");
    assert.equal(res.body.data.user.passwordHash, undefined);
    assert.equal(
      (await api.get("/api/auth/session")).body.data.user.email,
      body.email,
    );
  });

  test("409 para e-mail já cadastrado (sem diferenciar maiúsculas)", async () => {
    const api = ctx.client();
    await api.get("/api/auth/session");
    const res = await api.post("/api/auth/register", {
      ...body,
      email: "NOVA@dreambuild.test",
    });
    assert.equal(res.status, 409);
    assert.equal(res.body.status, "error");
  });

  for (const [label, over] of [
    ["nome com 1 caractere", { name: "A" }],
    ["e-mail inválido", { email: "sem-arroba" }],
    ["senha com 7 caracteres", { password: "1234567" }],
  ])
    test(`400 com ${label}`, async () => {
      const api = ctx.client();
      await api.get("/api/auth/session");
      const res = await api.post("/api/auth/register", {
        ...body,
        email: "x@y.test",
        ...over,
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.data, null);
    });

  test("403 CSRF_INVALID quando o token CSRF não é enviado", async () => {
    const api = ctx.client();
    await api.get("/api/auth/session");
    const res = await api.post(
      "/api/auth/register",
      { ...body, email: "csrf@y.test" },
      { csrfToken: "" },
    );
    assert.equal(res.status, 403);
    assert.equal(res.body.errors[0].code, "CSRF_INVALID");
    assert.equal(await ctx.userDAO.findByEmail("csrf@y.test"), null);
  });
});

describe("CT-API-03 POST /api/auth/login", () => {
  test("200 com credenciais válidas e renova o cookie de sessão", async () => {
    const api = ctx.client();
    const before = await api.get("/api/auth/session");
    const res = await api.login("cliente@dreambuild.test");
    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.name, "Cliente Teste");
    assert.notEqual(
      res.headers.get("set-cookie"),
      before.headers.get("set-cookie"),
    );
  });

  test("e-mail é aceito com maiúsculas e espaços", async () => {
    const res = await ctx.client().login("  CLIENTE@DreamBuild.test ");
    assert.equal(res.status, 200);
  });

  // Mesma mensagem para senha errada, e-mail inexistente e conta desativada
  // (evita enumeração de contas).
  for (const [label, email, password] of [
    ["senha incorreta", "cliente@dreambuild.test", "senha-errada-1"],
    ["e-mail inexistente", "ninguem@dreambuild.test", PASSWORD],
    ["conta desativada", "desativada@dreambuild.test", PASSWORD],
  ])
    test(`401 genérico para ${label}`, async () => {
      const res = await ctx.client().login(email, password);
      assert.equal(res.status, 401);
      assert.equal(res.body.message, "E-mail ou senha incorretos.");
    });

  for (const [label, body] of [
    ["corpo vazio", {}],
    ["senha vazia", { email: "a@b.co", password: "" }],
    [
      "senha com 129 caracteres",
      { email: "a@b.co", password: "a".repeat(129) },
    ],
    ["e-mail numérico", { email: 1, password: "12345678" }],
  ])
    test(`400 para ${label}`, async () => {
      const api = ctx.client();
      await api.get("/api/auth/session");
      assert.equal((await api.post("/api/auth/login", body)).status, 400);
    });
});

describe("CT-API-04 limite de tentativas de login", () => {
  test("após o limite configurado a API responde 429", async () => {
    const limited = await startServer({ authLimit: 10 });
    try {
      const statuses = [];
      const api = limited.client();
      for (let i = 0; i < 11; i++)
        statuses.push(
          (await api.login("cliente@dreambuild.test", "errada-123")).status,
        );
      assert.deepEqual(statuses.slice(0, 10), Array(10).fill(401));
      assert.equal(statuses[10], 429);
    } finally {
      await limited.close();
    }
  });
});

describe("CT-API-05 POST /api/auth/logout", () => {
  test("encerra a sessão: rota privada volta a responder 401", async () => {
    const api = ctx.client();
    await api.login("cliente@dreambuild.test");
    assert.equal((await api.get("/api/orders/my")).status, 200);
    const res = await api.post("/api/auth/logout");
    assert.equal(res.status, 200);
    assert.equal(res.body.data.user, null);
    assert.equal((await api.get("/api/orders/my")).status, 401);
  });
});

// CT-FUN-01 — Tabela de decisão do controle de acesso.
// Condições: perfil (visitante | CLIENT | ADMIN) × tipo de rota.
// Ações: permitir (2xx) | 401 não autenticado | 403 sem permissão.
describe("CT-API-06 / CT-FUN-01 tabela de decisão de acesso", () => {
  const routes = [
    ["pública", "GET", "/api/components?limit=5"],
    ["privada", "GET", "/api/orders/my"],
    ["privada", "GET", "/api/builds/my"],
    ["admin", "GET", "/api/admin/metrics"],
  ];
  const expected = {
    visitante: { pública: 200, privada: 401, admin: 401 },
    CLIENT: { pública: 200, privada: 200, admin: 403 },
    ADMIN: { pública: 200, privada: 200, admin: 200 },
  };
  const login = {
    visitante: null,
    CLIENT: "cliente@dreambuild.test",
    ADMIN: "admin@dreambuild.test",
  };
  for (const [profile, row] of Object.entries(expected))
    for (const [kind, method, path] of routes)
      test(`${profile} em rota ${kind} ${method} ${path} → ${row[kind]}`, async () => {
        const api = ctx.client();
        if (login[profile]) await api.login(login[profile]);
        const res = await api.request(path, { method });
        assert.equal(res.status, row[kind]);
      });

  test("conta desativada após o login perde acesso (401)", async () => {
    const api = ctx.client();
    await api.login("cliente@dreambuild.test");
    const user = ctx.userDAO.data.get("u-client");
    user.disabled = true;
    try {
      assert.equal((await api.get("/api/orders/my")).status, 401);
    } finally {
      user.disabled = false;
    }
  });
});
