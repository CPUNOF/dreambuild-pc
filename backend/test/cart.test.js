import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import session from "express-session";
import { Cart } from "../src/models/Cart.js";
import { createApp } from "../src/app.js";
import { User } from "../src/models/User.js";
import { products } from "../../frontend/src/data/products.js";
import { AppError } from "../src/errors/AppError.js";

test("carrinho valida limites e multiplica preços sem alterar a oferta original", () => {
  for (const lines of [
    [{ componentId: "x", quantity: 0 }],
    [{ componentId: "x", quantity: 11 }],
    [{ componentId: "../secret", quantity: 1 }],
    [
      { componentId: "x", quantity: 1 },
      { componentId: "x", quantity: 2 },
    ],
  ])
    assert.throws(() => Cart.lines(lines));
  const part = {
    ...products[1],
    inventory: { quantity: 10, unitPriceCents: 12345 },
    offers: [
      {
        store: "kabum",
        paymentMethod: "pix",
        availability: "in_stock",
        priceCents: 12345,
        sourceUrl: "https://www.kabum.com.br/produto/1/teste",
        checkedAt: new Date().toISOString(),
      },
    ],
  };
  const summary = Cart.summarize(
    [{ componentId: part.id, quantity: 3 }],
    [part],
  );
  assert.equal(summary.totalCents, 37035);
  assert.equal(summary.items[0].unitPriceCents, 12345);
  assert.equal(part.offers[0].priceCents, 12345);
  assert.equal(
    Cart.summarize([{ componentId: "missing", quantity: 1 }], [null])
      .totalCents,
    null,
  );
});

test("peça avulsa mantém carrinho no login, exige cotação atual e checkout é privado/idempotente", async () => {
  const password = "senha-cart-teste";
  const hash = await User.hash(password);
  const users = ["a", "b"].map((id) => ({
    id,
    name: "Cliente " + id,
    email: id + "@example.test",
    passwordHash: hash,
    role: "CLIENT",
  }));
  const parts = products.map((part) => ({
    ...part,
    inventory: { quantity: 10, unitPriceCents: 10000 },
    offers: [
      {
        store: "kabum",
        paymentMethod: "pix",
        availability: "in_stock",
        priceCents: 10000,
        sourceUrl: "https://www.kabum.com.br/produto/1/teste",
        checkedAt: new Date().toISOString(),
      },
    ],
  }));
  const orders = new Map(),
    keys = new Map();
  const app = createApp({
    sessionStore: new session.MemoryStore(),
    userDAO: {
      async findByEmail(email) {
        return users.find((user) => user.email === email);
      },
      async getById(id) {
        return users.find((user) => user.id === id);
      },
    },
    componentDAO: {
      async getById(id) {
        return parts.find((part) => part.id === id) || null;
      },
      async getMany(ids) {
        return ids.map((id) => parts.find((part) => part.id === id) || null);
      },
    },
    orderDAO: {
      async replay(uid, key, hash) {
        const found = keys.get(uid + key);
        if (!found) return null;
        if (found.hash !== hash)
          throw new AppError(409, "Conflito de tentativa.");
        return orders.get(found.id);
      },
      async createIdempotent(uid, key, hash, doc) {
        const previous = await this.replay(uid, key, hash);
        if (previous) return previous;
        const value = { id: randomUUID(), userId: uid, ...doc };
        orders.set(value.id, value);
        keys.set(uid + key, { id: value.id, hash });
        return value;
      },
      async getById(id) {
        return orders.get(id);
      },
    },
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  function client() {
    const jar = new Map();
    let csrf = "";
    return async (path, method = "GET", body) => {
      const response = await fetch(base + path, {
        method,
        headers: {
          Cookie: [...jar].map(([key, value]) => `${key}=${value}`).join("; "),
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...(csrf ? { "X-CSRF-Token": csrf } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      for (const item of response.headers.getSetCookie()) {
        const text = item.split(";")[0],
          i = text.indexOf("=");
        jar.set(text.slice(0, i), text.slice(i + 1));
      }
      const result = await response.json();
      if (result.data?.csrfToken) csrf = result.data.csrfToken;
      return { ...result, status: response.status };
    };
  }
  try {
    const a = client(),
      b = client();
    await a("/api/auth/session");
    assert.equal(
      (await a("/api/cart/items/ryzen", "PUT", { quantity: 2, priceCents: 1 }))
        .data.totalCents,
      20000,
    );
    assert.equal(
      (await a("/api/cart/items/ryzen", "PUT", { quantity: 999 })).status,
      400,
    );
    assert.equal(
      (await a("/api/orders/checkout-cart", "POST", {})).status,
      401,
    );
    await a("/api/auth/login", "POST", { email: users[0].email, password });
    let cart = (await a("/api/cart")).data;
    assert.equal(cart.itemCount, 2);
    assert.equal((await b("/api/cart")).data.itemCount, 0);
    const card = (await a("/api/orders/card", "POST", {})).data;
    const input = {
      items: cart.items.map(({ componentId, quantity }) => ({
        componentId,
        quantity,
      })),
      quoteVersion: cart.quoteVersion,
      card,
      idempotencyKey: randomUUID(),
    };
    parts.find((part) => part.id === "ryzen").inventory.unitPriceCents = 12000;
    assert.equal(
      (await a("/api/orders/checkout-cart", "POST", input)).status,
      409,
    );
    assert.equal(orders.size, 0);
    const cpu = parts.find((part) => part.id === "ryzen");
    cpu.inventory.quantity = 0;
    cart = (await a("/api/cart")).data;
    assert.equal(cart.hasUnavailableProducts, true);
    input.quoteVersion = cart.quoteVersion;
    assert.equal(
      (await a("/api/orders/checkout-cart", "POST", input)).status,
      409,
    );
    assert.equal(
      (await a("/api/cart/items/ryzen", "PUT", { quantity: 1 })).status,
      409,
    );
    assert.equal(orders.size, 0);
    cpu.inventory.quantity = 10;
    const gpu = parts.find((part) => part.id === "rtx4090"),
      gpuStock = gpu.inventory;
    gpu.inventory = null;
    assert.equal(
      (await a("/api/cart/items/rtx4090", "PUT", { quantity: 1 })).status,
      409,
    );
    gpu.inventory = gpuStock;
    cart = (await a("/api/cart")).data;
    input.quoteVersion = cart.quoteVersion;
    const first = await a("/api/orders/checkout-cart", "POST", input);
    assert.equal(first.status, 201);
    assert.equal(first.data.kind, "cart");
    assert.equal(first.data.totalCents, 24000);
    assert.equal(first.data.lines[0].quantity, 2);
    assert.equal((await a("/api/cart")).data.itemCount, 0);
    assert.equal(
      (await a("/api/orders/checkout-cart", "POST", input)).data.id,
      first.data.id,
    );
    assert.equal(orders.size, 1);
    assert.equal(
      (
        await a("/api/orders/checkout-cart", "POST", {
          ...input,
          items: [{ componentId: "ryzen", quantity: 3 }],
        })
      ).status,
      409,
    );
    await b("/api/auth/session");
    await b("/api/auth/login", "POST", { email: users[1].email, password });
    assert.equal((await b("/api/orders/" + first.data.id)).status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
