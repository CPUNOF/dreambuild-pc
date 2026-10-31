// Dados estruturados conferidos nas fontes citadas nas fichas e nos documentos do catálogo.
export const hardwareFacts = {
  rtx4090: {
    lengthMm: 357.6,
    slots: 3.5,
    referencePowerWatts: 450,
    recommendedPsuWatts: 1000,
    powerConnector: "16pin",
    vramGb: 24,
  },
  ryzen: {
    socket: "AM5",
    ramType: "DDR5",
    tdpWatts: 120,
    coolerPackage: "not_included",
  },
  corsair: {
    ramType: "DDR5",
    capacityGb: 32,
    modules: 2,
    speedMts: 6000,
    profile: "Intel XMP",
  },
  samsung: {
    interface: "PCIe 4.0 x4 NVMe",
    formFactor: "M.2 2280",
    capacityGb: 1000,
  },
  "tuf-b650": {
    socket: "AM5",
    ramType: "DDR5",
    formFactor: "ATX",
    ramSlots: 4,
    maxRamGb: 256,
    sataPorts: 4,
    m2Slots: [
      {
        id: "M.2_1",
        protocols: ["nvme"],
        formats: ["M.2 2242", "M.2 2260", "M.2 2280"],
      },
      {
        id: "M.2_2",
        protocols: ["nvme"],
        formats: ["M.2 2242", "M.2 2260", "M.2 2280", "M.2 22110"],
      },
      {
        id: "M.2_3",
        protocols: ["nvme"],
        formats: ["M.2 2242", "M.2 2260", "M.2 2280"],
      },
    ],
    storageFormats: [
      "M.2 2242",
      "M.2 2260",
      "M.2 2280",
      "M.2 22110",
      "2.5 inch",
      "3.5 inch",
    ],
  },
  rm1000e: {
    wattage: 1000,
    lengthMm: 140,
    connectors: ["16pin", "eps8", "pcie8"],
  },
  "5000d": {
    formFactors: ["ATX", "microATX", "miniITX"],
    maxGpuLengthMm: 420,
    maxCoolerHeightMm: 170,
    maxPsuLengthMm: 250,
  },
  "nh-u12a": {
    supportedSockets: ["AM5", "AM4", "LGA1700", "LGA1851", "LGA1200"],
    heightMm: 158,
  },
};
