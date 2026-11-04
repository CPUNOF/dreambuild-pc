import { assemblyIssues, assemblyReadiness } from "./assemblyCompatibility.js";
import { includedCooling } from "./buildResources.js";
import { saleOffer } from "./inventory.js";
const order = ["cpu", "mobo", "ram", "gpu", "storage", "psu", "case", "cooler"];
export function suggestAssembly(products, preferredCpuId) {
  const pool = products.filter(
    (p) => saleOffer(p) && assemblyReadiness(p).length === 0,
  );
  let examined = 0;
  function visit(index, parts) {
    if (index === order.length)
      return Object.fromEntries(parts.map((p) => [p.category, p.id]));
    if (++examined > 10000) return null;
    const category = order[index];
    if (
      category === "cooler" &&
      includedCooling(parts.find((p) => p.category === "cpu"))
    )
      return visit(index + 1, parts);
    const candidates = pool
      .filter((p) => p.category === category)
      .sort(
        (a, b) =>
          Number(b.id === preferredCpuId) - Number(a.id === preferredCpuId) ||
          saleOffer(a).priceCents - saleOffer(b).priceCents,
      );
    for (const candidate of candidates) {
      const next = [...parts, candidate];
      if (assemblyIssues(next).length) continue;
      const result = visit(index + 1, next);
      if (result) return result;
    }
    return null;
  }
  return visit(0, []);
}
