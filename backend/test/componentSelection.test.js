import { test } from "node:test";
import assert from "node:assert/strict";
import {
  platformOf,
  psuFit,
} from "../../frontend/src/data/componentSelection.js";
test("seletor distingue chip de marca comercial e não recomenda fonte sem conectores/dimensões", () => {
  assert.equal(
    platformOf({
      category: "gpu",
      name: "ASUS GeForce RTX 5070",
      fullName: "",
      brand: "ASUS",
    }),
    "NVIDIA",
  );
  assert.equal(
    platformOf({
      category: "gpu",
      name: "ASRock Radeon RX 9070",
      fullName: "",
      brand: "ASRock",
    }),
    "AMD",
  );
  assert.equal(
    platformOf({
      category: "mobo",
      name: "TUF B650",
      fullName: "",
      hardware: { socket: "AM5" },
    }),
    "AMD",
  );
  const parts = [
      { category: "gpu", hardware: { powerConnector: "16pin" } },
      { category: "case", hardware: { maxPsuLengthMm: 250 } },
    ],
    analysis = { recommendedPsuWatts: 1000 };
  assert.equal(
    psuFit({ hardware: { wattage: 650 } }, analysis, parts).status,
    "fail",
  );
  assert.equal(
    psuFit({ hardware: { wattage: 1000 } }, analysis, parts).status,
    "unknown",
  );
  assert.equal(
    psuFit(
      { hardware: { wattage: 1000, connectors: ["16pin"], lengthMm: 140 } },
      analysis,
      parts,
    ).status,
    "pass",
  );
  assert.equal(
    psuFit(
      { hardware: { wattage: 1600, connectors: ["16pin"], lengthMm: 280 } },
      analysis,
      parts,
    ).status,
    "fail",
  );
  assert.equal(
    psuFit({ hardware: { wattage: 1600 } }, null, parts).status,
    "unknown",
  );
  const withBoard = [...parts, { category: "mobo", hardware: {} }];
  assert.equal(
    psuFit(
      { hardware: { wattage: 1000, connectors: ["16pin"], lengthMm: 150 } },
      analysis,
      withBoard,
    ).status,
    "unknown",
  );
  assert.equal(
    psuFit(
      {
        hardware: {
          wattage: 1000,
          connectors: ["atx24", "eps8", "16pin"],
          lengthMm: 150,
        },
      },
      analysis,
      withBoard,
    ).status,
    "pass",
  );
});
