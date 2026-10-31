import { readFileSync, writeFileSync } from "node:fs";
import { products } from "../../frontend/src/data/products.js";
import { hardwareFacts } from "../data/hardwareFacts.js";
import { manualOffers } from "../data/manualOffers.js";
import { parseComponent } from "../src/models/ComponentInput.js";
import { Component } from "../src/models/Component.js";
import { Offer } from "../src/models/Offer.js";
const read = (name) =>
  JSON.parse(readFileSync(new URL("../data/" + name, import.meta.url), "utf8"));
const records = new Map(
  products.map((p, i) => [
    p.id,
    {
      ...parseComponent({
        ...p,
        hardware: hardwareFacts[p.id],
        offers: manualOffers.find((o) => o.id === p.id)?.offers || [],
      }),
      displayOrder: i,
    },
  ]),
);
const raw = [
    "expandedKabum.json",
    "expandedCases.json",
    "expandedKingston.json",
  ].flatMap(read),
  groups = [
    "cpu",
    "gpu",
    "mobo",
    "psu",
    "case",
    "cooler",
    "storage",
    "ram",
  ].map((c) => raw.filter((p) => p.category === c));
let index = 100;
while (groups.some((g) => g.length))
  for (const g of groups)
    if (g.length) {
      const p = g.shift();
      if (!records.has(p.id))
        records.set(p.id, { ...parseComponent(p), displayOrder: index++ });
    }
for (const [pIndex, p] of read("availabilityProducts.json").entries())
  if (!records.has(p.id))
    records.set(p.id, { ...parseComponent(p), displayOrder: 1000 + pIndex });
for (const q of read("availabilityQuotes.json")) {
  const p = records.get(q.id);
  if (
    !p ||
    p.model.toLowerCase().replace(/[^a-z0-9]/g, "") !==
      q.model.toLowerCase().replace(/[^a-z0-9]/g, "")
  )
    continue;
  const old = p.offers || [],
    existing = old.find(
      (o) =>
        o.store === q.offer.store && o.paymentMethod === q.offer.paymentMethod,
    );
  if (
    !existing ||
    Date.parse(existing.checkedAt) < Date.parse(q.offer.checkedAt)
  )
    p.offers = Offer.parseMany([
      ...old.filter(
        (o) =>
          !(
            o.store === q.offer.store &&
            o.paymentMethod === q.offer.paymentMethod
          ),
      ),
      q.offer,
    ]);
}
for (const u of [
  ...read("verifiedHardwareUpdates.json"),
  ...read("benchHardware.json"),
]) {
  const p = records.get(u.id);
  if (p?.model !== u.expectedModel) throw Error("Ficha técnica divergente");
  Object.assign(p, {
    hardware: { ...p.hardware, ...u.hardware },
    technicalSource: u.technicalSource,
    checkedAt: u.checkedAt,
    specifications: [
      ...p.specifications,
      ...u.specifications.map(([label, value]) => ({ label, value })),
    ],
  });
}
const items = [...records]
  .map(([id, p]) => new Component(id, p))
  .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
writeFileSync(
  new URL("../data/publicCatalogSnapshot.json", import.meta.url),
  JSON.stringify({
    origin: "curated-records",
    exportedAt: new Date().toISOString(),
    items,
  }),
);
console.log(
  `Catálogo público recomposto das fontes versionadas: ${items.length} fichas; sem consulta ao banco e sem dados de usuários.`,
);
