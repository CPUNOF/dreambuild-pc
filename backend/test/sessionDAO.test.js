import { test } from "node:test";
import assert from "node:assert/strict";
import { SessionDAO } from "../src/dao/SessionDAO.js";
test("gravação atrasada de carrinho não restaura sessão revogada pelo logout", async () => {
  const documents = new Map();
  const reference = (id) => ({
    id,
    async get() {
      return { exists: documents.has(id), data: () => documents.get(id) };
    },
    async set(value) {
      documents.set(id, value);
    },
    async delete() {
      documents.delete(id);
    },
  });
  const database = {
    collection() {
      return { doc: reference };
    },
    async runTransaction(action) {
      return action({
        get: (ref) => ref.get(),
        set: (ref, value) => documents.set(ref.id, value),
      });
    },
  };
  const dao = new SessionDAO(() => database);
  await dao.set("sid", {
    userId: "a",
    cart: [{ componentId: "cpu", quantity: 1 }],
  });
  assert.equal((await dao.get("sid")).userId, "a");
  await dao.destroy("sid");
  await dao.set("sid", {
    userId: "a",
    cart: [{ componentId: "cpu", quantity: 2 }],
  });
  assert.equal(await dao.get("sid"), null);
  assert.equal(documents.get("sid").revoked, true);
});
