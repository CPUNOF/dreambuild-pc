export function platformOf(product) {
  const text = `${product.name} ${product.fullName} ${product.hardware?.socket || ""}`;
  if (product.category === "cpu")
    return /intel/i.test(text + product.brand)
      ? "Intel"
      : /amd|ryzen/i.test(text + product.brand)
        ? "AMD"
        : "Não identificado";
  if (product.category === "mobo")
    return /\bAM[345]\b|\bAMD\b/i.test(text)
      ? "AMD"
      : /LGA|\bIntel\b/i.test(text)
        ? "Intel"
        : "Não identificado";
  if (product.category === "gpu")
    return /geforce|nvidia|\bRTX|\bGTX/i.test(text)
      ? "NVIDIA"
      : /radeon/i.test(text)
        ? "AMD"
        : /\barc\b|\bintel\b/i.test(text)
          ? "Intel"
          : "Não identificado";
  if (product.category === "cooler")
    return /water|liquid|aio/i.test(text) ? "Water cooler" : "Air cooler";
  if (product.category === "ram")
    return (
      product.hardware?.ramType ||
      text.match(/DDR[45]/i)?.[0]?.toUpperCase() ||
      "Não identificado"
    );
  return product.brand;
}
export function psuFit(product, analysis, parts) {
  const watts = analysis?.recommendedPsuWatts,
    gpu = parts.find((p) => p.category === "gpu"),
    h = product.hardware || {};
  if (!(watts > 0))
    return {
      status: "unknown",
      label: "Selecione CPU e GPU com dados de energia verificados",
    };
  if (!(h.wattage > 0))
    return { status: "unknown", label: "Potência não informada" };
  if (h.wattage < watts)
    return { status: "fail", label: `Abaixo da recomendação de ${watts} W` };
  if (!gpu?.hardware?.powerConnector || !Array.isArray(h.connectors))
    return {
      status: "unknown",
      label: "Potência atende; conectores precisam de conferência",
    };
  if (!h.connectors.includes(gpu.hardware.powerConnector))
    return {
      status: "fail",
      label: `Não possui o conector ${gpu.hardware.powerConnector} da GPU`,
    };
  const mobo = parts.find((p) => p.category === "mobo");
  if (
    mobo &&
    (!h.connectors.includes("atx24") ||
      !h.connectors.includes(mobo.hardware?.powerConnector || "eps8"))
  )
    return {
      status: "unknown",
      label: "Conectores ATX/EPS da placa-mãe precisam de confirmação",
    };
  return {
    status: "pass",
    label: `Atende aos critérios cadastrados · mínimo ${watts} W`,
  };
}
