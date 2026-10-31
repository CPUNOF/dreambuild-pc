import assert from "node:assert/strict";
import { test } from "node:test";
import { Build } from "../src/models/Build.js";
import { Comparison } from "../src/models/Comparison.js";
import { products } from "../../frontend/src/data/products.js";
import { hardwareFacts } from "../data/hardwareFacts.js";
const fixture = () =>
  products.map((part) => ({
    ...part,
    hardware: { ...hardwareFacts[part.id] },
  }));
const selection = Object.fromEntries(
  products.map((part) => [part.category, part.id]),
);

test("conjunto inicial completo passa nos critérios, com fonte de 1000 W e limites explicados", () => {
  const result = Build.analyze(selection, fixture());
  assert.equal(result.complete, true);
  assert.equal(result.compatible, true);
  assert.equal(result.totalWatts, 620);
  assert.equal(result.powerWithMarginWatts, 775);
  assert.equal(result.recommendedPsuWatts, 1000);
  assert.equal(result.comparison.optimized.totalCents, null);
  assert.ok(result.notes.some((note) => note.code === "BIOS"));
  const variants = fixture();
  variants.find((p) => p.category === "mobo").hardware.formFactor = "micro-ATX";
  variants.find((p) => p.category === "case").hardware.formFactors = [
    "microATX",
  ];
  assert.equal(Build.analyze(selection, variants).compatible, true);
});
test("socket, DDR, tamanho e fonte incompatíveis são detectados no servidor", () => {
  const parts = fixture();
  parts.find((part) => part.category === "cpu").hardware.socket = "AM4";
  parts.find((part) => part.category === "ram").hardware.ramType = "DDR4";
  parts.find((part) => part.category === "case").hardware.maxGpuLengthMm = 300;
  parts.find((part) => part.category === "psu").hardware.wattage = 500;
  const result = Build.analyze(selection, parts);
  assert.equal(result.compatible, false);
  for (const code of ["SOCKET", "RAM_TYPE", "GPU_LENGTH", "PSU_POWER"])
    assert.ok(
      result.notes.some((note) => note.code === code),
      code,
    );
});
test("valores de energia ausentes não viram zero nem recomendação válida", () => {
  const parts = fixture();
  delete parts.find((part) => part.category === "gpu").hardware
    .referencePowerWatts;
  const result = Build.analyze(selection, parts);
  assert.equal(result.recommendedPsuWatts, null);
  assert.equal(result.compatible, false);
  assert.ok(result.notes.some((note) => note.code === "UNKNOWN_POWER"));
});
test("fonte não recebe recomendação sem o piso publicado da GPU e considera potência máxima da CPU", () => {
  const parts = fixture(),
    gpu = parts.find((p) => p.category === "gpu"),
    cpu = parts.find((p) => p.category === "cpu");
  delete gpu.hardware.recommendedPsuWatts;
  const missing = Build.analyze(selection, parts);
  assert.equal(missing.recommendedPsuWatts, null);
  assert.equal(missing.compatible, false);
  assert.ok(
    missing.notes.some((n) => n.code === "UNKNOWN_GPU_PSU_RECOMMENDATION"),
  );
  gpu.hardware.recommendedPsuWatts = 1000;
  cpu.hardware.maxPowerWatts = 400;
  const high = Build.analyze(selection, parts);
  assert.equal(high.recommendedPsuWatts, 1125);
  assert.ok(high.notes.some((n) => n.code === "PSU_POWER"));
  gpu.hardware.referencePowerWatts = 0;
  assert.equal(Build.analyze(selection, parts).recommendedPsuWatts, null);
});
test("water cooler exige tamanho de radiador suportado, sem comparar com altura de air cooler", () => {
  const parts = fixture(),
    cooler = parts.find((p) => p.category === "cooler"),
    enclosure = parts.find((p) => p.category === "case");
  cooler.hardware = {
    coolingType: "liquid",
    radiatorSizeMm: 360,
    supportedSockets: ["AM5"],
  };
  assert.ok(
    Build.analyze(selection, parts).notes.some(
      (n) => n.code === "UNKNOWN_RADIATOR",
    ),
  );
  enclosure.hardware.radiatorSizes = ["240"];
  assert.ok(
    Build.analyze(selection, parts).notes.some(
      (n) => n.code === "RADIATOR_SIZE",
    ),
  );
  enclosure.hardware.radiatorSizes = ["240", "360"];
  assert.equal(Build.analyze(selection, parts).compatible, true);
});
test("peça removida, categoria trocada e ID inseguro são rejeitados; montagem parcial é marcada", () => {
  assert.throws(() => Build.selection({ cpu: "a/b/c" }));
  assert.throws(() => Build.analyze({ cpu: "samsung" }, fixture()));
  assert.throws(() => Build.analyze({ cpu: "nao-existe" }, fixture()));
  const partial = Build.analyze({ cpu: "ryzen" }, fixture());
  assert.equal(partial.complete, false);
  assert.equal(partial.compatible, false);
  assert.equal(partial.missingCategories.length, 7);
});
test("comparador escolhe apenas lojas completas e calcula compra combinada por modalidade", () => {
  const offer = (
    store,
    price,
    paymentMethod = "pix",
    availability = "in_stock",
  ) => ({
    store,
    priceCents: price,
    paymentMethod,
    availability,
    sourceUrl: "https://example.test",
    checkedAt: "2026-10-30T00:00:00Z",
  });
  const parts = [
    {
      id: "a",
      name: "A",
      model: "A",
      offers: [
        offer("kabum", 100),
        offer("pichau", 80),
        offer("terabyte", 1, "card"),
      ],
    },
    {
      id: "b",
      name: "B",
      model: "B",
      offers: [
        offer("kabum", 200),
        offer("pichau", 500),
        offer("terabyte", 1, "pix", "out_of_stock"),
      ],
    },
  ];
  const result = Comparison.calculate(parts);
  assert.equal(result.cheapestSingleStore.store, "kabum");
  assert.equal(result.cheapestSingleStore.totalCents, 300);
  assert.equal(result.optimized.totalCents, 280);
  assert.equal(
    result.singleStores.find((store) => store.store === "terabyte").totalCents,
    null,
  );
  assert.equal(result.shippingIncluded, false);
  parts[1].offers = [];
  const missing = Comparison.calculate(parts);
  assert.equal(missing.cheapestSingleStore, null);
  assert.equal(missing.optimized.totalCents, null);
  assert.deepEqual(missing.optimized.missingComponentIds, ["b"]);
  assert.equal(Comparison.calculate([]).optimized.complete, false);
});
