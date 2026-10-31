import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import session from "express-session";
import { createApp } from "../src/app.js";
import { User } from "../src/models/User.js";
import { DemoCard } from "../src/models/DemoCard.js";
import { AppError } from "../src/errors/AppError.js";
import { products } from "../../frontend/src/data/products.js";
import { hardwareFacts } from "../data/hardwareFacts.js";

test("cartão fictício tem Luhn válido, pertence ao usuário e rejeita alteração/expiração", () => {
  const secret = "segredo-de-teste-exclusivo-sem-uso-real";
  const card = DemoCard.create({ id: "a", name: "Pessoa teste" }, secret);
  assert.ok(card.number.startsWith("000000"));
  assert.equal(DemoCard.luhn(card.number), true);
  assert.equal(DemoCard.verify(card, "a", secret), true);
  assert.throws(() => DemoCard.verify(card, "b", secret), AppError);
  assert.throws(
    () =>
      DemoCard.verify(
        { ...card, cvv: card.cvv === "000" ? "001" : "000" },
        "a",
        secret,
      ),
    AppError,
  );
  assert.throws(
    () => DemoCard.verify({ ...card, validUntil: Date.now() - 1 }, "a", secret),
    AppError,
  );
  assert.equal(DemoCard.luhn("abc"), false);
});

test("montagens e pedidos respeitam proprietário, checkout repete sem duplicar e preserva histórico", async () => {
  const password = "senha-do-fluxo-123";
  const hash = await User.hash(password);
  const users = [
    {
      id: "a",
      name: "Cliente A",
      email: "a@example.test",
      passwordHash: hash,
      role: "CLIENT",
    },
    {
      id: "b",
      name: "Cliente B",
      email: "b@example.test",
      passwordHash: hash,
      role: "ADMIN",
    },
  ];
  const components = products.map((part) => ({
    ...part,
    inventory: { quantity: 20, unitPriceCents: 10000 },
    hardware: hardwareFacts[part.id],
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
  const selection = Object.fromEntries(
    components.map((part) => [part.category, part.id]),
  );
  components.push({
    ...components.find((p) => p.category === "storage"),
    id: "extra-sata",
    model: "TEST-SATA",
    name: "SATA de teste",
    hardware: {
      interface: "SATA 6Gb/s",
      formFactor: "2.5 inch",
      capacityGb: 1000,
    },
  });
  const builds = new Map();
  const orders = new Map();
  const keys = new Map();
  const buildDAO = {
    async create(userId, document) {
      const id = randomUUID();
      const data = {
        id,
        userId,
        ...document,
        createdAt: new Date().toISOString(),
      };
      builds.set(id, data);
      return data;
    },
    async getById(id) {
      return builds.get(id) || null;
    },
    async delete(id) {
      builds.delete(id);
    },
    async listByUser(id) {
      return {
        items: [...builds.values()].filter((build) => build.userId === id),
        nextCursor: null,
      };
    },
  };
  const orderDAO = {
    async getById(id) {
      return orders.get(id) || null;
    },
    async replay(userId, key, hash) {
      const existing = keys.get(userId + key);
      if (!existing) return null;
      if (existing.hash !== hash)
        throw new AppError(409, "Tentativa com outros dados.");
      return orders.get(existing.id);
    },
    async createIdempotent(userId, key, hash, document) {
      const existing = await this.replay(userId, key, hash);
      if (existing) return existing;
      const id = randomUUID();
      const data = {
        id,
        userId,
        ...document,
        createdAt: new Date().toISOString(),
      };
      orders.set(id, data);
      keys.set(userId + key, { id, hash });
      return data;
    },
    async listByUser(id) {
      return {
        items: [...orders.values()].filter((order) => order.userId === id),
        nextCursor: null,
      };
    },
  };
  const app = createApp({
    sessionStore: new session.MemoryStore(),
    buildDAO,
    orderDAO,
    componentDAO: {
      async getMany(ids) {
        return ids.map(
          (id) => components.find((part) => part.id === id) || null,
        );
      },
    },
    userDAO: {
      async getById(id) {
        return users.find((user) => user.id === id);
      },
      async findByEmail(email) {
        return users.find((user) => user.email === email);
      },
    },
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const client = () => {
    const cookies = new Map();
    let cookie = "",
      csrf = "";
    return async (path, method = "GET", body) => {
      const response = await fetch(base + path, {
        method,
        headers: {
          Cookie: cookie,
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...(csrf ? { "X-CSRF-Token": csrf } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      for (const entry of response.headers.getSetCookie()) {
        const value = entry.split(";")[0];
        const index = value.indexOf("=");
        cookies.set(value.slice(0, index), value.slice(index + 1));
      }
      cookie = [...cookies].map(([key, value]) => `${key}=${value}`).join("; ");
      const data = await response.json();
      if (data.data && Object.hasOwn(data.data, "csrfToken"))
        csrf = data.data.csrfToken;
      return { status: response.status, body: data };
    };
  };
  try {
    const a = client(),
      b = client();
    for (const [request, email] of [
      [a, "a@example.test"],
      [b, "b@example.test"],
    ]) {
      await request("/api/auth/session");
      assert.equal(
        (await request("/api/auth/login", "POST", { email, password })).status,
        200,
      );
    }
    const saved = await a("/api/builds", "POST", {
      name: "PC de teste",
      partIds: selection,
      quantities: { corsair: 2, samsung: 3, "extra-sata": 2 },
      storageIds: ["extra-sata"],
    });
    assert.equal(saved.status, 201);
    const buildId = saved.body.data.id;
    assert.equal(saved.body.data.resources.ram.modules, 4);
    assert.deepEqual((await a("/api/builds/" + buildId)).body.data.quantities, {
      corsair: 2,
      samsung: 3,
      "extra-sata": 2,
    });
    assert.deepEqual((await a("/api/builds/" + buildId)).body.data.storageIds, [
      "extra-sata",
    ]);
    assert.equal((await b("/api/builds/" + buildId)).status, 404);
    assert.equal((await b("/api/builds/" + buildId, "DELETE")).status, 404);
    assert.deepEqual((await b("/api/builds/my")).body.data, []);
    const card = (await a("/api/orders/card", "POST")).body.data;
    const wrongCard = (await b("/api/orders/card", "POST")).body.data;
    assert.equal(
      (
        await b("/api/orders/checkout-dream", "POST", {
          buildId,
          idempotencyKey: randomUUID(),
          card: wrongCard,
        })
      ).status,
      404,
    );
    const input = {
      buildId,
      idempotencyKey: randomUUID(),
      card,
      quoteVersion: builds.get(buildId).storeQuote.quoteVersion,
    };
    components.find((part) => part.id === "rtx4090").inventory.quantity = 0;
    assert.equal(
      (await a("/api/orders/checkout-dream", "POST", input)).status,
      409,
    );
    assert.equal(orders.size, 0);
    components.find((part) => part.id === "rtx4090").inventory.quantity = 20;
    const purchased = await a("/api/orders/checkout-dream", "POST", input);
    assert.equal(purchased.status, 201);
    const order = purchased.body.data;
    assert.equal(order.simulated, true);
    assert.equal(order.totalCents, 130000);
    assert.equal(order.buildSnapshot.itemCount, 13);
    assert.equal(
      order.buildSnapshot.parts.find((p) => p.id === "samsung").quantity,
      3,
    );
    assert.equal(order.fakeCardDetails.number, undefined);
    assert.equal(order.fakeCardDetails.cvv, undefined);
    assert.equal(
      order.fakeCardDetails.maskedNumber.endsWith(card.number.slice(-4)),
      true,
    );
    const replay = await a("/api/orders/checkout-dream", "POST", input);
    assert.equal(replay.status, 200);
    assert.equal(replay.body.data.id, order.id);
    assert.equal(orders.size, 1);
    assert.equal(
      (
        await a("/api/orders/checkout-dream", "POST", {
          ...input,
          card: { ...card, cvv: "alterado" },
        })
      ).status,
      409,
    );
    assert.equal((await b("/api/orders/" + order.id)).status, 404);
    assert.deepEqual((await b("/api/orders/my")).body.data, []);
    assert.equal((await a("/api/builds/" + buildId, "DELETE")).status, 200);
    assert.equal(
      (await a("/api/orders/" + order.id)).body.data.buildSnapshot.parts.length,
      9,
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
