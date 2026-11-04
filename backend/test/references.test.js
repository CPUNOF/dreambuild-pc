import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { selectionIssues } from "../../shared/selectionCompatibility.js";
import { performanceReport } from "../src/models/ReferencePerformance.js";
import {
  commonBenchmarks,
  sameBenchmark,
} from "../../shared/benchmarkComparison.js";
import { UserDAO } from "../src/dao/UserDAO.js";
import {
  verifyGoogleToken,
  identityFromVerifiedGoogleClaims,
} from "../src/config/googleAuth.js";
import { User } from "../src/models/User.js";
import { ComponentDAO } from "../src/dao/ComponentDAO.js";
import { localCatalog } from "../src/dao/PublicCatalogSnapshot.js";
import { createApp } from "../src/app.js";
import session from "express-session";
import signature from "cookie-signature";
const data = JSON.parse(
  readFileSync(new URL("../data/referenceBenchmarks.json", import.meta.url)),
);
const systems = JSON.parse(
  readFileSync(new URL("../data/readySystems.json", import.meta.url)),
);
const part = (category, hardware) => ({ category, hardware });
test("sockets LGA e AM são exatos; DDR não é intercambiável e dados críticos ausentes bloqueiam", () => {
  for (const [a, b] of [
    ["LGA1200", "LGA1700"],
    ["LGA1700", "LGA1851"],
    ["AM4", "AM5"],
  ])
    assert.ok(
      selectionIssues([
        part("cpu", { socket: a }),
        part("mobo", { socket: b }),
      ]).some((i) => i.code === "SOCKET"),
    );
  assert.equal(
    selectionIssues([
      part("cpu", { socket: "LGA 1700" }),
      part("mobo", { socket: "LGA1700", ramType: "DDR4" }),
      part("ram", { ramType: "DDR4" }),
    ]).length,
    0,
  );
  assert.ok(
    selectionIssues([
      part("cpu", { socket: "AM5" }),
      part("ram", { ramType: "DDR4" }),
    ]).some((i) => i.code === "CPU_RAM_TYPE"),
  );
  assert.ok(
    selectionIssues([
      part("mobo", { ramType: "DDR4" }),
      part("ram", { ramType: "DDR5" }),
    ]).some((i) => i.code === "RAM_TYPE"),
  );
  assert.ok(
    selectionIssues([part("cpu", {}), part("mobo", {})]).some(
      (i) => i.code === "UNKNOWN_CRITICAL_SOCKET",
    ),
  );
});
test("referências preservam resolução, fontes e preços; notebooks não herdam 1440p de desktop", () => {
  assert.ok(data.games.length >= 40);
  assert.equal(data.games[0].results["RTX 4090"]["1080p"], 217.6);
  assert.equal(data.games[0].results["RTX 4090"]["1440p"], 192.3);
  assert.ok(systems.length >= 10);
  for (const system of systems) {
    assert.ok(Number.isSafeInteger(system.priceCents) && system.priceCents > 0);
    if (system.priceKind === "academic")
      assert.equal(system.offerUrl, undefined);
    else {
      assert.ok(
        system.offerUrl.startsWith("https://www.kabum.com.br/produto/"),
      );
      assert.ok(system.sellerName);
    }
    assert.ok(Number.isFinite(Date.parse(system.priceCheckedAt)));
    assert.equal(typeof system.available, "boolean");
    assert.ok(system.games.length >= 8);
    if (["acer-nitro-v15-51uz", "asus-tuf-a15-7735hs"].includes(system.id))
      assert.ok(system.games.every((g) => g.results["1440p"] === undefined));
  }
});
test("PCs e notebooks usam presets equivalentes e não copiam QHD ausente", () => {
  const pc = systems.find((s) => s.id === "reference-desktop5060");
  const laptop = systems.find((s) => s.id === "reference-laptop5060");
  for (const resolution of ["1080p", "1440p"])
    assert.ok(commonBenchmarks(pc.games, laptop.games, resolution).length >= 7);
  assert.ok(commonBenchmarks(pc.games, systems[2].games, "1080p").length >= 5);
  assert.equal(commonBenchmarks(pc.games, systems[2].games, "1440p").length, 0);
  assert.equal(
    sameBenchmark(
      { id: "cyberpunk16", preset: "Ultra" },
      laptop.games.find((g) => g.name.includes("Cyberpunk")),
    ),
    false,
  );
  assert.equal(
    laptop.games.find((g) => g.name.includes("Cyberpunk")).results["1080p"],
    90.8,
  );
  assert.equal(
    systems.find((s) => s.id === "reference-desktop5050").games.length,
    12,
  );
});
test("GPU conhecida com CPU sem índice mostra somente referência, sem entrar no ranking", () => {
  const parts = [
    { category: "cpu", name: "CPU sem índice" },
    { category: "gpu", name: "RTX 5050 8 GB" },
    { category: "ram", name: "32 GB DDR5" },
  ];
  const report = performanceReport({ parts }, data);
  assert.equal(report.kind, "gpu-reference");
  assert.equal(report.rankEligible, false);
  assert.equal(report.coveredGames, 12);
  assert.equal(
    report.games.find((g) => g.id === "toms-5050-cs2").referenceFps,
    239.4,
  );
  assert.ok(report.notes[0].includes("não uma estimativa"));
});
test("fonte e CPU de teste acompanham cada resultado; índices antigos ficam fora do ranking", () => {
  const parts = [
    { category: "cpu", name: "Ryzen 5 7600" },
    { category: "gpu", name: "RTX 5070 12 GB" },
    { category: "ram", name: "DDR5" },
  ];
  const report = performanceReport({ parts }, data);
  assert.equal(report.cpuProfile, "Ryzen 5 7600");
  assert.equal(report.rankEligible, false);
  const nbc = report.games.find((g) => g.id === "nbc-baldur-s-gate-3-2023");
  assert.equal(nbc.testSetup.cpu, "Core i9-14900K");
  assert.ok(nbc.source.includes("notebookcheck.net"));
  assert.ok(report.cpuSource.includes("4312-2"));
});
test("estimativa identifica CPU/GPU e não inventa FPS de GPU desconhecida ou variante móvel", () => {
  const parts = [
    { category: "cpu", name: "Ryzen 7 7800X3D" },
    { category: "gpu", name: "ROG Strix RTX 4090 OC 24 GB" },
    { category: "ram", name: "DDR5 32 GB" },
  ];
  const report = performanceReport({ parts }, data);
  assert.equal(report.kind, "estimate");
  assert.equal(report.coveredGames, 12);
  assert.ok(report.notes[0].includes("experimental"));
  for (const gpu of ["RTX 4090 Laptop", "RTX 5080 Ti", "RTX 9999", "RTX 4090D"])
    assert.equal(
      performanceReport(
        { parts: [parts[0], { category: "gpu", name: gpu }, parts[2]] },
        data,
      ).averageFps,
      null,
    );
  assert.equal(
    performanceReport({ parts: parts.slice(1) }, data).averageFps,
    null,
  );
});
function memoryUsers() {
  const docs = new Map();
  const db = {
    collection: (name) => ({ doc: (id) => ({ key: `${name}/${id}`, id }) }),
    runTransaction: async (fn) =>
      fn({
        get: async (ref) => ({
          exists: docs.has(ref.key),
          id: ref.id,
          data: () => docs.get(ref.key),
        }),
        create: (ref, value) => {
          assert.ok(!docs.has(ref.key));
          docs.set(ref.key, value);
        },
        update: (ref, value) =>
          docs.set(ref.key, { ...docs.get(ref.key), ...value }),
      }),
  };
  return { docs, dao: new UserDAO(() => db) };
}
test("Google cria CLIENT, mantém vínculo por UID e não expõe UID na resposta pública", async () => {
  const { dao } = memoryUsers(),
    identity = {
      uid: "verified-google-uid",
      email: "google@example.test",
      name: "Cliente Google",
    };
  const user = await dao.googleIdentity(identity);
  assert.equal(user.role, "CLIENT");
  assert.equal((await dao.googleIdentity(identity)).id, user.id);
  assert.equal(User.public(user).googleLinked, true);
  assert.equal(User.public(user).googleUid, undefined);
  await assert.rejects(
    () => dao.googleIdentity(identity, "another-user"),
    (e) => e.statusCode === 409,
  );
});
test("mesmo e-mail local exige vínculo autenticado e preserva o papel já existente", async () => {
  const { dao, docs } = memoryUsers(),
    email = "admin@example.test",
    key = createHash("sha256").update(email).digest("hex");
  docs.set(`user_emails/${key}`, { userId: "local-admin" });
  docs.set("users/local-admin", {
    id: "local-admin",
    email,
    name: "Admin",
    role: "ADMIN",
    passwordHash: "private",
  });
  const identity = { uid: "google-admin", email, name: "Admin" };
  await assert.rejects(
    () => dao.googleIdentity(identity),
    (e) => e.statusCode === 409,
  );
  const linked = await dao.googleIdentity(identity, "local-admin");
  assert.equal(linked.role, "ADMIN");
  assert.equal(linked.passwordHash, "private");
});
test("tokens Google ausentes ou excessivos são rejeitados antes de consultar Firebase", async () => {
  for (const value of [undefined, "abc", "x".repeat(15001)])
    await assert.rejects(
      () => verifyGoogleToken(value),
      (e) => e.statusCode === 400,
    );
});

test("somente Gmail verificado pelo provedor Google recebe indicação de vínculo automático", () => {
  const claims = {
    uid: "uid-verificado",
    email: "Pessoa@Gmail.com",
    email_verified: true,
    firebase: { sign_in_provider: "google.com" },
  };
  assert.equal(
    identityFromVerifiedGoogleClaims(claims).email,
    "pessoa@gmail.com",
  );
  assert.equal(
    identityFromVerifiedGoogleClaims(claims).authoritativeEmail,
    true,
  );
  for (const email of ["pessoa@outlook.com", "pessoa@gmail.com.exemplo.com"])
    assert.equal(
      identityFromVerifiedGoogleClaims({ ...claims, email }).authoritativeEmail,
      false,
    );
  for (const changed of [
    { email_verified: false },
    { firebase: { sign_in_provider: "password" } },
  ])
    assert.throws(
      () => identityFromVerifiedGoogleClaims({ ...claims, ...changed }),
      (e) => e.statusCode === 401,
    );
});

function localGoogleUser(changes = {}) {
  const store = memoryUsers();
  const email = "cliente@gmail.com";
  const saved = {
    id: "local-client",
    email,
    name: "Cliente existente",
    role: "CLIENT",
    passwordHash: "hash-preservado",
    preferences: { defaultResolution: "1440p" },
    ...changes,
  };
  store.docs.set(
    `user_emails/${createHash("sha256").update(email).digest("hex")}`,
    { userId: saved.id },
  );
  store.docs.set(`users/${saved.id}`, saved);
  return {
    ...store,
    saved,
    identity: {
      uid: "google-uid-verificado",
      email,
      name: "Nome Google",
      authoritativeEmail: true,
    },
  };
}

test("Gmail verificado vincula cliente existente sem duplicar conta nem alterar senha, preferências ou papel", async () => {
  const { dao, docs, saved, identity } = localGoogleUser();
  const linked = await dao.googleIdentity(identity);
  assert.equal(linked.id, saved.id);
  assert.equal(linked.role, "CLIENT");
  assert.equal(linked.passwordHash, saved.passwordHash);
  assert.deepEqual(linked.preferences, saved.preferences);
  assert.equal((await dao.googleIdentity(identity)).id, saved.id);
  assert.equal(
    [...docs.keys()].filter((k) => k.startsWith("users/")).length,
    1,
  );
});

test("Gmail sem indicação verificada e conta administrativa continuam exigindo vínculo autenticado", async () => {
  for (const changes of [{}, { role: "ADMIN" }]) {
    const { dao, docs, saved, identity } = localGoogleUser(changes);
    const input = changes.role
      ? identity
      : { ...identity, authoritativeEmail: false };
    await assert.rejects(
      () => dao.googleIdentity(input),
      (e) => e.statusCode === 409,
    );
    assert.equal(docs.get(`users/${saved.id}`).googleUid, undefined);
    const linked = await dao.googleIdentity(input, saved.id);
    assert.equal(linked.role, saved.role);
  }
});

test("vínculo automático rejeita conta desabilitada, outro UID ou índice de e-mail divergente sem gravar", async () => {
  for (const [changes, status] of [
    [{ disabled: true }, 403],
    [{ googleUid: "outra-identidade" }, 409],
    [{ email: "outra@gmail.com" }, 409],
  ]) {
    const { dao, docs, identity, saved } = localGoogleUser(changes);
    await assert.rejects(
      () => dao.googleIdentity(identity),
      (e) => e.statusCode === status,
    );
    assert.equal(
      [...docs.keys()].filter((k) => k.startsWith("google_identities/")).length,
      0,
    );
    assert.equal(docs.get(`users/${saved.id}`).googleUid, saved.googleUid);
  }
});
test("catálogo compartilha consulta em andamento, descarta falha e limita o cache público", async () => {
  const dao = new ComponentDAO(() => {});
  let calls = 0;
  dao.queryList = async () => {
    calls++;
    return { items: [], nextCursor: null };
  };
  await Promise.all([dao.list({ limit: 100 }), dao.list({ limit: 100 })]);
  assert.equal(calls, 1);
  for (let i = 0; i < 80; i++) await dao.list({ limit: 20, cursor: String(i) });
  assert.equal(dao.catalogCache.size, 64);
  dao.queryList = async () => {
    throw Error("outage");
  };
  await assert.rejects(() => dao.list({ limit: 1 }));
  assert.equal(dao.catalogCache.has(JSON.stringify([1, null, null])), false);
});
test("cópia pública é paginada sem duplicar produtos e nunca fornece credenciais", () => {
  const rows = [];
  let cursor;
  do {
    const page = localCatalog({ limit: 100, cursor });
    rows.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);
  assert.equal(rows.length, 317);
  assert.equal(new Set(rows.map((p) => p.id)).size, 317);
  assert.ok(
    localCatalog({ limit: 100, category: "cooler" }).items.every(
      (p) => p.category === "cooler",
    ),
  );
  assert.ok(rows.every((p) => !p.passwordHash && !p.userId && !p.private_key));
});
test("vitrine e rascunho assinado funcionam sem leitura de sessão; carrinho continua exigindo banco", async () => {
  const store = new session.MemoryStore();
  let reads = 0;
  store.get = (_id, callback) => {
    reads++;
    callback(Object.assign(new Error("Quota exceeded"), { code: 8 }));
  };
  const secret = "local-test-secret-at-least-thirty-two-characters";
  const app = createApp({
    sessionStore: store,
    sessionSecret: secret,
    referenceDAO: { systems: async () => systems },
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`,
    headers = {
      Cookie: `dreambuild.sid=${encodeURIComponent("s:" + signature.sign("known-session", secret))}`,
    };
  try {
    for (const path of [
      "/api/systems",
      "/api/auth/providers",
      "/api/builds/draft",
    ])
      assert.equal((await fetch(base + path, { headers })).status, 200);
    assert.equal(reads, 0);
    assert.equal((await fetch(base + "/api/cart", { headers })).status, 503);
    assert.equal(reads, 1);
  } finally {
    await new Promise((r) => server.close(r));
  }
});
