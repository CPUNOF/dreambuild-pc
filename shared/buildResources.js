const positive = (v) => Number.isInteger(v) && v > 0;
const clean = (v) =>
  typeof v === "string" ? v.toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
export function normalizeBuildOptions(partIds, input = {}) {
  const storageIds = input.storageIds ?? [],
    quantities = input.quantities ?? {};
  if (
    !Array.isArray(storageIds) ||
    storageIds.length > 15 ||
    storageIds.some(
      (id) => typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(id),
    ) ||
    new Set(storageIds).size !== storageIds.length ||
    storageIds.includes(partIds.storage)
  )
    throw Error("Lista de armazenamento inválida ou duplicada.");
  if (storageIds.length && !partIds.storage)
    throw Error(
      "Escolha o primeiro armazenamento antes de adicionar outros modelos.",
    );
  if (
    !quantities ||
    typeof quantities !== "object" ||
    Array.isArray(quantities) ||
    Object.keys(quantities).length > 17
  )
    throw Error("Quantidades inválidas.");
  const allowed = new Set(
      [partIds.ram, partIds.storage, ...storageIds].filter(Boolean),
    ),
    result = {};
  for (const [id, n] of Object.entries(quantities)) {
    if (!allowed.has(id) || !positive(n) || n > 16)
      throw Error(
        "Use quantidades inteiras de 1 a 16 apenas para RAM e armazenamento selecionados.",
      );
    result[id] = n;
  }
  if (
    [partIds.storage, ...storageIds]
      .filter(Boolean)
      .reduce((sum, id) => sum + (result[id] ?? 1), 0) > 16
  )
    throw Error("A bancada aceita até 16 unidades de armazenamento.");
  return { storageIds: [...storageIds], quantities: result };
}
export function buildComponentIds(partIds, options = {}) {
  return [
    ...new Set([
      ...Object.values(partIds).filter(Boolean),
      ...(options.storageIds || []),
    ]),
  ];
}
export function includedCooling(cpu) {
  return (
    cpu?.hardware?.coolerPackage === "included" &&
    Boolean(cpu.hardware.boxedCoolerName)
  );
}
export function storageKind(part) {
  const h = part.hardware || {},
    form = clean(h.formFactor),
    text = clean(h.interface);
  if (/USB|EXTERNAL/.test(text)) return "external";
  if (form.startsWith("M2"))
    return /NVME|PCIE/.test(text)
      ? "nvme"
      : /SATA/.test(text)
        ? "m2sata"
        : "unknown";
  if (/SATA/.test(text) && /25|35/.test(form)) return "sata";
  return "unknown";
}
export function buildResources(components, quantities = {}) {
  const board = components.find((p) => p.category === "mobo"),
    ram = components.find((p) => p.category === "ram"),
    cpu = components.find((p) => p.category === "cpu"),
    b = board?.hardware || {},
    issues = [],
    warnings = [];
  const add = (code, message) => issues.push({ code, message }),
    q = (p) => quantities[p.id] ?? 1;
  const ramKits = ram ? q(ram) : 0,
    ramModules =
      ram && positive(ram.hardware?.modules)
        ? ram.hardware.modules * ramKits
        : null,
    ramGb =
      ram && positive(ram.hardware?.capacityGb)
        ? ram.hardware.capacityGb * ramKits
        : null;
  if (ram) {
    if (ramModules === null)
      add(
        "UNKNOWN_RAM_MODULES",
        "Falta a quantidade de módulos deste kit de RAM. Não é possível contar os slots.",
      );
    if (
      /SO[ -]?DIMM/i.test(
        `${ram.name} ${ram.fullName} ${ram.hardware?.formFactor}`,
      )
    )
      add(
        "RAM_FORM_FACTOR",
        "Esta memória SO-DIMM de notebook não cabe nos slots DIMM de uma placa-mãe desktop.",
      );
  }
  if (board && ram) {
    if (!positive(b.ramSlots))
      add(
        "UNKNOWN_RAM_SLOTS",
        "A quantidade de slots de RAM desta placa-mãe ainda não foi confirmada.",
      );
    else if (ramModules > b.ramSlots)
      add(
        "RAM_SLOTS",
        `${ramKits} kit(s) ocupam ${ramModules} módulos; a placa-mãe tem ${b.ramSlots} slots de RAM.`,
      );
    if (!positive(b.maxRamGb) || ramGb === null)
      add(
        "UNKNOWN_RAM_CAPACITY",
        "Faltam limites/capacidades de RAM para validar o total.",
      );
    else if (ramGb > b.maxRamGb)
      add(
        "RAM_CAPACITY",
        `${ramGb} GB excedem os ${b.maxRamGb} GB suportados pela placa-mãe.`,
      );
    if (positive(cpu?.hardware?.maxRamGb) && ramGb > cpu.hardware.maxRamGb)
      add(
        "CPU_RAM_CAPACITY",
        "A RAM total excede o limite cadastrado do processador.",
      );
  }
  if (ramKits > 1)
    warnings.push(
      "Kits separados, mesmo do mesmo modelo, não têm operação conjunta/XMP/EXPO garantida. Confira QVL, BIOS e velocidade com todos os slots ocupados.",
    );
  const devices = [];
  for (const p of components.filter((p) => p.category === "storage")) {
    const kind = storageKind(p);
    if (["unknown", "external"].includes(kind))
      add(
        "UNKNOWN_STORAGE_INTERFACE",
        kind === "external"
          ? `${p.name} é externo USB; não ocupa uma conexão interna da bancada.`
          : `Faltam formato e protocolo do armazenamento ${p.name}.`,
      );
    for (let unit = 1; unit <= q(p); unit++)
      devices.push({
        componentId: p.id,
        name: p.name,
        unit,
        kind,
        format: clean(p.hardware?.formFactor),
      });
  }
  const slots = Array.isArray(b.m2Slots) ? b.m2Slots : [],
    m2 = devices.filter((d) => ["nvme", "m2sata"].includes(d.kind)),
    sata = devices.filter((d) => d.kind === "sata");
  let assignments = [],
    disabledSata = [];
  if (board && devices.length) {
    if (m2.length && !Array.isArray(b.m2Slots))
      add(
        "UNKNOWN_M2_SLOTS",
        "O mapa dos slots M.2 desta placa-mãe ainda não foi confirmado; M.2 não significa necessariamente NVMe.",
      );
    if (!Number.isInteger(b.sataPorts) || b.sataPorts < 0)
      add(
        "UNKNOWN_SATA_PORTS",
        "Falta confirmar a quantidade de portas SATA desta placa-mãe.",
      );
    const eligible = slots.filter(
      (s) =>
        !s.excludedCpuModels?.some((model) =>
          clean(`${cpu?.name} ${cpu?.model}`).includes(clean(model)),
        ),
    );
    function place(index, used, chosen, disabled) {
      if (m2.length > eligible.length) return false;
      if (index === m2.length) {
        if (sata.length > Math.max(0, (b.sataPorts ?? 0) - disabled.size))
          return false;
        assignments = chosen;
        disabledSata = [...disabled];
        return true;
      }
      const d = m2[index];
      for (const s of eligible) {
        if (
          used.has(s.id) ||
          !s.protocols.includes(d.kind === "nvme" ? "nvme" : "sata") ||
          !s.formats.some((f) => clean(f) === d.format)
        )
          continue;
        const block =
            s.disabledSataWhen === "sata" && d.kind !== "m2sata"
              ? []
              : s.disabledSataPorts || [],
          nextDisabled = new Set([...disabled, ...block]);
        if (
          place(
            index + 1,
            new Set([...used, s.id]),
            [...chosen, { ...d, connection: s.id }],
            nextDisabled,
          )
        )
          return true;
      }
      return false;
    }
    if (
      !issues.some((i) =>
        ["UNKNOWN_M2_SLOTS", "UNKNOWN_SATA_PORTS"].includes(i.code),
      ) &&
      !place(0, new Set(), [], new Set())
    )
      add(
        "STORAGE_CONNECTIONS",
        "Não há uma distribuição válida dos SSDs nos slots M.2 e portas SATA disponíveis. Confira protocolo, formato, quantidade e portas compartilhadas.",
      );
    const freePorts = (
      b.sataPortIds || Array.from({ length: b.sataPorts || 0 }, (_, i) => i + 1)
    ).filter((n) => !disabledSata.includes(n));
    assignments.push(
      ...sata.map((d, i) => ({
        ...d,
        connection: `SATA ${freePorts[i] ?? "—"}`,
      })),
    );
    if (sata.length)
      warnings.push(
        "Unidades SATA também precisam de cabo de dados, alimentação SATA da fonte e baia compatível no gabinete; confirme cabos e acessórios.",
      );
  }
  return {
    issues,
    warnings,
    ram: {
      kits: ramKits,
      modules: ramModules,
      capacityGb: ramGb,
      slots: positive(b.ramSlots) ? b.ramSlots : null,
      maxGb: positive(b.maxRamGb) ? b.maxRamGb : null,
    },
    storage: {
      total: devices.length,
      nvme: devices.filter((d) => d.kind === "nvme").length,
      m2Sata: devices.filter((d) => d.kind === "m2sata").length,
      sata: sata.length,
      m2Slots: Array.isArray(b.m2Slots) ? slots.length : null,
      sataPorts: Number.isInteger(b.sataPorts) ? b.sataPorts : null,
      disabledSataPorts: disabledSata,
      assignments,
    },
    cooling: {
      included: includedCooling(cpu),
      name: includedCooling(cpu) ? cpu.hardware.boxedCoolerName : null,
    },
  };
}
