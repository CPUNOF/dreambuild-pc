import { test } from "node:test";
import assert from "node:assert/strict";
import { Upgrade } from "../src/models/Upgrade.js";
import { Build } from "../src/models/Build.js";
import { products } from "../../frontend/src/data/products.js";
import { hardwareFacts } from "../data/hardwareFacts.js";
test("sugestão didática não inventa peça e rejeita upgrade incompatível", () => {
  const parts = products.map((p) => ({
    ...p,
    hardware: { ...hardwareFacts[p.id] },
  }));
  const selection = Object.fromEntries(parts.map((p) => [p.category, p.id]));
  assert.equal(
    Upgrade.suggest(Build.analyze(selection, parts), []).candidate,
    null,
  );
  const cpu = parts.find((p) => p.category === "cpu");
  cpu.simulationScore = 60;
  const analysis = Build.analyze(selection, parts);
  const wrong = {
    ...cpu,
    id: "wrong",
    simulationScore: 100,
    hardware: { ...cpu.hardware, socket: "AM4" },
  };
  const valid = { ...cpu, id: "valid", simulationScore: 95 };
  assert.equal(Upgrade.suggest(analysis, [wrong]).status, "no_candidate");
  assert.equal(Upgrade.suggest(analysis, [wrong, valid]).candidate.id, "valid");
  assert.equal(Upgrade.suggest(analysis, []).candidate, null);
  parts.find((part) => part.category === "gpu").simulationScore = 70;
  const overkill = { ...valid, id: "overkill", simulationScore: 100 };
  assert.equal(
    Upgrade.suggest(Build.analyze(selection, parts), [overkill]).candidate,
    null,
    "Índice maior que piora o equilíbrio didático não vira sugestão.",
  );
});
