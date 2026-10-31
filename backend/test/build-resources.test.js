import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Build } from "../src/models/Build.js";
import {
  buildResources,
  includedCooling,
} from "../../shared/buildResources.js";
import { selectionIssues } from "../../shared/selectionCompatibility.js";
import { hardwareFacts } from "../data/hardwareFacts.js";
import { products } from "../../frontend/src/data/products.js";
import { CommunityController } from "../src/controllers/CommunityController.js";
import { parseComponent } from "../src/models/ComponentInput.js";
const catalog = JSON.parse(
  readFileSync(new URL("../data/publicCatalogSnapshot.json", import.meta.url)),
).items;
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
const ids = Object.fromEntries(parts.map((p) => [p.category, p.id]));
const extra = {
  ...parts.find((p) => p.category === "storage"),
  id: "extra-sata",
  name: "SATA de teste",
  hardware: {
    interface: "SATA 6Gb/s",
    formFactor: "2.5 inch",
    capacityGb: 1000,
  },
};
test("quantidades de kits contam módulos/GB e multiplicam preço; excesso bloqueia", () => {
  const a = Build.analyze(ids, parts, "pix", {
    quantities: { corsair: 2, samsung: 3 },
  });
  assert.equal(a.compatible, true);
  assert.equal(a.resources.ram.modules, 4);
  assert.equal(a.resources.ram.capacityGb, 64);
  assert.equal(a.resources.storage.nvme, 3);
  assert.equal(a.comparison.optimized.totalCents, 110000);
  assert.equal(a.itemCount, 11);
  assert.ok(a.auxiliaryReserveWatts > 50);
  assert.ok(
    Build.analyze(ids, parts, "pix", { quantities: { corsair: 3 } }).notes.some(
      (n) => n.code === "RAM_SLOTS",
    ),
  );
  const p = structuredClone(parts);
  p.find((p) => p.category === "mobo").hardware.maxRamGb = 32;
  assert.ok(
    Build.analyze(ids, p, "pix", { quantities: { corsair: 2 } }).notes.some(
      (n) => n.code === "RAM_CAPACITY",
    ),
  );
});
test("NVMe e SATA coexistem com quantidades; M.2 SATA não vira segundo NVMe", () => {
  const a = Build.analyze(ids, [...parts, extra], "pix", {
    storageIds: [extra.id],
    quantities: { samsung: 2, [extra.id]: 4 },
  });
  assert.equal(a.compatible, true);
  assert.equal(a.parts.length, 9);
  assert.equal(a.resources.storage.total, 6);
  assert.equal(a.resources.storage.assignments.length, 6);
  assert.equal(a.comparison.optimized.totalCents, 130000);
  assert.equal(
    Build.analyze(ids, parts, "pix", { quantities: { samsung: 4 } }).compatible,
    false,
  );
  assert.ok(
    buildResources(
      [
        catalog.find((p) => p.id === "kabum-100672"),
        parts.find((p) => p.category === "storage"),
      ],
      { samsung: 2 },
    ).issues.some((i) => i.code === "STORAGE_CONNECTIONS"),
  );
});
test("alocação considera SATA compartilhada no protocolo certo e restrição por CPU", () => {
  const board = catalog.find((p) => p.id === "kabum-941241"),
    nvme = parts.find((p) => p.category === "storage"),
    m2sata = {
      ...extra,
      id: "m2-sata",
      hardware: { interface: "SATA", formFactor: "M.2 2280", capacityGb: 500 },
    };
  assert.equal(
    buildResources([board, nvme, extra], { samsung: 2, [extra.id]: 4 }).issues
      .length,
    0,
  );
  assert.ok(
    buildResources([board, nvme, m2sata, extra], { [extra.id]: 4 }).issues.some(
      (i) => i.code === "STORAGE_CONNECTIONS",
    ),
  );
  const fits = buildResources([board, nvme, m2sata, extra], { [extra.id]: 3 });
  assert.equal(fits.issues.length, 0);
  assert.deepEqual(fits.storage.disabledSataPorts, [8]);
  assert.deepEqual(
    fits.storage.assignments
      .filter((d) => d.kind === "sata")
      .map((d) => d.connection),
    ["SATA 5", "SATA 6", "SATA 7"],
  );
  const x870 = catalog.find((p) => p.id === "kabum-701357"),
    cpu = { category: "cpu", name: "Ryzen 5 8500G" };
  assert.ok(buildResources([x870, cpu, nvme], { samsung: 4 }).issues.length);
  assert.equal(
    buildResources([x870, { ...cpu, name: "Ryzen 7 9800X3D" }, nvme], {
      samsung: 4,
    }).issues.length,
    0,
  );
});
test("dados ausentes e SSD externo não são aprovados como conexão interna", () => {
  const b = {
      category: "mobo",
      hardware: { ramSlots: 2, maxRamGb: 64, sataPorts: 4 },
    },
    ram = { category: "ram", id: "ram", hardware: { capacityGb: 32 } };
  assert.ok(
    buildResources([b, ram]).issues.some(
      (i) => i.code === "UNKNOWN_RAM_MODULES",
    ),
  );
  assert.ok(
    buildResources([
      b,
      parts.find((p) => p.category === "storage"),
    ]).issues.some((i) => i.code === "UNKNOWN_M2_SLOTS"),
  );
  assert.ok(
    buildResources([
      b,
      catalog.find((p) => p.id === "kabum-476239"),
    ]).issues.some((i) => i.code === "UNKNOWN_STORAGE_INTERFACE"),
  );
});
test("cooler incluído só dispensa peça separada quando confirmado; socket do avulso é exato", () => {
  const config = { ...ids };
  delete config.cooler;
  const p = structuredClone(parts);
  p.find((p) => p.category === "cpu").hardware = {
    ...hardwareFacts.ryzen,
    coolerPackage: "included",
    boxedCoolerName: "Cooler de teste validado",
  };
  const a = Build.analyze(config, p);
  assert.equal(a.complete, true);
  assert.equal(a.compatible, true);
  assert.equal(a.comparison.optimized.totalCents, 70000);
  assert.equal(a.resources.cooling.included, true);
  assert.equal(Build.analyze(config, parts).complete, false);
  assert.equal(
    includedCooling({ hardware: { coolerPackage: "included" } }),
    false,
  );
  for (const socket of ["AM4", "LGA1200", "LGA1700", "LGA1851"])
    assert.ok(
      selectionIssues([
        parts.find((p) => p.category === "cpu"),
        { category: "cooler", hardware: { supportedSockets: [socket] } },
      ]).some((i) => i.code === "COOLER_SOCKET"),
    );
  assert.equal(
    selectionIssues([
      { category: "cpu", hardware: { socket: "LGA 1700" } },
      { category: "cooler", hardware: { supportedSockets: ["LGA1700"] } },
    ]).length,
    0,
  );
  assert.ok(
    selectionIssues([
      parts.find((p) => p.category === "cpu"),
      { category: "cooler", hardware: {} },
    ]).some((i) => i.code === "UNKNOWN_COOLER_SOCKET"),
  );
  assert.equal(
    includedCooling(catalog.find((p) => p.id === "kabum-405799")),
    true,
  );
});
test("configuração rejeita frações, negativos, quantidades de CPU e armazenamento duplicado", () => {
  for (const o of [
    { quantities: { corsair: 0 } },
    { quantities: { corsair: 1.5 } },
    { quantities: { corsair: -1 } },
    { quantities: { ryzen: 2 } },
    { storageIds: ["samsung"] },
    { storageIds: ["x", "x"] },
    { quantities: { samsung: 17 } },
    { storageIds: [extra.id], quantities: { samsung: 10, [extra.id]: 10 } },
  ])
    assert.throws(() => Build.configuration({ partIds: ids, ...o }), {
      statusCode: 400,
    });
  assert.throws(
    () => Build.analyze(ids, parts, "pix", { storageIds: ["absent"] }),
    { statusCode: 400 },
  );
  assert.deepEqual(Build.configuration({ partIds: ids }).storageIds, []);
});
test("cadastro aceita nomes oficiais M.2_1 e rejeita protocolos inválidos", () => {
  const p = catalog.find((p) => p.id === "tuf-b650"),
    parsed = parseComponent(p);
  assert.equal(parsed.hardware.m2Slots[0].id, "M.2_1");
  assert.equal(parsed.hardware.sataPorts, 4);
  assert.throws(
    () =>
      parseComponent({
        ...p,
        hardware: {
          ...p.hardware,
          m2Slots: [{ id: "bad", protocols: ["wifi"], formats: ["M.2 2280"] }],
        },
      }),
    { statusCode: 400 },
  );
});
test("prévia pública preserva quantidades, custo unitário e RAM total sem inventar ganho de FPS", async () => {
  const d = JSON.parse(
      readFileSync(
        new URL("../data/referenceBenchmarks.json", import.meta.url),
      ),
    ),
    config = {
      id: "b",
      userId: "a",
      partIds: ids,
      quantities: { corsair: 2, samsung: 2 },
      storageIds: [extra.id],
    };
  const c = new CommunityController({
    builds: { getById: async () => config },
    components: { getMany: async () => [...parts, extra] },
    references: { dataset: async () => d },
  });
  const r = await c.prepare("a", "b");
  assert.equal(r.data.parts.find((p) => p.id === "corsair").quantity, 2);
  assert.equal(r.data.ramCapacityGb, 64);
  assert.equal(r.data.priceCents, 110000);
  assert.equal(
    r.data.quotes.find((q) => q.componentId === "corsair").unitPriceCents,
    10000,
  );
  assert.equal(
    r.data.quotes.find((q) => q.componentId === "corsair").priceCents,
    20000,
  );
});
