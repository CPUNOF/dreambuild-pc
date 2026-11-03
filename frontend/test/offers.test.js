// CT-UNI-09 / CT-UNI-10 — Regras de preço e disponibilidade exibidas na loja.
import { describe, expect, test } from "vitest";
import {
  bestOffer,
  availabilityLabel,
  money,
  consultationDate,
} from "../src/data/offers.js";
import { platformOf, psuFit } from "../src/data/componentSelection.js";

const offer = (over = {}) => ({
  store: "kabum",
  paymentMethod: "pix",
  availability: "in_stock",
  priceCents: 50000,
  ...over,
});

describe("CT-UNI-09 bestOffer escolhe a menor oferta elegível", () => {
  test("entre várias lojas fica com o menor preço PIX disponível", () => {
    const product = {
      offers: [
        offer({ store: "kabum", priceCents: 50000 }),
        offer({ store: "pichau", priceCents: 45000 }),
        offer({
          store: "terabyte",
          priceCents: 40000,
          availability: "out_of_stock",
        }),
        offer({ store: "terabyte", priceCents: 1000, paymentMethod: "card" }),
      ],
    };
    expect(bestOffer(product)).toMatchObject({
      store: "pichau",
      priceCents: 45000,
    });
    expect(bestOffer(product, "card").priceCents).toBe(1000);
  });

  test.each([
    ["sem ofertas", undefined],
    ["lista vazia", []],
    ["só sem estoque", [offer({ availability: "out_of_stock" })]],
    ["preço nulo", [offer({ priceCents: null })]],
    ["preço zero", [offer({ priceCents: 0 })]],
    ["preço fracionário", [offer({ priceCents: 10.5 })]],
  ])("retorna null quando %s", (_label, offers) => {
    expect(bestOffer({ offers })).toBeNull();
  });

  test.each([
    [[offer()], "Disponível na consulta"],
    [[offer({ availability: "out_of_stock" })], "Sem estoque na consulta"],
    [[offer({ availability: "unknown" })], "Disponibilidade não confirmada"],
    [[], "Disponibilidade não confirmada"],
  ])("availabilityLabel(%j) = %s", (offers, label) => {
    expect(availabilityLabel({ offers })).toBe(label);
  });

  test("money formata centavos em reais (pt-BR)", () => {
    expect(money(39999).replace(/\s/g, " ")).toBe("R$ 399,99");
    expect(money(151996).replace(/\s/g, " ")).toBe("R$ 1.519,96");
    expect(money(1).replace(/\s/g, " ")).toBe("R$ 0,01");
  });

  test("consultationDate usa data e hora curtas", () => {
    expect(consultationDate("2026-10-30T15:04:00")).toMatch(
      /30\/10\/2026.*15:04/,
    );
  });
});

describe("CT-UNI-10 seletor de peças (partições e tabela de decisão)", () => {
  test.each([
    [{ category: "cpu", brand: "AMD", name: "Ryzen 5", fullName: "" }, "AMD"],
    [
      { category: "cpu", brand: "Intel", name: "Core i5", fullName: "" },
      "Intel",
    ],
    [
      { category: "cpu", brand: "X", name: "Chip", fullName: "" },
      "Não identificado",
    ],
    [
      { category: "gpu", brand: "MSI", name: "RTX 5060", fullName: "" },
      "NVIDIA",
    ],
    [
      {
        category: "gpu",
        brand: "Sapphire",
        name: "Radeon RX 7600",
        fullName: "",
      },
      "AMD",
    ],
    [
      { category: "gpu", brand: "Intel", name: "Arc B580", fullName: "" },
      "Intel",
    ],
    [
      {
        category: "mobo",
        brand: "Asus",
        name: "B650",
        fullName: "",
        hardware: { socket: "AM5" },
      },
      "AMD",
    ],
    [
      {
        category: "mobo",
        brand: "Asus",
        name: "B760",
        fullName: "",
        hardware: { socket: "LGA1700" },
      },
      "Intel",
    ],
    [
      { category: "cooler", brand: "X", name: "AIO 240 Water", fullName: "" },
      "Water cooler",
    ],
    [
      { category: "cooler", brand: "X", name: "Hyper 212", fullName: "" },
      "Air cooler",
    ],
    [{ category: "ram", brand: "X", name: "Fury DDR5", fullName: "" }, "DDR5"],
    [
      {
        category: "ram",
        brand: "X",
        name: "Fury",
        fullName: "",
        hardware: { ramType: "DDR4" },
      },
      "DDR4",
    ],
    [
      { category: "storage", brand: "Adata", name: "SU650", fullName: "" },
      "Adata",
    ],
  ])("platformOf(%j) = %s", (product, expected) => {
    expect(platformOf(product)).toBe(expected);
  });

  // Tabela de decisão da fonte (PSU): potência × conectores × gabinete.
  const gpu = { category: "gpu", hardware: { powerConnector: "pcie8" } };
  const mobo = { category: "mobo", hardware: { powerConnector: "eps8" } };
  const enclosure = { category: "case", hardware: { maxPsuLengthMm: 180 } };
  const psu = (h) => ({ category: "psu", hardware: h });
  const ok = {
    wattage: 650,
    connectors: ["pcie8", "atx24", "eps8"],
    lengthMm: 160,
  };
  test.each([
    ["sem recomendação de potência", psu(ok), null, [gpu], "unknown"],
    [
      "potência não informada",
      psu({ ...ok, wattage: undefined }),
      600,
      [gpu],
      "unknown",
    ],
    [
      "abaixo da recomendação (VL: 599 < 600)",
      psu({ ...ok, wattage: 599 }),
      600,
      [gpu],
      "fail",
    ],
    [
      "igual à recomendação (VL: 600)",
      psu({ ...ok, wattage: 600 }),
      600,
      [gpu, mobo, enclosure],
      "pass",
    ],
    [
      "sem conector da GPU",
      psu({ ...ok, connectors: ["atx24", "eps8"] }),
      600,
      [gpu],
      "fail",
    ],
    [
      "conectores da placa-mãe ausentes",
      psu({ ...ok, connectors: ["pcie8"] }),
      600,
      [gpu, mobo],
      "unknown",
    ],
    ["sem gabinete para medir", psu(ok), 600, [gpu, mobo], "unknown"],
    [
      "maior que o gabinete (181 > 180)",
      psu({ ...ok, lengthMm: 181 }),
      600,
      [gpu, mobo, enclosure],
      "fail",
    ],
    [
      "cabe no limite (180 = 180)",
      psu({ ...ok, lengthMm: 180 }),
      600,
      [gpu, mobo, enclosure],
      "pass",
    ],
  ])("psuFit: %s → %s", (_l, product, watts, parts, status) => {
    expect(psuFit(product, { recommendedPsuWatts: watts }, parts).status).toBe(
      status,
    );
  });
});
