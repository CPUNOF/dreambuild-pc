// CT-API-07 a CT-API-10 — Catálogo público e CRUD administrativo de produtos.
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { startServer, FIXTURE_IDS, catalog } from "../support/memory.js";

let ctx;
before(async () => (ctx = await startServer()));
after(() => ctx.close());

describe("CT-API-07 GET /api/components (consulta pública)", () => {
  test("200 com lista, meta.limit e cursor nulo no fim", async () => {
    const res = await ctx.client().get("/api/components?limit=100");
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "success");
    assert.equal(res.body.data.length, 5);
    assert.deepEqual(
      { limit: res.body.meta.limit, nextCursor: res.body.meta.nextCursor },
      { limit: 100, nextCursor: null },
    );
  });

  test("paginação por cursor percorre todos os itens sem repetir", async () => {
    const api = ctx.client();
    const seen = [];
    let cursor = null;
    do {
      const q = new URLSearchParams({
        limit: "2",
        ...(cursor ? { cursor } : {}),
      });
      const res = await api.get(`/api/components?${q}`);
      assert.equal(res.status, 200);
      assert.ok(res.body.data.length <= 2);
      seen.push(...res.body.data.map((p) => p.id));
      cursor = res.body.meta.nextCursor;
    } while (cursor);
    assert.deepEqual(seen.sort(), Object.values(FIXTURE_IDS).sort());
  });

  test("filtro por categoria (maiúsculas aceitas)", async () => {
    const res = await ctx.client().get("/api/components?category=CPU");
    assert.equal(res.status, 200);
    assert.ok(res.body.data.every((p) => p.category === "cpu"));
    assert.equal(res.body.data.length, 2);
  });

  for (const query of [
    "limit=0",
    "limit=101",
    "limit=abc",
    "cursor=a%2Fb",
    "category=notebook",
    "category=",
  ])
    test(`400 para parâmetro inválido: ${query}`, async () => {
      const res = await ctx.client().get(`/api/components?${query}`);
      assert.equal(res.status, 400);
      assert.equal(res.body.status, "error");
    });

  test("503 sem detalhes internos quando o banco falha", async () => {
    const failing = await startServer({
      componentDAO: {
        async list() {
          throw new Error("FIRESTORE_INTERNAL: quota exceeded at projects/x");
        },
      },
    });
    try {
      const res = await failing.client().get("/api/components");
      assert.equal(res.status, 503);
      assert.doesNotMatch(
        JSON.stringify(res.body),
        /FIRESTORE_INTERNAL|projects\/x/,
      );
    } finally {
      await failing.close();
    }
  });
});

describe("CT-API-08 GET /api/components/:id", () => {
  test("200 com a ficha do produto", async () => {
    const res = await ctx.client().get(`/api/components/${FIXTURE_IDS.gpu}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.id, FIXTURE_IDS.gpu);
    assert.ok(Array.isArray(res.body.data.specifications));
  });
  test("404 para produto inexistente", async () =>
    assert.equal(
      (await ctx.client().get("/api/components/nao-existe")).status,
      404,
    ));
  test("400 para identificador com caracteres inválidos", async () =>
    assert.equal((await ctx.client().get("/api/components/a.b")).status, 400));
});

describe("CT-API-09 CRUD /api/admin/components (ADMIN)", () => {
  const base = catalog([FIXTURE_IDS.ssd])[0];
  const input = { ...base, slug: "ssd-teste-vvts", name: "SSD de teste VVTS" };
  delete input.id;

  test("fluxo cadastrar → consultar → alterar → remover", async () => {
    const admin = ctx.client();
    await admin.login("admin@dreambuild.test");

    const created = await admin.post("/api/admin/components", input);
    assert.equal(created.status, 201, created.body.message);
    assert.equal(created.body.data.id, "ssd-teste-vvts");

    const read = await ctx.client().get("/api/components/ssd-teste-vvts");
    assert.equal(read.status, 200);
    assert.equal(read.body.data.name, "SSD de teste VVTS");

    const updated = await admin.put("/api/admin/components/ssd-teste-vvts", {
      name: "SSD renomeado",
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.name, "SSD renomeado");

    const removed = await admin.delete("/api/admin/components/ssd-teste-vvts");
    assert.equal(removed.status, 200);
    assert.deepEqual(removed.body.data, { id: "ssd-teste-vvts" });
    assert.equal(
      (await ctx.client().get("/api/components/ssd-teste-vvts")).status,
      404,
    );
  });

  test("409 ao cadastrar produto com endereço já existente", async () => {
    const admin = ctx.client();
    await admin.login("admin@dreambuild.test");
    const dup = { ...input, slug: "ssd-duplicado" };
    assert.equal((await admin.post("/api/admin/components", dup)).status, 201);
    assert.equal((await admin.post("/api/admin/components", dup)).status, 409);
    await admin.delete("/api/admin/components/ssd-duplicado");
  });

  test("400 para dados incompletos e para troca de slug; 404 para inexistente", async () => {
    const admin = ctx.client();
    await admin.login("admin@dreambuild.test");
    assert.equal(
      (await admin.post("/api/admin/components", { name: "incompleto" }))
        .status,
      400,
    );
    assert.equal(
      (
        await admin.patch(`/api/admin/components/${FIXTURE_IDS.ssd}`, {
          slug: "outro",
        })
      ).status,
      400,
    );
    assert.equal(
      (await admin.put("/api/admin/components/nao-existe", { name: "x" }))
        .status,
      404,
    );
    assert.equal(
      (await admin.delete("/api/admin/components/nao-existe")).status,
      404,
    );
  });

  test("400 para oferta com preço negativo no PUT", async () => {
    const admin = ctx.client();
    await admin.login("admin@dreambuild.test");
    const res = await admin.put(`/api/admin/components/${FIXTURE_IDS.ssd}`, {
      offers: [
        {
          store: "kabum",
          paymentMethod: "pix",
          availability: "in_stock",
          priceCents: -100,
          sourceUrl: "https://www.kabum.com.br/produto/1/x",
          checkedAt: new Date().toISOString(),
        },
      ],
    });
    assert.equal(res.status, 400);
  });
});

describe("CT-API-10 CRUD administrativo bloqueado para não-admin", () => {
  test("visitante 401, cliente 403 e nada é gravado", async () => {
    const before = ctx.componentDAO.data.size;
    const visitor = ctx.client();
    await visitor.get("/api/auth/session");
    assert.equal(
      (await visitor.post("/api/admin/components", { name: "x" })).status,
      401,
    );

    const client = ctx.client();
    await client.login("cliente@dreambuild.test");
    assert.equal(
      (await client.post("/api/admin/components", { name: "x" })).status,
      403,
    );
    assert.equal(
      (await client.delete(`/api/admin/components/${FIXTURE_IDS.ssd}`)).status,
      403,
    );
    assert.equal(ctx.componentDAO.data.size, before);
  });

  test("admin sem token CSRF recebe 403", async () => {
    const admin = ctx.client();
    await admin.login("admin@dreambuild.test");
    const res = await admin.delete(`/api/admin/components/${FIXTURE_IDS.ssd}`, {
      csrfToken: "errado",
    });
    assert.equal(res.status, 403);
    assert.ok(ctx.componentDAO.data.has(FIXTURE_IDS.ssd));
  });
});
