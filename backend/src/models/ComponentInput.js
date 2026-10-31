import { AppError } from "../errors/AppError.js";
import { Component } from "./Component.js";
import { Offer } from "./Offer.js";
const categories = [
  "cpu",
  "gpu",
  "mobo",
  "ram",
  "storage",
  "psu",
  "case",
  "cooler",
];
const textFields = [
  "slug",
  "category",
  "categoryName",
  "brand",
  "name",
  "fullName",
  "model",
  "image",
  "description",
  "compatibilityNote",
  "manufacturerUrl",
  "technicalSource",
  "sourceLabel",
  "checkedAt",
];
const hardwareFields = [
  "coolerPackage",
  "boxedCoolerName",
  "socket",
  "ramType",
  "formFactor",
  "interface",
  "profile",
  "powerConnector",
  "coolingType",
];
const numberFields = [
  "sataPorts",
  "boxedCoolerHeightMm",
  "tdpWatts",
  "maxPowerWatts",
  "radiatorSizeMm",
  "referencePowerWatts",
  "recommendedPsuWatts",
  "lengthMm",
  "heightMm",
  "slots",
  "ramSlots",
  "maxRamGb",
  "capacityGb",
  "modules",
  "speedMts",
  "wattage",
  "maxGpuLengthMm",
  "maxCoolerHeightMm",
  "maxPsuLengthMm",
  "vramGb",
];
const arrayFields = [
  "supportedSockets",
  "formFactors",
  "connectors",
  "storageFormats",
  "radiatorSizes",
];

export function parseComponent(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new AppError(400, "Informe os dados do componente.");
  const document = {};
  if (input.model3d === null) document.model3d = null;
  else if (input.model3d !== undefined) {
    const model = input.model3d;
    if (
      !model ||
      typeof model !== "object" ||
      !/^\/models\/[a-z0-9-]+\.glb$/.test(model.url) ||
      typeof model.caption !== "string" ||
      model.caption.length < 20 ||
      model.caption.length > 600 ||
      typeof model.hasRgb !== "boolean"
    )
      throw new AppError(400, "Dados do modelo 3D inválidos.");
    document.model3d = {
      url: model.url,
      caption: model.caption,
      hasRgb: model.hasRgb,
    };
  }
  for (const field of textFields) {
    if (input[field] === undefined) continue;
    if (
      typeof input[field] !== "string" ||
      input[field].length >
        (["description", "compatibilityNote"].includes(field) ? 3000 : 2000)
    )
      throw new AppError(400, `Campo inválido: ${field}.`);
    document[field] = input[field].trim();
  }
  if (
    !categories.includes(document.category) ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(document.slug || "") ||
    document.slug.length > 100
  )
    throw new AppError(400, "Categoria ou endereço do produto inválido.");
  const safeImage = (url) =>
    typeof url === "string" &&
    url.length <= 2000 &&
    ((/^\/hardware\/[a-zA-Z0-9_./-]+$/.test(url) && !url.includes("..")) ||
      /^https:\/\/[^\s]+$/.test(url));
  if (
    !safeImage(document.image) ||
    !/^https:\/\/[^\s]+$/.test(document.manufacturerUrl || "") ||
    (document.technicalSource &&
      !/^https:\/\/[^\s]+$/.test(document.technicalSource))
  )
    throw new AppError(
      400,
      "Informe uma imagem válida e uma fonte HTTPS do fabricante.",
    );
  if (
    !Array.isArray(input.gallery) ||
    input.gallery.length < 1 ||
    input.gallery.length > 12 ||
    input.gallery.some(
      (image) =>
        !image ||
        !safeImage(image.src) ||
        typeof image.alt !== "string" ||
        image.alt.length > 300,
    )
  )
    throw new AppError(
      400,
      "Informe entre uma e doze imagens válidas, com descrição.",
    );
  document.gallery = input.gallery.map((image) => ({
    src: image.src,
    alt: image.alt,
  }));
  if (
    !Array.isArray(input.highlights) ||
    input.highlights.length > 8 ||
    input.highlights.some(
      (value) => typeof value !== "string" || value.length > 200,
    )
  )
    throw new AppError(400, "Destaques inválidos.");
  document.highlights = input.highlights;
  if (
    !Array.isArray(input.specifications) ||
    input.specifications.length < 1 ||
    input.specifications.length > 50 ||
    input.specifications.some(
      (row) =>
        !Array.isArray(row) ||
        row.length !== 2 ||
        row.some(
          (value) =>
            typeof value !== "string" || !value.trim() || value.length > 1000,
        ),
    )
  )
    throw new AppError(
      400,
      "Informe as características em pares de nome e valor.",
    );
  document.specifications = input.specifications.map(([label, value]) => ({
    label: label.trim(),
    value: value.trim(),
  }));
  document.offers = Offer.parseMany(input.offers);
  document.hardware = {};
  const hardware = input.hardware || {};
  if (typeof hardware !== "object" || Array.isArray(hardware))
    throw new AppError(400, "Dados técnicos inválidos.");
  for (const field of hardwareFields)
    if (hardware[field] !== undefined) {
      if (typeof hardware[field] !== "string" || hardware[field].length > 100)
        throw new AppError(400, `Dado técnico inválido: ${field}.`);
      document.hardware[field] = hardware[field].trim();
    }
  for (const field of numberFields)
    if (hardware[field] !== undefined) {
      if (
        typeof hardware[field] !== "number" ||
        !Number.isFinite(hardware[field]) ||
        hardware[field] < 0 ||
        hardware[field] > 100000
      )
        throw new AppError(400, `Valor técnico inválido: ${field}.`);
      document.hardware[field] = hardware[field];
    }
  for (const field of ["ramSlots", "modules", "sataPorts"])
    if (
      hardware[field] !== undefined &&
      (!Number.isInteger(hardware[field]) ||
        hardware[field] < (field === "sataPorts" ? 0 : 1) ||
        hardware[field] > 16)
    )
      throw new AppError(400, `Quantidade técnica inválida: ${field}.`);
  for (const field of arrayFields)
    if (hardware[field] !== undefined) {
      if (
        !Array.isArray(hardware[field]) ||
        hardware[field].length > 30 ||
        hardware[field].some(
          (value) => typeof value !== "string" || value.length > 100,
        )
      )
        throw new AppError(400, `Lista técnica inválida: ${field}.`);
      document.hardware[field] = hardware[field];
    }
  if (
    hardware.coolerPackage !== undefined &&
    !["included", "not_included", "unknown"].includes(hardware.coolerPackage)
  )
    throw new AppError(400, "Estado do cooler da CPU inválido.");
  if (hardware.m2Slots !== undefined) {
    const slots = hardware.m2Slots;
    if (
      !Array.isArray(slots) ||
      slots.length > 8 ||
      new Set(slots.map((s) => s?.id)).size !== slots.length
    )
      throw new AppError(400, "Mapa de M.2 inválido.");
    document.hardware.m2Slots = slots.map((s) => {
      if (
        !s ||
        typeof s.id !== "string" ||
        !/^[A-Za-z0-9_. -]{1,30}$/.test(s.id) ||
        !Array.isArray(s.protocols) ||
        !s.protocols.length ||
        s.protocols.some((p) => !["nvme", "sata"].includes(p)) ||
        !Array.isArray(s.formats) ||
        !s.formats.length ||
        s.formats.length > 8 ||
        s.formats.some((f) => !/^M\.2 (2230|2242|2260|2280|22110)$/.test(f)) ||
        (s.disabledSataPorts !== undefined &&
          (!Array.isArray(s.disabledSataPorts) ||
            s.disabledSataPorts.length > 16 ||
            s.disabledSataPorts.some(
              (n) => !Number.isInteger(n) || n < 1 || n > 16,
            ))) ||
        (s.disabledSataWhen !== undefined &&
          !["any", "sata"].includes(s.disabledSataWhen)) ||
        (s.excludedCpuModels !== undefined &&
          (!Array.isArray(s.excludedCpuModels) ||
            s.excludedCpuModels.length > 20 ||
            s.excludedCpuModels.some(
              (m) => typeof m !== "string" || m.length < 4 || m.length > 60,
            )))
      )
        throw new AppError(400, "Slot M.2 inválido.");
      return {
        id: s.id,
        protocols: s.protocols,
        formats: s.formats,
        disabledSataPorts: s.disabledSataPorts || [],
        disabledSataWhen: s.disabledSataWhen || "any",
        excludedCpuModels: s.excludedCpuModels || [],
      };
    });
  }
  if (hardware.sataPortIds !== undefined) {
    if (
      !Array.isArray(hardware.sataPortIds) ||
      hardware.sataPortIds.length !== hardware.sataPorts ||
      new Set(hardware.sataPortIds).size !== hardware.sataPortIds.length ||
      hardware.sataPortIds.some((n) => !Number.isInteger(n) || n < 1 || n > 16)
    )
      throw new AppError(400, "Identificadores SATA inválidos.");
    document.hardware.sataPortIds = hardware.sataPortIds;
  }
  if (input.displayOrder !== undefined) {
    if (
      !Number.isInteger(input.displayOrder) ||
      input.displayOrder < 0 ||
      input.displayOrder > 100000
    )
      throw new AppError(400, "Ordem de exibição inválida.");
    document.displayOrder = input.displayOrder;
  }
  if (input.simulationScore === null) document.simulationScore = null;
  else if (input.simulationScore !== undefined) {
    if (
      !Number.isFinite(input.simulationScore) ||
      input.simulationScore < 1 ||
      input.simulationScore > 100
    )
      throw new AppError(400, "O índice didático precisa ficar entre 1 e 100.");
    document.simulationScore = input.simulationScore;
  }
  try {
    new Component("validacao", document);
  } catch {
    throw new AppError(400, "Complete os campos obrigatórios do produto.");
  }
  return document;
}
