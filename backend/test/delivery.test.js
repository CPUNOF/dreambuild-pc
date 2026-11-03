import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { startServer, FIXTURE_IDS } from "./support/memory.js";
import { Delivery } from "../src/models/Delivery.js";
import { DemoCard } from "../src/models/DemoCard.js";
import { demoExpiry } from "../../shared/delivery.js";
const address = {
  label: "Casa teste",
  recipient: "Cliente fictício",
  postalCode: "01001-000",
  street: "Rua de demonstração",
  number: "100",
  complement: "",
  district: "Centro",
  city: "São Paulo",
  state: "SP",
};
test("endereço é normalizado, limita campos e mantém apenas um padrão", () => {
  assert.equal(Delivery.address(address).postalCode, "01001000");
  for (const changed of [
    { postalCode: "123" },
    { state: "XX" },
    { recipient: "" },
    { street: "x".repeat(101) },
  ])
    assert.throws(() => Delivery.address({ ...address, ...changed }));
  let book = [];
  for (let i = 0; i < 5; i++)
    book = Delivery.updateBook(book, { type: "create", address });
  assert.throws(() => Delivery.updateBook(book, { type: "create", address }));
  book = Delivery.updateBook(book, { type: "default", id: book[2].id });
  assert.equal(book.filter((a) => a.isDefault).length, 1);
  const id = book[2].id;
  book = Delivery.updateBook(book, { type: "delete", id });
  assert.ok(book[0].isDefault);
  assert.throws(() => Delivery.checkout({ address, method: "overnight" }));
  assert.equal(
    Delivery.checkout({ address, method: "express", priceCents: 1 }).priceCents,
    2490,
  );
});
test("cartão digitado exige validade correta e assinatura do emissor fictício", () => {
  const card = DemoCard.create({ id: "u", name: "Teste" }, "secret-test");
  assert.ok(
    DemoCard.verify({ ...card, expiry: demoExpiry(card) }, "u", "secret-test"),
  );
  assert.throws(() =>
    DemoCard.verify({ ...card, expiry: "01/20" }, "u", "secret-test"),
  );
  assert.throws(() =>
    DemoCard.verify(
      { ...card, number: "4111111111111111" },
      "u",
      "secret-test",
    ),
  );
});
test("endereços são privados, persistem na conta e alterações exigem CSRF", async (t) => {
  const ctx = await startServer();
  t.after(() => ctx.close());
  const a = ctx.client(),
    b = ctx.client(),
    guest = ctx.client();
  assert.equal((await guest.get("/api/account/addresses")).status, 401);
  await a.login("cliente@dreambuild.test");
  await b.login("admin@dreambuild.test");
  assert.equal(
    (await a.post("/api/account/addresses", address, { csrfToken: "" })).status,
    403,
  );
  const added = await a.post("/api/account/addresses", address);
  assert.equal(added.status, 200);
  const id = added.body.data[0].id;
  assert.equal(
    (await b.put(`/api/account/addresses/${id}`, address)).status,
    404,
  );
  assert.equal((await b.delete(`/api/account/addresses/${id}`)).status, 404);
  assert.deepEqual((await b.get("/api/account/addresses")).body.data, []);
  const edited = await a.put(`/api/account/addresses/${id}`, {
    ...address,
    number: "200",
  });
  assert.equal(edited.body.data[0].number, "200");
  const next = await a.post("/api/account/addresses", {
    ...address,
    label: "Trabalho",
  });
  const second = next.body.data.find((x) => x.id !== id).id;
  assert.equal(
    (await a.put(`/api/account/addresses/${second}/default`)).body.data.find(
      (x) => x.isDefault,
    ).id,
    second,
  );
  assert.equal((await a.get("/api/account/addresses")).body.data.length, 2);
  assert.equal(
    (await a.delete(`/api/account/addresses/${id}`)).body.data.length,
    1,
  );
});
test("frete é calculado no servidor e faz parte da tentativa idempotente", async (t) => {
  const ctx = await startServer();
  t.after(() => ctx.close());
  const a = ctx.client();
  await a.login("cliente@dreambuild.test");
  const cart = (
    await a.put(`/api/cart/items/${FIXTURE_IDS.ssd}`, { quantity: 2 })
  ).body.data;
  const card = (await a.post("/api/orders/card")).body.data;
  const body = {
    items: cart.items.map(({ componentId, quantity }) => ({
      componentId,
      quantity,
    })),
    quoteVersion: cart.quoteVersion,
    card: { ...card, expiry: demoExpiry(card) },
    idempotencyKey: randomUUID(),
    delivery: { address, method: "express", priceCents: 0 },
  };
  const result = await a.post("/api/orders/checkout-cart", body);
  assert.equal(result.status, 201);
  const order = result.body.data;
  assert.equal(order.subtotalCents, cart.totalCents);
  assert.equal(order.totalCents, cart.totalCents + 2490);
  assert.equal(order.delivery.priceCents, 2490);
  assert.equal(
    order.fakeCardDetails.maskedNumber.endsWith(card.number.slice(-4)),
    true,
  );
  assert.equal(JSON.stringify(order).includes(card.token), false);
  assert.equal(order.card, undefined);
  assert.equal(
    (await a.post("/api/orders/checkout-cart", body)).body.data.id,
    order.id,
  );
  assert.equal(
    (
      await a.post("/api/orders/checkout-cart", {
        ...body,
        delivery: { address, method: "economy" },
      })
    ).status,
    409,
  );
  const stranger = ctx.client();
  await stranger.login("admin@dreambuild.test");
  assert.equal((await stranger.get(`/api/orders/${order.id}`)).status, 404);
});
