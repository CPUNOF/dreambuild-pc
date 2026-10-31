import assert from "node:assert/strict";
import { test } from "node:test";
import session from "express-session";
import { createApp } from "../src/app.js";
import { User } from "../src/models/User.js";
import { Component } from "../src/models/Component.js";
import { parseComponent } from "../src/models/ComponentInput.js";
import { Offer } from "../src/models/Offer.js";
import { AppError } from "../src/errors/AppError.js";
import { products } from "../../frontend/src/data/products.js";

test("metadados 3D aceitam somente GLB local com legenda e sinalização explícita", () => {
  const product = products[0];
  const base = {
    url: "/models/gpu-triple-fan.glb",
    caption: "Modelo original didático, sem reprodução dimensional oficial.",
    hasRgb: true,
  };
  assert.equal(
    parseComponent({ ...product, model3d: base }).model3d.url,
    base.url,
  );
  for (const url of [
    "https://example.com/model.glb",
    "/models/../../secrets.glb",
    "/models/gpu.glb?token=x",
  ])
    assert.throws(() =>
      parseComponent({ ...product, model3d: { ...base, url } }),
    );
});

test("admin CRUD exige sessão e papel, valida dados e preserva URL; cliente recebe 403", async () => {
  const hash = await User.hash("senha-teste-admin-123");
  const users = [
    {
      id: "admin",
      name: "Admin",
      email: "admin@example.test",
      role: "ADMIN",
      passwordHash: hash,
    },
    {
      id: "client",
      name: "Cliente",
      email: "client@example.test",
      role: "CLIENT",
      passwordHash: hash,
    },
  ];
  const records = new Map();
  const dao = {
    async list() {
      return {
        items: [...records].map(([id, data]) => new Component(id, data)),
        nextCursor: null,
      };
    },
    async getById(id) {
      return records.has(id) ? new Component(id, records.get(id)) : null;
    },
    async create(data) {
      if (records.has(data.slug)) throw new AppError(409, "Produto existente.");
      records.set(data.slug, data);
      return new Component(data.slug, data);
    },
    async update(id, data) {
      records.set(id, data);
      return new Component(id, data);
    },
    async delete(id) {
      records.delete(id);
    },
  };
  const app = createApp({
    componentDAO: dao,
    userDAO: {
      async findByEmail(email) {
        return users.find((user) => user.email === email);
      },
      async getById(id) {
        return users.find((user) => user.id === id);
      },
    },
    sessionStore: new session.MemoryStore(),
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = "",
    csrf = "";
  async function request(path, method = "GET", body, token = csrf) {
    const res = await fetch(base + path, {
      method,
      headers: {
        Cookie: cookie,
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { "X-CSRF-Token": token } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (res.headers.getSetCookie().length)
      cookie = res.headers.getSetCookie().at(-1).split(";")[0];
    const data = await res.json();
    if (data.data && Object.hasOwn(data.data, "csrfToken"))
      csrf = data.data.csrfToken;
    return { status: res.status, body: data };
  }
  try {
    assert.equal(
      (await request("/api/admin/components", "POST", {})).status,
      401,
    );
    await request("/api/auth/session");
    await request("/api/auth/login", "POST", {
      email: "client@example.test",
      password: "senha-teste-admin-123",
    });
    assert.equal(
      (await request("/api/admin/components", "POST", products[0])).status,
      403,
    );
    assert.equal(records.size, 0);
    await request("/api/auth/logout", "POST");
    await request("/api/auth/session");
    await request("/api/auth/login", "POST", {
      email: "admin@example.test",
      password: "senha-teste-admin-123",
    });
    assert.equal(
      (await request("/api/admin/components", "POST", products[0], "errado"))
        .status,
      403,
    );
    assert.equal(
      (await request("/api/admin/components", "POST", { name: "incompleto" }))
        .status,
      400,
    );
    const input = {
      ...products[0],
      slug: "qa-product",
      name: "Produto de teste",
    };
    const created = await request("/api/admin/components", "POST", input);
    assert.equal(created.status, 201);
    assert.equal(created.body.data.id, "qa-product");
    assert.equal(
      (await request("/api/admin/components", "POST", input)).status,
      409,
    );
    const offer = {
      store: "kabum",
      priceCents: 123456,
      availability: "in_stock",
      paymentMethod: "pix",
      sourceUrl: "https://www.kabum.com.br/produto/123/exemplo",
      checkedAt: new Date().toISOString(),
    };
    const updated = await request("/api/admin/components/qa-product", "PUT", {
      name: "Produto atualizado",
      offers: [offer],
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.name, "Produto atualizado");
    assert.equal(updated.body.data.offers[0].priceCents, 123456);
    assert.equal(
      (
        await request("/api/admin/components/qa-product", "PATCH", {
          slug: "mudar-url",
        })
      ).status,
      400,
    );
    assert.equal(
      (await request("/api/admin/components/a%2Fb%2Fc", "DELETE")).status,
      400,
    );
    assert.equal(
      (await request("/api/admin/components/qa-product", "DELETE")).status,
      200,
    );
    assert.equal(records.size, 0);
    assert.equal(
      (await request("/api/admin/components/qa-product", "DELETE")).status,
      404,
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("ofertas rejeitam preço inválido, fonte incompatível, duplicação e data futura", () => {
  const valid = {
    store: "pichau",
    priceCents: 10000,
    paymentMethod: "pix",
    availability: "in_stock",
    sourceUrl: "https://www.pichau.com.br/produto-exemplo",
    checkedAt: new Date().toISOString(),
  };
  for (const patch of [
    { priceCents: 0 },
    { priceCents: 1.5 },
    { priceCents: null },
    { sourceUrl: "https://pichau.com.br.evil.test/x" },
    { sourceUrl: "http://www.pichau.com.br/x" },
    { checkedAt: "2999-01-01T00:00:00Z" },
    { store: "outra" },
  ])
    assert.throws(() => Offer.parseMany([{ ...valid, ...patch }]), AppError);
  assert.throws(() => Offer.parseMany([valid, valid]), AppError);
  assert.equal(
    Offer.parseMany([
      { ...valid, availability: "out_of_stock", priceCents: null },
    ])[0].priceCents,
    null,
  );
  assert.equal(Offer.eligible(valid), true);
  assert.equal(Offer.eligible({ ...valid, availability: "unknown" }), false);
  assert.equal(Offer.eligible(valid, "card"), false);
});

test("dados de componente não aceitam imagens com travessia e números técnicos inválidos", () => {
  assert.throws(
    () =>
      parseComponent({
        ...products[0],
        image: "/hardware/../.secrets/key.json",
      }),
    AppError,
  );
  assert.throws(
    () => parseComponent({ ...products[0], hardware: { lengthMm: -1 } }),
    AppError,
  );
  assert.throws(
    () => parseComponent({ ...products[0], offers: { kabum: 123 } }),
    AppError,
  );
});
