import assert from "node:assert/strict";
import { test } from "node:test";
import session from "express-session";
import { createApp } from "../src/app.js";
import { User } from "../src/models/User.js";
import { AppError } from "../src/errors/AppError.js";

function users() {
  const data = new Map();
  return {
    data,
    async getById(id) {
      return data.get(id) || null;
    },
    async findByEmail(email) {
      return [...data.values()].find((user) => user.email === email) || null;
    },
    async create(input) {
      if (await this.findByEmail(input.email))
        throw new AppError(409, "Este e-mail já possui cadastro.");
      const user = { ...input, id: String(data.size + 1) };
      data.set(user.id, user);
      return user;
    },
  };
}
async function harness(action, authLimit = 10) {
  const dao = users();
  const app = createApp({
    userDAO: dao,
    sessionStore: new session.MemoryStore(),
    authLimit,
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = "";
  let csrf = "";
  async function request(path, method = "GET", body, token = csrf) {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { "X-CSRF-Token": token } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const set = response.headers.getSetCookie();
    if (set.length) cookie = set.at(-1).split(";")[0];
    const value = await response.json();
    if (value.data && Object.hasOwn(value.data, "csrfToken"))
      csrf = value.data.csrfToken;
    return { response, body: value, cookie };
  }
  try {
    await action({ request, dao, base });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("cadastro força CLIENT, remove hash da resposta, renova sessão e logout invalida cookie", () =>
  harness(async ({ request, dao }) => {
    const initial = await request("/api/auth/session");
    const original = initial.cookie;
    assert.match(initial.response.headers.get("set-cookie"), /HttpOnly/);
    assert.match(initial.response.headers.get("set-cookie"), /SameSite=Lax/);
    const created = await request("/api/auth/register", "POST", {
      name: "Cliente teste",
      email: "CLIENTE@example.test",
      password: "senha-de-teste-123",
      role: "ADMIN",
    });
    assert.equal(created.response.status, 201);
    assert.equal(created.body.data.user.role, "CLIENT");
    assert.equal(created.body.data.user.passwordHash, undefined);
    assert.notEqual(created.cookie, original);
    assert.ok(
      (await dao.findByEmail("cliente@example.test")).passwordHash.startsWith(
        "scrypt:",
      ),
    );
    assert.equal(
      (await request("/api/auth/session")).body.data.user.email,
      "cliente@example.test",
    );
    assert.equal(
      (await request("/api/auth/session")).response.headers.getSetCookie()
        .length,
      0,
      "Leitura sem alteração não reenvia um cookie antigo após outra aba autenticar.",
    );
    assert.equal(
      (await request("/api/auth/logout", "POST")).response.status,
      200,
    );
    assert.equal((await request("/api/auth/session")).body.data.user, null);
  }));

test("CSRF ausente ou inválido bloqueia cadastro antes de criar usuário", () =>
  harness(async ({ request, dao }) => {
    await request("/api/auth/session");
    const result = await request(
      "/api/auth/register",
      "POST",
      { name: "Teste", email: "a@example.test", password: "senha-teste-123" },
      "incorreto",
    );
    assert.equal(result.response.status, 403);
    assert.equal(dao.data.size, 0);
  }));

test("conta desabilitada perde o perfil na consulta de sessão e acesso privado", () =>
  harness(async ({ request, dao }) => {
    await request("/api/auth/session");
    const created = await request("/api/auth/register", "POST", {
      name: "Conta desabilitada",
      email: "disabled@example.test",
      password: "senha-de-teste-123",
    });
    dao.data.get(created.body.data.user.id).disabled = true;
    assert.equal((await request("/api/auth/session")).body.data.user, null);
    assert.equal((await request("/api/builds/my")).response.status, 401);
  }));

test("login inválido é genérico; login válido preserva a conta e não o segredo", () =>
  harness(async ({ request }) => {
    await request("/api/auth/session");
    await request("/api/auth/register", "POST", {
      name: "Teste",
      email: "a@example.test",
      password: "senha-teste-123",
    });
    await request("/api/auth/logout", "POST");
    await request("/api/auth/session");
    const missing = await request("/api/auth/login", "POST", {
      email: "nao-existe@example.test",
      password: "incorreta",
    });
    const wrong = await request("/api/auth/login", "POST", {
      email: "a@example.test",
      password: "incorreta",
    });
    assert.equal(missing.response.status, 401);
    assert.equal(wrong.response.status, 401);
    assert.equal(missing.body.message, wrong.body.message);
    const login = await request("/api/auth/login", "POST", {
      email: "A@example.test",
      password: "senha-teste-123",
    });
    assert.equal(login.response.status, 200);
    assert.equal(login.body.data.user.passwordHash, undefined);
  }));

test("tentativas malsucedidas de login atingem 429", () =>
  harness(async ({ request }) => {
    await request("/api/auth/session");
    await request("/api/auth/login", "POST", {
      email: "n@example.test",
      password: "errada",
    });
    assert.equal(
      (
        await request("/api/auth/login", "POST", {
          email: "n@example.test",
          password: "errada",
        })
      ).response.status,
      429,
    );
  }, 1));

test("hashes usam salts distintos e aceitam somente a senha correta", async () => {
  const one = await User.hash("senha-teste-123");
  const two = await User.hash("senha-teste-123");
  assert.notEqual(one, two);
  assert.equal(await User.verify("senha-teste-123", one), true);
  assert.equal(await User.verify("errada", one), false);
  assert.equal(await User.verify("errada", undefined), false);
});
