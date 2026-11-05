import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { withVerifiedHardware } from "../../shared/verifiedHardware.js";
import { suggestAssembly } from "../../shared/suggestAssembly.js";
import {
  assemblyIssues,
  introducedIssues,
} from "../../shared/assemblyCompatibility.js";
import { Build } from "../src/models/Build.js";
import { psuFit } from "../../frontend/src/data/componentSelection.js";
const products = JSON.parse(
  readFileSync(new URL("../data/publicCatalogSnapshot.json", import.meta.url)),
).items.map((p) =>
  withVerifiedHardware({
    ...p,
    inventory: { quantity: 50, unitPriceCents: 10000 },
  }),
);
for (const [name, cpu] of [
  ["AM4", "kabum-320799"],
  ["AM5", "kabum-405799"],
  ["Intel LGA1700", "kabum-283713"],
])
  test(`sugestão ${name} chega completa à análise do servidor sem remover bloqueios`, () => {
    const selection = suggestAssembly(products, cpu);
    assert.ok(selection);
    assert.equal(selection.cpu, cpu);
    const parts = products.filter((p) =>
        Object.values(selection).includes(p.id),
      ),
      result = Build.analyze(selection, parts);
    assert.equal(result.complete, true);
    assert.equal(result.compatible, true, JSON.stringify(result.notes));
    assert.equal(result.missingCategories.includes("cooler"), false);
  });
test("fonte é validada pela potência e conectores sem bloqueio por comprimento", () => {
  const parts = products.filter((p) =>
      ["kabum-283713", "kabum-941241", "kabum-1000741"].includes(p.id),
    ),
    psu = products.find((p) => p.id === "kabum-369658"),
    power = { recommendedPsuWatts: 550 };
  assert.equal(psuFit(psu, power, parts).status, "pass");
  assert.equal(
    psuFit(psu, power, parts, { allowPendingCase: true }).status,
    "pass",
  );
  assert.equal(
    psuFit(
      { ...psu, hardware: { ...psu.hardware, wattage: 450 } },
      power,
      parts,
      { allowPendingCase: true },
    ).status,
    "fail",
  );
});
test("erro antigo de RAM não bloqueia a troca de outra categoria e erro novo continua bloqueado", () => {
  const board = products.find((p) => p.id === "kabum-100672"),
    badRam = {
      id: "bad",
      category: "ram",
      hardware: { ramType: "DDR4", capacityGb: 16 },
    },
    gpu = products.find((p) => p.id === "kabum-1000741");
  const before = assemblyIssues([board, badRam]);
  assert.ok(before.some((i) => i.code === "UNKNOWN_RAM_MODULES"));
  assert.deepEqual(
    introducedIssues(before, assemblyIssues([board, badRam, gpu])),
    [],
  );
  const cpu = products.find((p) => p.id === "kabum-405799");
  assert.ok(
    introducedIssues(before, assemblyIssues([board, badRam, cpu])).some(
      (i) => i.code === "SOCKET",
    ),
  );
});
test("fonte e gabinete incompatíveis são rejeitados antes da finalização", () => {
  const selection = suggestAssembly(products, "kabum-283713"),
    parts = products.filter((p) => Object.values(selection).includes(p.id));
  const smallCase = parts.map((p) =>
    p.category === "case"
      ? { ...p, hardware: { ...p.hardware, maxGpuLengthMm: 10 } }
      : p,
  );
  assert.ok(assemblyIssues(smallCase).some((i) => i.code === "GPU_LENGTH"));
  const weakPsu = parts.map((p) =>
    p.category === "psu"
      ? { ...p, hardware: { ...p.hardware, wattage: 200 } }
      : p,
  );
  assert.ok(assemblyIssues(weakPsu).some((i) => i.code === "PSU_POWER"));
});
