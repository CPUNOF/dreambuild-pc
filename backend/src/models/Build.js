import { AppError } from "../errors/AppError.js";
import { Comparison } from "./Comparison.js";
import { selectionIssues } from "../../../shared/selectionCompatibility.js";
import {
  normalizeBuildOptions,
  buildComponentIds,
  buildResources,
  includedCooling,
} from "../../../shared/buildResources.js";
export const categories = [
  "cpu",
  "mobo",
  "ram",
  "gpu",
  "storage",
  "psu",
  "case",
  "cooler",
];
export const categoryLabels = {
  cpu: "Processador",
  mobo: "Placa-mãe",
  ram: "Memória RAM",
  gpu: "Placa de vídeo",
  storage: "Armazenamento",
  psu: "Fonte",
  case: "Gabinete",
  cooler: "Cooler",
};
const number = (value) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

export class Build {
  static configuration(input) {
    const partIds = this.selection(input?.partIds);
    try {
      return { partIds, ...normalizeBuildOptions(partIds, input) };
    } catch (error) {
      throw new AppError(400, error.message);
    }
  }
  static componentIds(input) {
    return buildComponentIds(input.partIds, input);
  }
  static selection(input) {
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new AppError(400, "Informe as peças da montagem.");
    const result = {};
    for (const [category, id] of Object.entries(input)) {
      if (!categories.includes(category))
        throw new AppError(400, "Categoria de montagem inválida.");
      if (id === "" || id === null) continue;
      if (typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(id))
        throw new AppError(400, "Identificador de peça inválido.");
      result[category] = id;
    }
    return result;
  }
  static analyze(partIds, components, paymentMethod = "pix", options = {}) {
    if (!["pix", "cash", "card"].includes(paymentMethod))
      throw new AppError(400, "Forma de pagamento inválida.");
    const parts = {};
    let normalized;
    try {
      normalized = normalizeBuildOptions(partIds, options);
    } catch (error) {
      throw new AppError(400, error.message);
    }
    const { quantities, storageIds } = normalized;
    const notes = [];
    for (const [category, id] of Object.entries(partIds)) {
      const component = components.find((part) => part?.id === id);
      if (!component)
        throw new AppError(
          400,
          `Uma peça de ${categoryLabels[category]} não está mais disponível no catálogo.`,
        );
      if (component.category !== category)
        throw new AppError(400, "Uma peça foi enviada na categoria errada.");
      parts[category] = component;
    }
    const extraStorage = storageIds.map((id) => {
      const part = components.find((p) => p?.id === id);
      if (!part || part.category !== "storage")
        throw new AppError(
          400,
          "Armazenamento adicional ausente ou na categoria errada.",
        );
      return part;
    });
    const allParts = [...Object.values(parts), ...extraStorage];
    const resources = buildResources(allParts, quantities);
    const missingCategories = categories.filter(
      (category) =>
        !parts[category] &&
        !(category === "cooler" && includedCooling(parts.cpu)),
    );
    const add = (level, code, message) => notes.push({ level, code, message });
    const h = (category) => parts[category]?.hardware || {};
    if (parts.cpu && !parts.cooler) {
      if (includedCooling(parts.cpu)) {
        add(
          "warning",
          "BOXED_COOLER",
          `Usando ${h("cpu").boxedCoolerName} incluído na versão da CPU. Confira montagem, altura e ventilação do gabinete; não há cooler extra no preço.`,
        );
        if (
          number(h("cpu").boxedCoolerHeightMm) &&
          number(h("case").maxCoolerHeightMm) &&
          h("cpu").boxedCoolerHeightMm > h("case").maxCoolerHeightMm
        )
          add(
            "error",
            "COOLER_HEIGHT",
            "O cooler incluído na CPU excede a altura suportada pelo gabinete.",
          );
      } else
        add(
          "warning",
          "COOLER_REQUIRED",
          h("cpu").coolerPackage === "not_included"
            ? "Esta versão da CPU não inclui cooler. Escolha um cooler compatível."
            : "A presença de cooler nesta versão da CPU não foi confirmada. Escolha um cooler compatível ou confira a ficha.",
        );
    }
    const requireEqual = (left, right, code, message) => {
      if (!left || !right)
        add(
          "error",
          "UNKNOWN_" + code,
          "Faltam dados técnicos para verificar: " + message,
        );
      else if (
        String(left).toUpperCase().replace(/[\s-]/g, "") !==
        String(right).toUpperCase().replace(/[\s-]/g, "")
      )
        add("error", code, message);
    };
    if (parts.cpu && parts.mobo) {
      requireEqual(
        h("cpu").socket,
        h("mobo").socket,
        "SOCKET",
        "O socket do processador difere do socket da placa-mãe.",
      );
      add(
        "warning",
        "BIOS",
        "Confira a lista de CPUs e a versão de BIOS da placa-mãe; o socket sozinho não garante suporte.",
      );
    }
    if (parts.ram && parts.mobo) {
      requireEqual(
        h("ram").ramType,
        h("mobo").ramType,
        "RAM_TYPE",
        "O padrão da memória difere do suportado pela placa-mãe.",
      );
      if (
        number(h("ram").modules) &&
        number(h("mobo").ramSlots) &&
        h("ram").modules > h("mobo").ramSlots
      )
        add(
          "error",
          "RAM_SLOTS",
          "O kit tem mais módulos que os slots de memória disponíveis.",
        );
      if (
        number(h("ram").capacityGb) &&
        number(h("mobo").maxRamGb) &&
        h("ram").capacityGb > h("mobo").maxRamGb
      )
        add(
          "error",
          "RAM_CAPACITY",
          "A capacidade de memória excede o limite cadastrado da placa-mãe.",
        );
      if (h("ram").profile)
        add(
          "warning",
          "MEMORY_PROFILE",
          "Perfis XMP/EXPO e a velocidade anunciada dependem de BIOS, controlador e validação do kit; não são garantidos pelo padrão DDR.",
        );
    }
    if (parts.cpu && parts.cooler) {
      if (!h("cpu").socket || !Array.isArray(h("cooler").supportedSockets))
        add(
          "error",
          "UNKNOWN_COOLER",
          "Faltam dados de socket do processador ou cooler.",
        );
      else if (
        !h("cooler").supportedSockets.some(
          (s) =>
            s.toUpperCase().replace(/[\s-]/g, "") ===
            h("cpu").socket.toUpperCase().replace(/[\s-]/g, ""),
        )
      )
        add(
          "error",
          "COOLER_SOCKET",
          "O cooler não possui suporte cadastrado ao socket do processador.",
        );
    }
    if (parts.mobo && parts.case) {
      if (!h("mobo").formFactor || !Array.isArray(h("case").formFactors))
        add(
          "error",
          "UNKNOWN_CASE",
          "Faltam dados dos formatos de placa-mãe e gabinete.",
        );
      else if (
        !h("case").formFactors.some(
          (format) =>
            format.toLowerCase().replace(/[^a-z]/g, "") ===
            h("mobo")
              .formFactor.toLowerCase()
              .replace(/[^a-z]/g, ""),
        )
      )
        add(
          "error",
          "CASE_FORMAT",
          "O gabinete não suporta o formato cadastrado da placa-mãe.",
        );
    }
    for (const [category, dimension, maximum, code, label] of [
      [
        "gpu",
        "lengthMm",
        "maxGpuLengthMm",
        "GPU_LENGTH",
        "O comprimento da GPU excede o limite cadastrado do gabinete.",
      ],
      [
        "cooler",
        "heightMm",
        "maxCoolerHeightMm",
        "COOLER_HEIGHT",
        "A altura do cooler excede o limite cadastrado do gabinete.",
      ],
      [
        "psu",
        "lengthMm",
        "maxPsuLengthMm",
        "PSU_LENGTH",
        "O comprimento da fonte excede o limite cadastrado do gabinete.",
      ],
    ]) {
      if (category === "cooler" && h("cooler").coolingType === "liquid")
        continue;
      if (parts[category] && parts.case) {
        if (!number(h(category)[dimension]) || !number(h("case")[maximum]))
          add(
            "error",
            "UNKNOWN_" + code,
            "Faltam medidas para verificar: " + label,
          );
        else if (h(category)[dimension] > h("case")[maximum])
          add("error", code, label);
      }
    }
    if (parts.cooler && parts.case && h("cooler").coolingType === "liquid") {
      if (
        !number(h("cooler").radiatorSizeMm) ||
        !Array.isArray(h("case").radiatorSizes)
      )
        add(
          "error",
          "UNKNOWN_RADIATOR",
          "Faltam tamanho do radiador ou posições suportadas pelo gabinete para verificar o water cooler.",
        );
      else if (
        !h("case").radiatorSizes.includes(String(h("cooler").radiatorSizeMm))
      )
        add(
          "error",
          "RADIATOR_SIZE",
          "O gabinete não tem suporte cadastrado para o tamanho de radiador escolhido.",
        );
      add(
        "warning",
        "RADIATOR_CLEARANCE",
        "Confirme posição, espessura do radiador com ventoinhas e interferências com GPU, RAM e placa-mãe no manual do gabinete.",
      );
    }
    if (parts.storage && parts.mobo) {
      if (!h("storage").formFactor || !Array.isArray(h("mobo").storageFormats))
        add(
          "error",
          "UNKNOWN_STORAGE",
          "Faltam dados de formato do armazenamento ou da placa-mãe.",
        );
      else if (!h("mobo").storageFormats.includes(h("storage").formFactor))
        add(
          "error",
          "STORAGE_FORMAT",
          "O formato do SSD não consta nos formatos suportados pela placa-mãe.",
        );
    }
    if (parts.gpu && parts.psu) {
      if (!h("gpu").powerConnector || !Array.isArray(h("psu").connectors))
        add(
          "error",
          "UNKNOWN_CONNECTOR",
          "Faltam dados do conector de energia da GPU ou da fonte.",
        );
      else if (!h("psu").connectors.includes(h("gpu").powerConnector))
        add(
          "error",
          "GPU_CONNECTOR",
          "A fonte não possui o conector cadastrado para a GPU.",
        );
    }
    let totalWatts = null,
      powerWithMarginWatts = null,
      recommendedPsuWatts = null;
    if (parts.cpu && parts.gpu) {
      const cpuPower = Math.max(
        h("cpu").tdpWatts || 0,
        h("cpu").maxPowerWatts || 0,
      );
      if (
        cpuPower > 0 &&
        number(h("gpu").referencePowerWatts) &&
        h("gpu").referencePowerWatts > 0
      ) {
        totalWatts =
          cpuPower +
          h("gpu").referencePowerWatts +
          50 +
          Math.max(0, resources.storage.total - 1) * 10 +
          Math.max(0, (resources.ram.modules || 0) - (h("ram").modules || 0)) *
            3;
        powerWithMarginWatts = Math.ceil(totalWatts * 1.25);
        recommendedPsuWatts =
          number(h("gpu").recommendedPsuWatts) &&
          h("gpu").recommendedPsuWatts > 0
            ? Math.max(
                powerWithMarginWatts,
                number(h("gpu").recommendedPsuWatts)
                  ? h("gpu").recommendedPsuWatts
                  : 0,
              )
            : null;
        if (recommendedPsuWatts === null)
          add(
            "error",
            "UNKNOWN_GPU_PSU_RECOMMENDATION",
            "Falta a recomendação de fonte do fabricante desta GPU. O subtotal estimado não é uma recomendação de compra.",
          );
        if (!h("cpu").maxPowerWatts)
          add(
            "warning",
            "CPU_POWER_REFERENCE",
            "A referência da CPU usa o TDP publicado. Confira limites máximos, turbo/PBO e overclock antes de dimensionar a instalação.",
          );
        if (parts.psu) {
          if (!number(h("psu").wattage) || h("psu").wattage <= 0)
            add(
              "error",
              "UNKNOWN_PSU",
              "A potência da fonte não foi informada.",
            );
          else if (
            recommendedPsuWatts !== null &&
            h("psu").wattage < recommendedPsuWatts
          )
            add(
              "error",
              "PSU_POWER",
              `A fonte tem ${h("psu").wattage} W; a recomendação desta análise é ${recommendedPsuWatts} W.`,
            );
        }
      } else
        add(
          "error",
          "UNKNOWN_POWER",
          "Faltam valores de referência de energia da CPU ou GPU; não é possível dimensionar a fonte.",
        );
    }
    if (parts.psu && parts.mobo) {
      if (
        h("mobo").powerConnector &&
        Array.isArray(h("psu").connectors) &&
        !h("psu").connectors.includes(h("mobo").powerConnector)
      )
        add(
          "error",
          "CPU_POWER_CONNECTOR",
          "A fonte não possui o conector de alimentação de CPU cadastrado para a placa-mãe.",
        );
      add(
        "warning",
        "PSU_CABLING",
        "Confira ATX 24 pinos, quantidade de conectores EPS/PCIe, cabos independentes, padrão e comprimento da fonte. Não misture cabos modulares de fontes diferentes; potência nominal sozinha não garante compatibilidade.",
      );
    }
    if (parts.gpu && parts.case)
      add(
        "warning",
        "CABLE_SPACE",
        "Confira a folga do cabo de energia da GPU, radiadores e ventilação. O limite de comprimento do gabinete não verifica essas interferências.",
      );
    if (parts.cooler)
      add(
        "warning",
        "THERMAL",
        "A análise não mede temperaturas nem garante capacidade térmica; confira o suporte do fabricante e a instalação.",
      );
    const complete = missingCategories.length === 0;
    for (const issue of resources.issues)
      if (!notes.some((n) => n.code === issue.code))
        add("error", issue.code, issue.message);
    for (const message of resources.warnings)
      add("warning", "RESOURCE_INSTALLATION", message);
    for (const issue of selectionIssues(Object.values(parts)))
      if (!notes.some((note) => note.code === issue.code))
        add("error", issue.code, issue.message);
    return {
      partIds,
      quantities,
      storageIds,
      resources,
      parts: allParts,
      itemCount: allParts.reduce((sum, p) => sum + (quantities[p.id] ?? 1), 0),
      complete,
      compatible: complete && !notes.some((note) => note.level === "error"),
      missingCategories,
      notes,
      totalWatts,
      powerWithMarginWatts,
      recommendedPsuWatts,
      auxiliaryReserveWatts:
        50 +
        Math.max(0, resources.storage.total - 1) * 10 +
        Math.max(0, (resources.ram.modules || 0) - (h("ram").modules || 0)) * 3,
      comparison: Comparison.calculate(allParts, paymentMethod, quantities),
    };
  }
  static snapshot(analysis) {
    const { parts, ...summary } = analysis;
    return {
      ...summary,
      partsSnapshot: parts.map((part) => ({
        ...part,
        specifications: part.specifications.map(([label, value]) => ({
          label,
          value,
        })),
      })),
    };
  }
}
