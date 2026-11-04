const verified = {
  "kabum-1003731": {
    hardware: {
      wattage: 1000,
      lengthMm: 150,
      connectors: ["atx24", "eps8", "16pin", "pcie8", "sata"],
    },
    source: "https://www.msi.com/Power-Supply/MAG-A1000PLS-PCIE5/Specification",
  },
  "kabum-1000741": {
    hardware: {
      referencePowerWatts: 145,
      recommendedPsuWatts: 550,
      powerConnector: "pcie8",
      lengthMm: 197,
    },
    source:
      "https://www.msi.com/Graphics-Card/GeForce-RTX-5060-8G-SHADOW-2X-OC/Specification",
  },
  "kabum-369658": {
    hardware: {
      wattage: 650,
      lengthMm: 140,
      connectors: ["atx24", "eps8", "pcie8", "sata"],
    },
    source: "https://www.msi.com/Power-Supply/MAG-A650BN/Specification",
  },
  "kabum-283713": {
    hardware: {
      socket: "LGA1700",
      tdpWatts: 65,
      maxPowerWatts: 117,
      maxRamGb: 128,
    },
    source:
      "https://www.intel.com/content/www/us/en/products/sku/134586/intel-core-i512400-processor-18m-cache-up-to-4-40-ghz/specifications.html",
  },
};
export function withVerifiedHardware(product) {
  const record = verified[product.id];
  if (!record) return product;
  return {
    ...product,
    hardware: { ...product.hardware, ...record.hardware },
    technicalSource: record.source,
    hardwareVerifiedAt: "2026-11-03",
  };
}
