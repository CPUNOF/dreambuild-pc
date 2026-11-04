import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import session from "express-session";
import { CommunityDAO } from "../src/dao/CommunityDAO.js";
import { CommunityController } from "../src/controllers/CommunityController.js";
import {
  publicationInput,
  previewDigest,
} from "../src/models/CommunityBuild.js";
import {
  identifyGpu,
  performanceReport,
} from "../src/models/ReferencePerformance.js";
import { createApp } from "../src/app.js";
import { User } from "../src/models/User.js";
import { ReferenceDAO } from "../src/dao/ReferenceDAO.js";
import { products } from "../../frontend/src/data/products.js";
import { hardwareFacts } from "../data/hardwareFacts.js";
const data = JSON.parse(
  readFileSync(new URL("../data/referenceBenchmarks.json", import.meta.url)),
);
test("base pública informa cópia local em cota excedida e compartilha uma única leitura", async () => {
  let reads = 0;
  const dao = new ReferenceDAO(() => ({
    collection: () => ({
      doc: () => ({
        get: async () => {
          reads++;
          throw Object.assign(Error("quota"), { code: 8 });
        },
      }),
    }),
  }));
  const [a, b] = await Promise.all([dao.dataset(), dao.dataset()]);
  assert.equal(reads, 1);
  assert.equal(a, b);
  assert.equal(a.dataOrigin, "curated-local");
  assert.equal(a.version, data.version);
  assert.equal(Object.keys(a.gpuProfiles).length, 20);
});
export function memoryFirestore() {
  const docs = new Map();
  let reads = 0,
    fail = null;
  const snapshot = (path, value = docs.get(path)) => ({
    id: path.split("/").at(-1),
    exists: value !== undefined,
    data: () => (value === undefined ? undefined : structuredClone(value)),
  });
  const value = (obj, path) => path.split(".").reduce((v, k) => v?.[k], obj);
  function collection(
    path,
    conditions = [],
    orders = [],
    max = Infinity,
    cursor = null,
  ) {
    return {
      doc: (id) => ({
        path: path + "/" + id,
        id,
        collection: (name) => collection(path + "/" + id + "/" + name),
        get: async () => {
          reads++;
          if (fail) throw fail;
          return snapshot(path + "/" + id);
        },
      }),
      where: (key, op, val) => {
        assert.equal(op, "==");
        return collection(
          path,
          [...conditions, [key, val]],
          orders,
          max,
          cursor,
        );
      },
      orderBy: (key, direction = "asc") =>
        collection(
          path,
          conditions,
          [...orders, [typeof key === "string" ? key : null, direction]],
          max,
          cursor,
        ),
      limit: (n) => collection(path, conditions, orders, n, cursor),
      startAfter: (id) => collection(path, conditions, orders, max, id),
      get: async () => {
        reads++;
        if (fail) throw fail;
        let rows = [...docs].filter(
          ([key, item]) =>
            key.startsWith(path + "/") &&
            key.slice(path.length + 1).indexOf("/") < 0 &&
            conditions.every(([k, v]) => value(item, k) === v) &&
            orders.every(([k]) => !k || value(item, k) !== undefined),
        );
        rows.sort((a, b) => {
          for (const [k, dir] of orders) {
            const av = k ? value(a[1], k) : a[0].split("/").at(-1),
              bv = k ? value(b[1], k) : b[0].split("/").at(-1);
            if (av !== bv)
              return (av > bv ? 1 : -1) * (dir === "desc" ? -1 : 1);
          }
          return 0;
        });
        if (cursor)
          rows = rows.slice(
            rows.findIndex(([p]) => p.split("/").at(-1) === cursor) + 1,
          );
        return { docs: rows.slice(0, max).map(([p, v]) => snapshot(p, v)) };
      },
    };
  }
  const db = {
    collection,
    runTransaction: async (fn) => {
      const writes = [];
      const result = await fn({
        get: async (ref) => {
          reads++;
          if (fail) throw fail;
          return snapshot(ref.path);
        },
        set: (ref, v) =>
          writes.push(() => docs.set(ref.path, structuredClone(v))),
        delete: (ref) => writes.push(() => docs.delete(ref.path)),
      });
      writes.forEach((fn) => fn());
      return result;
    },
  };
  return {
    db,
    docs,
    get reads() {
      return reads;
    },
    fail: (error) => {
      fail = error;
    },
  };
}
const analysis = {
  parts: [
    { category: "cpu", name: "Ryzen 7 7800X3D" },
    { category: "gpu", name: "RTX 4090 24GB" },
    { category: "ram", name: "DDR5 32 GB" },
  ],
};
const record = (price = 100000) => ({
  title: "PC público",
  nickname: "Jogador",
  image: "/products/case.webp",
  configuration: { cpu: "Ryzen 7 7800X3D", gpu: "RTX 4090", ram: "DDR5 32GB" },
  priceCents: price,
  quotedAt: "2026-10-30T00:00:00.000Z",
  publishedAt: "2026-10-30T12:00:00.000Z",
  version: data.version,
  gameCount: 10,
  performance: Object.fromEntries(
    ["1080p", "1440p"].map((r) => [r, performanceReport(analysis, data, r)]),
  ),
});
test("base ampliada identifica GPUs exatas e preserva a coorte original; 8 GB não herda 16 GB", () => {
  assert.equal(Object.keys(data.gpuProfiles).length, 20);
  assert.equal(data.rankingGameIds.length, 10);
  for (const [name, p] of Object.entries(data.gpuProfiles)) {
    assert.ok(p.source.startsWith("https://www.tomshardware.com/"));
    assert.equal(identifyGpu({ name: `${p.chip} ${p.vramGb}GB` }, data), name);
    for (const g of data.games.filter((g) => g.results[name]))
      for (const r of ["1080p", "1440p"])
        assert.ok(
          g.results[name][r] === undefined ||
            (Number.isFinite(g.results[name][r]) && g.results[name][r] > 0),
        );
  }
  assert.equal(identifyGpu({ name: "RTX 5060 Ti" }, data), null);
  assert.equal(identifyGpu({ name: "RTX 3060 8GB" }, data), null);
  assert.equal(identifyGpu({ name: "RTX 5060 Ti Laptop 16GB" }, data), null);
  assert.equal(data.games[0].results["RTX 5060"]["1440p"], 89.9);
  assert.equal(data.games[0].results["RTX 5060"]["1080p"], 115.3);
  assert.notEqual(
    data.games[0].results["RTX 5060 Ti 16GB"]["1080p"],
    data.games[0].results["RTX 5060 Ti 8GB"]["1080p"],
  );
  const unknown = performanceReport(
    {
      parts: [
        { category: "cpu", name: "CPU não coberta" },
        analysis.parts[1],
        analysis.parts[2],
      ],
    },
    data,
  );
  assert.equal(unknown.rankEligible, false);
  assert.equal(unknown.kind, "gpu-reference");
  assert.ok(unknown.averageFps > 0);
  const partial = structuredClone(data);
  delete partial.games[0].results["RTX 4090"]["1080p"];
  const report = performanceReport(analysis, partial);
  assert.equal(report.rankEligible, false);
  assert.equal(report.games[0].results["1080p"], null);
  assert.equal(report.coveredGames, 11);
});
test("publicação exige consentimento explícito e rejeita FPS/preço forjados", () => {
  const input = {
    buildId: "build-a",
    nickname: "Apelido",
    title: "Setup",
    consent: true,
    previewHash: "a".repeat(64),
  };
  assert.equal(publicationInput(input).nickname, "Apelido");
  for (const body of [
    { ...input, consent: false },
    { ...input, fps: 9999 },
    { ...input, priceCents: 1 },
    { ...input, ownerId: "outro" },
  ])
    assert.throws(() => publicationInput(body), { statusCode: 400 });
});
test("Firestore DAO mantém uma publicação por montagem, separa resolução/versão e exclui custos incompletos", async () => {
  const m = memoryFirestore(),
    dao = new CommunityDAO(() => m.db),
    a = await dao.publish("owner-a", "build-a", record());
  const b = await dao.publish("owner-b", "build-b", {
    ...record(200000),
    title: "PC B",
  });
  assert.notEqual(a.id, b.id);
  const opts = {
    version: data.version,
    resolution: "1080p",
    sort: "value",
    limit: 20,
  };
  const ranked = await dao.list(opts);
  assert.equal(ranked[0].id, a.id);
  assert.equal(ranked.length, 2);
  const reads = m.reads;
  await Promise.all([dao.list(opts), dao.list(opts)]);
  assert.equal(m.reads, reads);
  assert.ok(!JSON.stringify(await dao.detail(a.id)).includes("owner-a"));
  assert.ok(!JSON.stringify(await dao.gallery()).includes("build-a"));
  assert.equal(
    (await dao.publish("owner-a", "build-a", record(null))).id,
    a.id,
  );
  assert.equal((await dao.list(opts)).length, 1);
  assert.equal((await dao.list({ ...opts, sort: "performance" })).length, 2);
  const updated = { ...record(), version: "version-new" };
  await dao.publish("owner-a", "build-a", updated);
  assert.equal((await dao.list({ ...opts, sort: "performance" })).length, 1);
  await assert.rejects(dao.remove("owner-b", a.id), { statusCode: 404 });
  assert.ok(await dao.detail(a.id));
  await dao.remove("owner-a", a.id);
  assert.equal(await dao.detail(a.id), null);
  assert.equal(
    [...m.docs.keys()].some((k) => k.endsWith("/" + a.id)),
    false,
  );
});
test("listagem privada pagina todos os registros; cota pública tem recuo sem repetir leituras", async () => {
  const m = memoryFirestore(),
    dao = new CommunityDAO(() => m.db);
  for (let i = 0; i < 4; i++) await dao.publish("a", "b" + i, record());
  const first = await dao.mine("a", { limit: 2 }),
    next = await dao.mine("a", { limit: 2, cursor: first.nextCursor });
  assert.equal(first.items.length, 2);
  assert.equal(next.items.length, 2);
  assert.equal(
    new Set([...first.items, ...next.items].map((p) => p.id)).size,
    4,
  );
  m.fail(Object.assign(Error("Quota"), { code: 8 }));
  await assert.rejects(dao.gallery(), { statusCode: 503 });
  const reads = m.reads;
  await assert.rejects(
    dao.list({
      version: data.version,
      resolution: "1440p",
      sort: "value",
      limit: 20,
    }),
    { statusCode: 503 },
  );
  assert.equal(m.reads, reads);
});
test("prévia privada usa peças atuais, não expõe dono e muda hash se uma cotação mudar", async () => {
  let price = 10000;
  const parts = products.map((p) => ({
    ...p,
    hardware: hardwareFacts[p.id],
    offers: [
      {
        store: "kabum",
        paymentMethod: "pix",
        availability: "in_stock",
        priceCents: price,
        sourceUrl: "https://www.kabum.com.br/produto/1/teste",
        checkedAt: "2026-10-30T00:00:00.000Z",
      },
    ],
  }));
  const build = {
    id: "build-a",
    userId: "owner-a",
    name: "Nome privado",
    partIds: Object.fromEntries(parts.map((p) => [p.category, p.id])),
  };
  const controller = new CommunityController({
    builds: { getById: async () => build },
    components: { getMany: async () => parts },
    references: { dataset: async () => data },
  });
  await assert.rejects(controller.prepare("owner-b", "build-a"), {
    statusCode: 404,
  });
  const before = await controller.prepare("owner-a", "build-a");
  assert.equal(before.data.parts.length, 8);
  assert.equal(before.data.priceCents, 80000);
  assert.equal(before.data.performance["1080p"].rankEligible, true);
  assert.equal(before.previewHash, previewDigest(before.data));
  assert.ok(!JSON.stringify(before).includes("Nome privado"));
  assert.ok(!JSON.stringify(before).includes("owner-a"));
  parts[0].offers[0].priceCents++;
  assert.notEqual(
    (await controller.prepare("owner-a", "build-a")).previewHash,
    before.previewHash,
  );
});
test("rotas públicas dispensam sessão; publicação exige sessão, CSRF, proprietário e prévia atual", async () => {
  const m = memoryFirestore(),
    dao = new CommunityDAO(() => m.db),
    hash = await User.hash("teste-password-123");
  const users = [
    {
      id: "a",
      name: "Nome privado A",
      email: "a@example.test",
      role: "CLIENT",
      passwordHash: hash,
    },
    {
      id: "b",
      name: "Nome privado B",
      email: "b@example.test",
      role: "CLIENT",
      passwordHash: hash,
    },
  ];
  const parts = products.map((p) => ({
    ...p,
    hardware: hardwareFacts[p.id],
    offers: [
      {
        store: "kabum",
        paymentMethod: "pix",
        availability: "in_stock",
        priceCents: 10000,
        sourceUrl: "https://www.kabum.com.br/produto/1/teste",
        checkedAt: "2026-10-30T00:00:00.000Z",
      },
    ],
  }));
  const build = {
    id: "build-a",
    userId: "a",
    partIds: Object.fromEntries(parts.map((p) => [p.category, p.id])),
  };
  const store = new session.MemoryStore();
  let sessionReads = 0;
  const original = store.get.bind(store);
  store.get = (...args) => {
    sessionReads++;
    return original(...args);
  };
  const app = createApp({
    sessionStore: store,
    sessionSecret: "test-secret-with-at-least-32-characters",
    communityDAO: dao,
    referenceDAO: { dataset: async () => data },
    componentDAO: { getMany: async () => parts },
    buildDAO: { getById: async () => build },
    userDAO: {
      getById: async (id) => users.find((u) => u.id === id),
      findByEmail: async (email) => users.find((u) => u.email === email),
    },
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const client = () => {
    let cookie = "",
      csrf = "";
    return async (path, method = "GET", body, withCsrf = true) => {
      const response = await fetch(base + "/api" + path, {
        method,
        headers: {
          Cookie: cookie,
          ...(csrf && withCsrf ? { "X-CSRF-Token": csrf } : {}),
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const raw = response.headers
        .getSetCookie()
        .find((s) => s.startsWith("dreambuild.sid="));
      if (raw) cookie = raw.split(";")[0];
      const result = await response.json();
      if (result.data?.csrfToken) csrf = result.data.csrfToken;
      return { ...result, code: response.status };
    };
  };
  try {
    const a = client(),
      b = client(),
      anonymous = client();
    assert.equal((await anonymous("/community/ranking")).status, "success");
    assert.equal(sessionReads, 0);
    assert.equal(
      (await anonymous("/benchmarks")).data.games.length,
      data.games.length,
    );
    assert.equal((await anonymous("/community/builds", "POST", {})).code, 401);
    for (const [c, email] of [
      [a, "a@example.test"],
      [b, "b@example.test"],
    ]) {
      await c("/auth/session");
      assert.equal(
        (
          await c("/auth/login", "POST", {
            email,
            password: "teste-password-123",
          })
        ).status,
        "success",
      );
    }
    assert.equal((await b("/community/preview/build-a")).code, 404);
    const preview = (await a("/community/preview/build-a")).data,
      body = {
        buildId: "build-a",
        nickname: "Apelido público",
        title: "PC público",
        consent: true,
        previewHash: preview.previewHash,
      };
    assert.equal((await a("/community/builds", "POST", body, false)).code, 403);
    assert.equal(
      (await a("/community/builds", "POST", { ...body, fps: 999 })).code,
      400,
    );
    assert.equal(
      (
        await a("/community/builds", "POST", {
          ...body,
          previewHash: "0".repeat(64),
        })
      ).code,
      409,
    );
    const published = await a("/community/builds", "POST", body);
    assert.equal(published.status, "success");
    const id = published.data.id;
    const pub = await anonymous(`/community/builds/${id}`);
    assert.ok(!JSON.stringify(pub).includes("example.test"));
    assert.ok(!JSON.stringify(pub).includes("Nome privado"));
    const count = sessionReads;
    assert.equal((await a("/community/ranking")).data.length, 1);
    assert.equal(sessionReads, count);
    assert.equal((await b(`/community/builds/${id}`, "DELETE")).code, 404);
    assert.equal(
      (await a(`/community/builds/${id}`, "DELETE")).status,
      "success",
    );
    assert.equal((await anonymous(`/community/builds/${id}`)).code, 404);
  } finally {
    await new Promise((r) => server.close(r));
  }
});
