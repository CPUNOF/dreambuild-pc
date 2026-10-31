import assert from "node:assert/strict";
import { test } from "node:test";
import { createApp } from "../src/app.js";
import { Component } from "../src/models/Component.js";
import { products } from "../../frontend/src/data/products.js";

async function withServer(dao, action) {
  const server = createApp({ componentDAO: dao }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    await action(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("consulta pública mantém envelope e transmite paginação validada ao DAO", async () => {
  await withServer(
    {
      async list(options) {
        assert.deepEqual(options, { limit: 2, cursor: "corsair" });
        return { items: [{ id: "rtx4090" }], nextCursor: "rtx4090" };
      },
    },
    async (base) => {
      const response = await fetch(
        `${base}/api/components?limit=2&cursor=corsair`,
      );
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), "no-store");
      const body = await response.json();
      assert.equal(body.status, "success");
      assert.deepEqual(body.data, [{ id: "rtx4090" }]);
      assert.deepEqual(body.meta, { limit: 2, nextCursor: "rtx4090" });
    },
  );
});

test("parâmetros inválidos não consultam o banco", async () => {
  await withServer(
    {
      list() {
        assert.fail("DAO não deve ser chamado.");
      },
    },
    async (base) => {
      for (const query of [
        "limit=0",
        "limit=101",
        "limit=-1",
        "limit=1.5",
        "limit=abc",
        "limit=1&limit=2",
        "cursor=a/b",
        "cursor=",
        "cursor=a&cursor=b",
        "category=",
        "category=unknown",
        "category=gpu&category=cpu",
      ]) {
        const response = await fetch(`${base}/api/components?${query}`);
        assert.equal(response.status, 400, query);
        assert.equal((await response.json()).status, "error");
      }
    },
  );
});

test("categoria é normalizada e produto individual retorna 404 sem consultar dados privados", async () => {
  await withServer(
    {
      async list(options) {
        assert.equal(options.category, "gpu");
        return { items: [], nextCursor: null };
      },
      async getById(id) {
        assert.equal(id, "missing");
        return null;
      },
    },
    async (base) => {
      assert.equal(
        (await fetch(`${base}/api/components?category=GPU`)).status,
        200,
      );
      assert.equal((await fetch(`${base}/api/components/missing`)).status, 404);
      const spec = await fetch(`${base}/openapi.json`).then((r) => r.json());
      assert.equal(spec.openapi, "3.0.3");
      assert.ok(spec.paths["/api/components/{id}"]);
    },
  );
});

test("falha de banco retorna 503 sem revelar erro interno", async () => {
  await withServer(
    {
      async list() {
        throw new Error("credencial-interna-de-teste");
      },
    },
    async (base) => {
      const response = await fetch(`${base}/api/components`);
      assert.equal(response.status, 503);
      const body = await response.text();
      assert.equal(body.includes("credencial-interna"), false);
      assert.equal(JSON.parse(body).data, null);
    },
  );
});

test("catálogo vazio é sucesso com cursor final nulo", async () => {
  await withServer(
    {
      async list() {
        return { items: [], nextCursor: null };
      },
    },
    async (base) => {
      const response = await fetch(`${base}/api/components`);
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.deepEqual(body.data, []);
      assert.deepEqual(body.meta, { limit: 20, nextCursor: null });
    },
  );
});

test("Model converte ficha armazenada e exclui campos internos da resposta", () => {
  const source = products[0];
  const document = {
    ...source,
    specifications: source.specifications.map(([label, value]) => ({
      label,
      value,
    })),
    internalNotes: "somente-servidor",
  };
  const result = new Component(source.id, document);
  assert.deepEqual(result.specifications, source.specifications);
  assert.equal(result.internalNotes, undefined);
  assert.throws(() => new Component("invalido", {}));
});
