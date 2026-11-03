import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { CartController } from "../src/controllers/CartController.js";
import { products } from "../../frontend/src/data/products.js";
import { hardwareFacts } from "../data/hardwareFacts.js";
const parts = products.map((p) => ({
  ...p,
  hardware: { ...p.hardware, ...hardwareFacts[p.id] },
  inventory: { quantity: 50, unitPriceCents: 10000 },
}));
const input = () => ({
  partIds: Object.fromEntries(parts.map((p) => [p.category, p.id])),
  quantities: {},
  storageIds: [],
  idempotencyKey: randomUUID(),
});
const reply = () => ({
  status() {
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});
const controller = new CartController({
  async getMany(ids) {
    return ids.map((id) => parts.find((p) => p.id === id) || null);
  },
});
test("PC completo entra de uma vez no carrinho e repetir a chave não duplica as peças", async () => {
  const req = { body: input(), session: { cart: [] } },
    res = reply();
  await controller.addBuild(req, res);
  assert.equal(req.session.cart.length, 8);
  const before = structuredClone(req.session.cart);
  await controller.addBuild(req, reply());
  assert.deepEqual(req.session.cart, before);
  req.body = { ...req.body, quantities: { [req.body.partIds.ram]: 2 } };
  await assert.rejects(
    controller.addBuild(req, reply()),
    (e) => e.statusCode === 409,
  );
  assert.deepEqual(req.session.cart, before);
});
test("montagem incompleta e quantidade acima do limite preservam o carrinho inteiro", async () => {
  const req = {
    body: input(),
    session: { cart: [{ componentId: parts[0].id, quantity: 10 }] },
  };
  const before = structuredClone(req.session.cart);
  await assert.rejects(
    controller.addBuild(req, reply()),
    (e) => e.statusCode === 400,
  );
  assert.deepEqual(req.session.cart, before);
  req.body = input();
  delete req.body.partIds.mobo;
  await assert.rejects(
    controller.addBuild(req, reply()),
    (e) => e.statusCode === 400,
  );
  assert.deepEqual(req.session.cart, before);
});
test("saldo insuficiente em uma peça não adiciona parcialmente o PC", async () => {
  const request = input(),
    ramId = request.partIds.ram;
  request.quantities = { [ramId]: 2 };
  const limited = parts.map((p) =>
    p.id === ramId ? { ...p, inventory: { ...p.inventory, quantity: 1 } } : p,
  );
  const cart = new CartController({
    async getMany(ids) {
      return ids.map((id) => limited.find((p) => p.id === id) || null);
    },
  });
  const req = {
    body: request,
    session: { cart: [{ componentId: parts[0].id, quantity: 1 }] },
  };
  const before = structuredClone(req.session.cart);
  await assert.rejects(
    cart.addBuild(req, reply()),
    (e) => e.statusCode === 409,
  );
  assert.deepEqual(req.session.cart, before);
});
