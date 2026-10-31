import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, unlinkSync, rmdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ComponentDAO } from "../src/dao/ComponentDAO.js";
import { FirestoreSessionStore } from "../src/config/sessionConfig.js";

test("100 recargas do catálogo usam 320 leituras simuladas na janela, em vez de 32.000", async () => {
  let now = 1000000,
    reads = 0,
    queries = 0;
  const items = Array.from({ length: 317 }, (_, i) => ({
    id: `part-${String(i).padStart(3, "0")}`,
  }));
  const dao = new ComponentDAO(() => {}, { now: () => now });
  dao.queryList = async ({ limit, cursor }) => {
    queries++;
    const remaining = items.filter((p) => !cursor || p.id > cursor);
    reads += Math.min(remaining.length, limit + 1);
    const page = remaining.slice(0, limit);
    return {
      items: page,
      nextCursor: remaining.length > limit ? page.at(-1).id : null,
    };
  };
  async function load() {
    const result = [];
    let cursor;
    do {
      const page = await dao.list({ limit: 100, cursor });
      result.push(...page.items);
      cursor = page.nextCursor;
    } while (cursor);
    assert.equal(result.length, 317);
  }
  for (let reload = 0; reload < 100; reload++) await load();
  assert.equal(queries, 4);
  assert.equal(reads, 320);
  now += 30 * 60 * 1000 + 1;
  await load();
  assert.equal(queries, 8);
  assert.equal(reads, 640);
});
test("reiniciar o DAO reaproveita cache público do disco; invalidação remove o registro anterior", async () => {
  const folder = mkdtempSync(join(tmpdir(), "dreambuild-public-cache-")),
    file = join(folder, "catalog.json");
  try {
    const first = new ComponentDAO(() => {}, { cacheFile: file });
    let queries = 0;
    first.queryList = async () => {
      queries++;
      return { items: [{ id: "part" }], nextCursor: null };
    };
    await first.list({ limit: 100 });
    assert.ok(existsSync(file));
    const restarted = new ComponentDAO(() => {}, { cacheFile: file });
    restarted.queryList = async () => {
      throw Error("Não deveria consultar o banco");
    };
    assert.equal((await restarted.list({ limit: 100 })).items[0].id, "part");
    assert.equal(queries, 1);
    restarted.invalidateCatalog();
    assert.equal(existsSync(file), false);
    await assert.rejects(() => restarted.list({ limit: 100 }));
  } finally {
    if (existsSync(file)) unlinkSync(file);
    rmdirSync(folder);
  }
});
test("consulta iniciada antes de uma alteração não restaura um cache invalidado", async () => {
  const dao = new ComponentDAO(() => {});
  let release;
  dao.queryList = () =>
    new Promise((resolve) => {
      release = resolve;
    });
  const pending = dao.list({ limit: 100 });
  dao.invalidateCatalog();
  release({ items: [], nextCursor: null });
  await pending;
  assert.equal(dao.catalogCache.size, 0);
});
test("ler sessão de prazo fixo não dispara escrita touch no Firestore", async () => {
  let writes = 0;
  const store = new FirestoreSessionStore({
    touch: async () => {
      writes++;
    },
  });
  await new Promise((resolve, reject) =>
    store.touch(
      "session",
      { cookie: { expires: new Date(Date.now() + 3600000) } },
      (error) => (error ? reject(error) : resolve()),
    ),
  );
  assert.equal(writes, 0);
});
