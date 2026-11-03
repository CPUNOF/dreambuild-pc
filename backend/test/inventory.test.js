import { test } from "node:test";
import assert from "node:assert/strict";
import { Inventory } from "../src/models/Inventory.js";
import { InventoryDAO } from "../src/dao/InventoryDAO.js";
import { OrderDAO } from "../src/dao/OrderDAO.js";
import { ComponentDAO } from "../src/dao/ComponentDAO.js";
import { Cart } from "../src/models/Cart.js";
import { inventoryQuote } from "../../shared/inventory.js";
import session from "express-session";
import { createApp } from "../src/app.js";
import { User } from "../src/models/User.js";
import { UserDAO } from "../src/dao/UserDAO.js";

function store() {
  const docs = new Map(),
    snapshot = (ref) => ({
      id: ref.id,
      exists: docs.has(ref.path),
      data: () => structuredClone(docs.get(ref.path)),
    });
  let number = 0,
    tail = Promise.resolve();
  const collection = (path) => ({
    doc(id = "item-" + ++number) {
      const ref = {
        path: path + "/" + id,
        id,
        collection: (name) => collection(ref.path + "/" + name),
        get: async () => snapshot(ref),
      };
      return ref;
    },
  });
  const db = {
    collection,
    async runTransaction(fn) {
      let release;
      const prior = tail;
      tail = new Promise((resolve) => (release = resolve));
      await prior;
      try {
        const writes = [],
          tx = {
            get: async (ref) => snapshot(ref),
            set: (ref, data) =>
              writes.push(() => docs.set(ref.path, structuredClone(data))),
            update: (ref, data) =>
              writes.push(() =>
                docs.set(ref.path, {
                  ...docs.get(ref.path),
                  ...structuredClone(data),
                }),
              ),
            create: (ref, data) =>
              writes.push(() => {
                assert.equal(docs.has(ref.path), false);
                docs.set(ref.path, structuredClone(data));
              }),
            delete: (ref) => writes.push(() => docs.delete(ref.path)),
          };
        const result = await fn(tx);
        writes.forEach((w) => w());
        return result;
      } finally {
        release();
      }
    },
  };
  const seed = (id, quantity = 1, price = 1000) => {
    docs.set("components/" + id, { name: "Peça " + id });
    docs.set("inventory/" + id, {
      quantity,
      unitPriceCents: price,
      version: 1,
      reorderPoint: 3,
    });
  };
  return {
    docs,
    db,
    seed,
    inventory: new InventoryDAO(() => db),
    orders: new OrderDAO(() => db),
  };
}
const adjustment = (extra = {}) => ({
  type: "entry",
  quantity: 5,
  unitPriceCents: 1000,
  reorderPoint: 3,
  expectedVersion: 0,
  reason: "Recebimento acadêmico",
  idempotencyKey: "movimento-1234567890",
  ...extra,
});
const actor = { id: "admin", name: "Admin verificado" };
const order = (
  lines = [{ componentId: "a", quantity: 1, unitPriceCents: 1000 }],
) => ({
  lines,
  totalCents: lines.reduce((s, l) => s + l.quantity * l.unitPriceCents, 0),
  simulated: true,
});

test("pedido com frete mantém baixa atômica e rejeita frete adulterado", async () => {
  const { docs, seed, orders } = store();
  seed("a", 5);
  const document = {
    ...order(),
    delivery: { method: "express", priceCents: 2490 },
    totalCents: 3490,
  };
  const result = await orders.createIdempotent(
    "u",
    "shipping-1",
    "h1",
    document,
  );
  assert.equal(result.totalCents, 3490);
  assert.equal(docs.get("inventory/a").quantity, 4);
  await assert.rejects(() =>
    orders.createIdempotent("u", "shipping-2", "h2", {
      ...document,
      delivery: { method: "express", priceCents: -100 },
      totalCents: 900,
    }),
  );
  assert.equal(docs.get("inventory/a").quantity, 4);
});
test("endereços são salvos no documento da conta sem substituir senha ou perfil", async () => {
  const { docs, db } = store();
  docs.set("users/u", {
    name: "Cliente",
    role: "CLIENT",
    passwordHash: "test-hash",
  });
  const users = new UserDAO(() => db),
    address = {
      label: "Casa",
      recipient: "Cliente",
      postalCode: "01001000",
      street: "Rua teste",
      number: "10",
      complement: "",
      district: "Centro",
      city: "São Paulo",
      state: "SP",
    };
  const book = await users.updateAddressBook("u", { type: "create", address });
  assert.equal(book.length, 1);
  assert.equal(docs.get("users/u").passwordHash, "test-hash");
  await users.updateAddressBook("u", { type: "delete", id: book[0].id });
  assert.equal(docs.get("users/u").addressBook.length, 0);
  assert.equal(docs.get("users/u").role, "CLIENT");
});

test("estoque próprio usa preço DreamBuild e não presume saldo a partir de ofertas externas", () => {
  assert.equal(
    inventoryQuote(
      [{ componentId: "a", quantity: 1 }],
      [{ id: "a", offers: [{ availability: "in_stock", priceCents: 100 }] }],
    ).hasUnavailableProducts,
    true,
  );
  const part = {
    id: "a",
    inventory: { quantity: 2, unitPriceCents: 1500 },
    offers: [],
  };
  assert.equal(
    Cart.summarize([{ componentId: "a", quantity: 2 }], [part]).totalCents,
    3000,
  );
  assert.equal(
    Cart.summarize([{ componentId: "a", quantity: 3 }], [part]).totalCents,
    null,
  );
});
test("movimentação valida inteiros, dinheiro, limite, versão e motivo", () => {
  for (const change of [
    { quantity: -1 },
    { quantity: 1.5 },
    { quantity: 1000001 },
    { unitPriceCents: 0 },
    { reorderPoint: -1 },
    { expectedVersion: -1 },
    { reason: "" },
    { type: "sale" },
    { idempotencyKey: "curta" },
  ])
    assert.throws(
      () => Inventory.adjustment(adjustment(change)),
      (e) => e.statusCode === 400,
    );
  assert.throws(
    () =>
      Inventory.next(
        { quantity: 1, version: 0 },
        adjustment({ type: "exit", quantity: 2 }),
      ),
    (e) => e.statusCode === 409,
  );
});
test("recebimento é idempotente, registra responsável real e preserva saldo ao repetir", async () => {
  const { docs, inventory } = store();
  docs.set("components/a", { name: "A" });
  const first = await inventory.adjust(
    "a",
    { ...adjustment(), actorId: "injetado" },
    actor,
  );
  assert.equal(first.inventory.quantity, 5);
  assert.equal(first.movement.actorId, "admin");
  const repeated = await inventory.adjust("a", adjustment(), actor);
  assert.equal(repeated.replayed, true);
  assert.equal(repeated.inventory.quantity, 5);
  assert.equal(
    [...docs.keys()].filter((k) => k.includes("/movements/")).length,
    1,
  );
  await assert.rejects(
    () => inventory.adjust("a", adjustment({ quantity: 9 }), actor),
    (e) => e.statusCode === 409,
  );
});
test("duas compras da última unidade aprovam só uma; repetição não desconta outra vez", async () => {
  const { docs, seed, orders } = store();
  seed("a");
  const results = await Promise.allSettled([
    orders.createIdempotent("u", "key-1", "h1", order()),
    orders.createIdempotent("u", "key-2", "h2", order()),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(
    results.find((r) => r.status === "rejected").reason.statusCode,
    409,
  );
  const winner = results.findIndex((r) => r.status === "fulfilled");
  const repeated = await orders.createIdempotent(
    "u",
    "key-" + (winner + 1),
    "h" + (winner + 1),
    order(),
  );
  assert.equal(repeated.id, results[winner].value.id);
  assert.equal(docs.get("inventory/a").quantity, 0);
  assert.equal(
    [...docs.keys()].filter((k) => k.startsWith("simulated_orders/")).length,
    1,
  );
  assert.equal(
    [...docs.keys()].filter((k) => k.includes("/movements/")).length,
    1,
  );
});
test("pedido com item insuficiente ou preço alterado não gera baixa parcial nem recibo", async () => {
  const { docs, seed, orders } = store();
  seed("a", 5);
  seed("b", 0);
  await assert.rejects(
    () =>
      orders.createIdempotent(
        "u",
        "key",
        "h",
        order([
          { componentId: "a", quantity: 1, unitPriceCents: 1000 },
          { componentId: "b", quantity: 1, unitPriceCents: 1000 },
        ]),
      ),
    (e) => e.statusCode === 409,
  );
  await assert.rejects(
    () =>
      orders.createIdempotent(
        "u",
        "key-price",
        "hp",
        order([{ componentId: "a", quantity: 1, unitPriceCents: 900 }]),
      ),
    (e) => e.statusCode === 409,
  );
  assert.equal(docs.get("inventory/a").quantity, 5);
  assert.equal(
    [...docs.keys()].filter(
      (k) =>
        k.startsWith("simulated_orders/") ||
        k.includes("/movements/") ||
        k.startsWith("checkout_keys/"),
    ).length,
    0,
  );
});
test("inventário com versão antiga não sobrescreve uma venda e exclusão protege saldo positivo", async () => {
  const { docs, db, seed, orders, inventory } = store();
  seed("a", 5);
  await orders.createIdempotent("u", "key", "h", order());
  await assert.rejects(
    () =>
      inventory.adjust(
        "a",
        adjustment({ type: "count", quantity: 8, expectedVersion: 1 }),
        actor,
      ),
    (e) => e.statusCode === 409,
  );
  assert.equal(docs.get("inventory/a").quantity, 4);
  const components = new ComponentDAO(() => db, { cacheFile: null });
  await assert.rejects(
    () => components.delete("a"),
    (e) => e.statusCode === 409,
  );
  await inventory.adjust(
    "a",
    adjustment({ type: "count", quantity: 0, expectedVersion: 2 }),
    actor,
  );
  await components.delete("a");
  assert.equal(docs.has("components/a"), false);
  assert.equal(docs.has("inventory/a"), true);
});

test("estoque público não expõe histórico; escrita exige ADMIN e CSRF e ignora responsável enviado", async () => {
  const password = "senha-exclusiva-do-teste",
    hash = await User.hash(password);
  const users = [
    { id: "client", role: "CLIENT" },
    { id: "admin", role: "ADMIN" },
  ].map((u) => ({
    ...u,
    name: u.id,
    email: u.id + "@example.test",
    passwordHash: hash,
  }));
  const memory = store();
  memory.docs.set("components/a", { name: "A" });
  memory.inventory.list = async (_options, privateView) => ({
    items: [Inventory.view("a", memory.docs.get("inventory/a"), privateView)],
    nextCursor: null,
  });
  const app = createApp({
    sessionStore: new session.MemoryStore(),
    inventoryDAO: memory.inventory,
    userDAO: {
      findByEmail: async (e) => users.find((u) => u.email === e),
      getById: async (id) => users.find((u) => u.id === id),
    },
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = "",
    csrf = "";
  async function call(path, method = "GET", body, token = csrf) {
    const r = await fetch(base + path, {
      method,
      headers: {
        Cookie: cookie,
        ...(body
          ? { "Content-Type": "application/json", "X-CSRF-Token": token }
          : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const cookies = r.headers.getSetCookie();
    if (cookies.length) cookie = cookies.at(-1).split(";")[0];
    const result = await r.json();
    if (result.data?.csrfToken) csrf = result.data.csrfToken;
    return { ...result, status: r.status };
  }
  try {
    assert.equal((await call("/api/admin/inventory")).status, 401);
    const publicPage = await call("/api/inventory");
    assert.equal(publicPage.status, 200);
    assert.equal(publicPage.data[0].version, undefined);
    assert.equal(publicPage.data[0].actorId, undefined);
    await call("/api/auth/session");
    await call("/api/auth/login", "POST", { email: users[0].email, password });
    assert.equal((await call("/api/admin/inventory")).status, 403);
    assert.equal(
      (await call("/api/admin/inventory/a/movements", "POST", adjustment()))
        .status,
      403,
    );
    await call("/api/auth/logout", "POST", {});
    await call("/api/auth/session");
    await call("/api/auth/login", "POST", { email: users[1].email, password });
    assert.equal(
      (
        await call(
          "/api/admin/inventory/a/movements",
          "POST",
          adjustment(),
          "invalid",
        )
      ).status,
      403,
    );
    const result = await call("/api/admin/inventory/a/movements", "POST", {
      ...adjustment(),
      actorId: "client",
    });
    assert.equal(result.status, 200);
    assert.equal(result.data.movement.actorId, "admin");
    assert.equal((await call("/api/admin/inventory")).data[0].quantity, 5);
  } finally {
    await new Promise((r) => server.close(r));
  }
});
