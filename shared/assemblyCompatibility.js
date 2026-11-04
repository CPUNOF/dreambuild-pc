import { selectionIssues } from "./selectionCompatibility.js";
import { buildResources } from "./buildResources.js";
const positive = (value) =>
  typeof value === "number" && Number.isFinite(value) && value > 0;
const normalized = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
export function assemblyReadiness(product) {
  const h = product.hardware || {};
  const needs = {
    cpu: ["socket"],
    mobo: [
      "socket",
      "ramType",
      "ramSlots",
      "maxRamGb",
      "formFactor",
      "storageFormats",
      "m2Slots",
      "sataPorts",
    ],
    ram: ["ramType", "modules", "capacityGb"],
    gpu: [
      "referencePowerWatts",
      "recommendedPsuWatts",
      "powerConnector",
      "lengthMm",
    ],
    storage: ["interface", "formFactor"],
    psu: ["wattage", "connectors", "lengthMm"],
    case: [
      "formFactors",
      "maxGpuLengthMm",
      "maxCoolerHeightMm",
      "maxPsuLengthMm",
    ],
    cooler: [
      "supportedSockets",
      h.coolingType === "liquid" ? "radiatorSizeMm" : "heightMm",
    ],
  };
  const missing = (needs[product.category] || []).filter(
    (key) =>
      h[key] === undefined ||
      h[key] === null ||
      h[key] === "" ||
      (Array.isArray(h[key]) && !h[key].length),
  );
  if (
    product.category === "cpu" &&
    !positive(Math.max(h.tdpWatts || 0, h.maxPowerWatts || 0))
  )
    missing.push("tdpWatts");
  return missing;
}
export function assemblyIssues(components, quantities = {}) {
  const parts = Object.fromEntries(components.map((p) => [p.category, p])),
    h = (c) => parts[c]?.hardware || {},
    issues = [
      ...selectionIssues(components),
      ...buildResources(components, quantities).issues,
    ];
  const add = (code, message) => issues.push({ code, message });
  if (parts.mobo && parts.case) {
    if (!h("mobo").formFactor || !Array.isArray(h("case").formFactors))
      add("UNKNOWN_CASE", "Faltam dados dos formatos de placa-mãe e gabinete.");
    else if (
      !h("case").formFactors.some(
        (f) => normalized(f) === normalized(h("mobo").formFactor),
      )
    )
      add("CASE_FORMAT", "O gabinete não suporta o formato da placa-mãe.");
  }
  for (const [category, dimension, max, code, label] of [
    ["gpu", "lengthMm", "maxGpuLengthMm", "GPU_LENGTH", "placa de vídeo"],
    ["psu", "lengthMm", "maxPsuLengthMm", "PSU_LENGTH", "fonte"],
    ["cooler", "heightMm", "maxCoolerHeightMm", "COOLER_HEIGHT", "cooler"],
  ]) {
    if (
      !parts[category] ||
      !parts.case ||
      (category === "cooler" && h("cooler").coolingType === "liquid")
    )
      continue;
    if (!positive(h(category)[dimension]) || !positive(h("case")[max]))
      add(
        "UNKNOWN_" + code,
        `Faltam medidas para conferir ${label} e gabinete.`,
      );
    else if (h(category)[dimension] > h("case")[max])
      add(code, `A dimensão da ${label} excede o espaço do gabinete.`);
  }
  if (parts.cooler && parts.case && h("cooler").coolingType === "liquid") {
    if (
      !positive(h("cooler").radiatorSizeMm) ||
      !Array.isArray(h("case").radiatorSizes)
    )
      add(
        "UNKNOWN_RADIATOR",
        "Faltam as medidas de radiador e suporte do gabinete.",
      );
    else if (
      !h("case").radiatorSizes.map(Number).includes(h("cooler").radiatorSizeMm)
    )
      add(
        "RADIATOR_SIZE",
        "O gabinete não suporta o tamanho do radiador escolhido.",
      );
  }
  if (parts.gpu && parts.psu) {
    if (!h("gpu").powerConnector || !Array.isArray(h("psu").connectors))
      add(
        "UNKNOWN_CONNECTOR",
        "Faltam os conectores de alimentação da GPU e fonte.",
      );
    else if (!h("psu").connectors.includes(h("gpu").powerConnector))
      add("GPU_CONNECTOR", "A fonte não tem o conector da placa de vídeo.");
  }
  if (parts.storage && parts.mobo) {
    if (!h("storage").formFactor || !Array.isArray(h("mobo").storageFormats))
      add(
        "UNKNOWN_STORAGE",
        "Faltam os formatos do armazenamento e da placa-mãe.",
      );
    else if (!h("mobo").storageFormats.includes(h("storage").formFactor))
      add(
        "STORAGE_FORMAT",
        "A placa-mãe não declara suporte ao formato do armazenamento.",
      );
  }
  if (parts.cpu && parts.gpu) {
    const cpu = Math.max(h("cpu").tdpWatts || 0, h("cpu").maxPowerWatts || 0),
      gpu = h("gpu").referencePowerWatts;
    if (!positive(cpu) || !positive(gpu))
      add("UNKNOWN_POWER", "Faltam dados de energia do processador ou GPU.");
    else if (!positive(h("gpu").recommendedPsuWatts))
      add(
        "UNKNOWN_GPU_PSU_RECOMMENDATION",
        "Falta a recomendação de fonte do fabricante da GPU.",
      );
    else if (parts.psu) {
      const resources = buildResources(components, quantities),
        extra =
          Math.max(0, resources.storage.total - 1) * 10 +
          Math.max(0, (resources.ram.modules || 0) - (h("ram").modules || 0)) *
            3;
      const minimum = Math.max(
        Math.ceil((cpu + gpu + 50 + extra) * 1.25),
        h("gpu").recommendedPsuWatts,
      );
      if (!positive(h("psu").wattage))
        add("UNKNOWN_PSU", "Falta informar a potência da fonte.");
      else if (h("psu").wattage < minimum)
        add(
          "PSU_POWER",
          `Escolha uma fonte de pelo menos ${minimum} W para este conjunto.`,
        );
    }
  }
  return issues;
}
export function introducedIssues(before, after) {
  const existing = new Set(
    before.map((issue) => `${issue.code}:${issue.message}`),
  );
  return after.filter(
    (issue) => !existing.has(`${issue.code}:${issue.message}`),
  );
}
export function issuesForCategory(issues, category) {
  const dependencies = {
    SOCKET: ["cpu", "mobo"],
    CRITICAL_SOCKET: ["cpu", "mobo"],
    RAM_TYPE: ["mobo", "ram"],
    CRITICAL_RAM: ["mobo", "ram"],
    CPU_RAM_TYPE: ["cpu", "ram"],
    RAM_MODULES: ["ram"],
    RAM_FORM_FACTOR: ["ram", "mobo"],
    RAM_SLOTS: ["ram", "mobo"],
    RAM_CAPACITY: ["ram", "mobo"],
    CPU_RAM_CAPACITY: ["ram", "cpu"],
    M2_SLOTS: ["mobo", "storage"],
    SATA_PORTS: ["mobo", "storage"],
    STORAGE_INTERFACE: ["storage"],
    STORAGE_CONNECTIONS: ["cpu", "mobo", "storage"],
    STORAGE: ["mobo", "storage"],
    STORAGE_FORMAT: ["mobo", "storage"],
    CASE: ["mobo", "case"],
    CASE_FORMAT: ["mobo", "case"],
    GPU_LENGTH: ["gpu", "case"],
    PSU_LENGTH: ["psu", "case"],
    COOLER_HEIGHT: ["cooler", "case", "cpu"],
    COOLER: ["cooler", "cpu"],
    COOLER_SOCKET: ["cooler", "cpu"],
    RADIATOR: ["cooler", "case"],
    RADIATOR_SIZE: ["cooler", "case"],
    CONNECTOR: ["gpu", "psu"],
    GPU_CONNECTOR: ["gpu", "psu"],
    CPU_POWER_CONNECTOR: ["mobo", "psu"],
    POWER: ["cpu", "gpu"],
    GPU_PSU_RECOMMENDATION: ["gpu"],
    PSU: ["psu"],
    PSU_POWER: ["psu", "cpu", "gpu", "ram", "storage"],
  };
  return issues.filter((issue) =>
    dependencies[issue.code.replace(/^UNKNOWN_/, "")]?.includes(category),
  );
}
