// CT-INT-01 a CT-INT-04 — Integração carrinho (sessão) → cotação (models) →
// cartão fictício → pedido (OrderDAO) → histórico. Inclui a API de carrinho
// (CT-API-11) e cenários de erro de integração.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import { startServer, FIXTURE_IDS } from "../support/memory.js";

let ctx;
before(async () => (ctx = await startServer()));
after(() => ctx.close());

const key = () => randomUUID().replaceAll("-", "");

describe("CT-API-11 /api/cart", () => {
  test("visitante tem carrinho vazio", async () => {
    const res = await ctx.client().get("/api/cart");
    assert.equal(res.status, 200);
    assert.deepEqual(
      { items: res.body.data.items, itemCount: res.body.data.itemCount },
      { items: [], itemCount: 0 },
    );
  });

  test("PUT soma quantidades e calcula total; DELETE remove", async () => {
    const api = ctx.client();
    await api.get("/api/auth/session");
    const a = await api.put(`/api/cart/items/${FIXTURE_IDS.cpuInStock}`, {
      quantity: 2,
    });
    assert.equal(a.status, 200);
    const b = await api.put(`/api/cart/items/${FIXTURE_IDS.ssd}`, {
      quantity: 1,
    });
    assert.equal(b.body.data.itemCount, 3);
    const line = b.body.data.items.find(
      (i) => i.componentId === FIXTURE_IDS.cpuInStock,
    );
    assert.equal(line.lineTotalCents, line.unitPriceCents * 2);
    assert.equal(
      b.body.data.totalCents,
      b.body.data.items.reduce((s, i) => s + i.lineTotalCents, 0),
    );
    const c = await api.delete(`/api/cart/items/${FIXTURE_IDS.ssd}`);
    assert.equal(c.body.data.itemCount, 2);
  });

  for (const [label, quantity] of [
    ["0", 0],
    ["11", 11],
    ["1.5", 1.5],
    ['"3"', "3"],
  ])
    test(`400 para quantidade ${label}`, async () => {
      const api = ctx.client();
      await api.get("/api/auth/session");
      const res = await api.put(`/api/cart/items/${FIXTURE_IDS.ssd}`, {
        quantity,
      });
      assert.equal(res.status, 400);
    });

  test("404 para produto inexistente e 409 para produto sem oferta PIX", async () => {
    const api = ctx.client();
    await api.get("/api/auth/session");
    assert.equal(
      (await api.put("/api/cart/items/nao-existe", { quantity: 1 })).status,
      404,
    );
    assert.equal(
      (
        await api.put(`/api/cart/items/${FIXTURE_IDS.cpuNoOffer}`, {
          quantity: 1,
        })
      ).status,
      409,
    );
  });

  test("403 sem token CSRF", async () => {
    const api = ctx.client();
    await api.get("/api/auth/session");
    const res = await api.put(
      `/api/cart/items/${FIXTURE_IDS.ssd}`,
      { quantity: 1 },
      { csrfToken: "" },
    );
    assert.equal(res.status, 403);
  });
});

async function cartWith(api, lines) {
  for (const [id, quantity] of lines)
    await api.put(`/api/cart/items/${id}`, { quantity });
  return (await api.get("/api/cart")).body.data;
}

describe("CT-INT-01 carrinho do visitante é preservado ao entrar na conta", () => {
  test("itens adicionados antes do login continuam após o login", async () => {
    const api = ctx.client();
    await api.get("/api/auth/session");
    await cartWith(api, [[FIXTURE_IDS.gpu, 1]]);
    await api.post("/api/auth/login", {
      email: "cliente@dreambuild.test",
      password: "senha-de-teste-123",
    });
    const cart = (await api.get("/api/cart")).body.data;
    assert.equal(cart.itemCount, 1);
    assert.equal(cart.items[0].componentId, FIXTURE_IDS.gpu);
  });
});

describe("CT-INT-02 checkout completo do carrinho gera pedido no histórico", () => {
  test("cartão → checkout 201 → pedido em /orders/my e /orders/:id; carrinho esvazia", async () => {
    const api = ctx.client();
    await api.login("cliente@dreambuild.test");
    const cart = await cartWith(api, [
      [FIXTURE_IDS.cpuInStock, 1],
      [FIXTURE_IDS.ram, 2],
    ]);
    const card = await api.post("/api/orders/card");
    assert.equal(card.status, 200, card.body.message);

    const payload = {
      idempotencyKey: key(),
      card: card.body.data,
      items: cart.items.map(({ componentId, quantity }) => ({
        componentId,
        quantity,
      })),
      quoteVersion: cart.quoteVersion,
    };
    const order = await api.post("/api/orders/checkout-cart", payload);
    assert.equal(order.status, 201, order.body.message);
    assert.equal(order.body.data.totalCents, cart.totalCents);
    assert.equal(order.body.data.simulated, true);
    assert.doesNotMatch(
      JSON.stringify(order.body.data),
      new RegExp(card.body.data.number),
    );

    const mine = await api.get("/api/orders/my");
    assert.ok(mine.body.data.some((o) => o.id === order.body.data.id));
    assert.equal(
      (await api.get(`/api/orders/${order.body.data.id}`)).status,
      200,
    );
    assert.equal((await api.get("/api/cart")).body.data.itemCount, 0);

    // Repetir a mesma chave não duplica o pedido (idempotência).
    const before = ctx.orderDAO.data.size;
    await cartWith(api, [
      [FIXTURE_IDS.cpuInStock, 1],
      [FIXTURE_IDS.ram, 2],
    ]);
    const again = await api.post("/api/orders/checkout-cart", payload);
    assert.equal(again.status, 200);
    assert.equal(again.body.data.id, order.body.data.id);
    assert.equal(ctx.orderDAO.data.size, before);
  });
});

describe("CT-INT-03 checkout rejeita dados divergentes", () => {
  test("409 quando o carrinho mudou ou a cotação ficou desatualizada; 400 sem cartão", async () => {
    const api = ctx.client();
    await api.login("cliente@dreambuild.test");
    await api.delete("/api/cart");
    const cart = await cartWith(api, [[FIXTURE_IDS.ssd, 1]]);
    const card = (await api.post("/api/orders/card")).body.data;
    const items = [{ componentId: FIXTURE_IDS.ssd, quantity: 1 }];

    assert.equal(
      (
        await api.post("/api/orders/checkout-cart", {
          idempotencyKey: key(),
          items,
          quoteVersion: cart.quoteVersion,
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await api.post("/api/orders/checkout-cart", {
          idempotencyKey: key(),
          card,
          items: [{ componentId: FIXTURE_IDS.ssd, quantity: 2 }],
          quoteVersion: cart.quoteVersion,
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await api.post("/api/orders/checkout-cart", {
          idempotencyKey: key(),
          card,
          items,
          quoteVersion: "antiga",
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await api.post("/api/orders/checkout-cart", {
          idempotencyKey: key(),
          card: { ...card, cvv: "000" === card.cvv ? "111" : "000" },
          items,
          quoteVersion: cart.quoteVersion,
        })
      ).status,
      400,
    );
  });

  test("401 para visitante no checkout", async () => {
    const api = ctx.client();
    await api.get("/api/auth/session");
    assert.equal((await api.post("/api/orders/checkout-cart", {})).status, 401);
  });
});

describe("CT-INT-04 pedidos são isolados por proprietário", () => {
  test("outro cliente recebe 404 ao consultar pedido alheio", async () => {
    const owner = ctx.client();
    await owner.login("cliente@dreambuild.test");
    const cart = await cartWith(owner, [[FIXTURE_IDS.ssd, 1]]);
    const card = (await owner.post("/api/orders/card")).body.data;
    const order = await owner.post("/api/orders/checkout-cart", {
      idempotencyKey: key(),
      card,
      items: [{ componentId: FIXTURE_IDS.ssd, quantity: 1 }],
      quoteVersion: cart.quoteVersion,
    });
    assert.equal(order.status, 201, order.body.message);

    const other = ctx.client();
    await other.login("admin@dreambuild.test");
    assert.equal(
      (await other.get(`/api/orders/${order.body.data.id}`)).status,
      404,
    );
    assert.ok(
      !(await other.get("/api/orders/my")).body.data.some(
        (o) => o.id === order.body.data.id,
      ),
    );
  });
});
