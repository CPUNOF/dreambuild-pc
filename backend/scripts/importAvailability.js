import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { getDatabase } from "../src/config/firebaseConfig.js";
import { parseComponent } from "../src/models/ComponentInput.js";
import { Offer } from "../src/models/Offer.js";
const products = JSON.parse(
  readFileSync(
    new URL("../data/availabilityProducts.json", import.meta.url),
    "utf8",
  ),
);
const quotes = JSON.parse(
  readFileSync(
    new URL("../data/availabilityQuotes.json", import.meta.url),
    "utf8",
  ),
);
const prepared = products.map((p, index) => ({
  id: p.id,
  document: { ...parseComponent(p), displayOrder: 1000 + index },
}));
for (const item of quotes) {
  if (!/^[-a-zA-Z0-9_]{1,128}$/.test(item.id)) throw Error("ID inválido");
  Offer.parseMany([item.offer]);
}
const db = getDatabase(),
  backup = [];
mkdirSync(new URL("../../tmp/", import.meta.url), { recursive: true });
let created = 0,
  updated = 0,
  preserved = 0;
try {
  for (const p of prepared) {
    try {
      await db.collection("components").doc(p.id).create(p.document);
      created++;
    } catch (error) {
      if (error.code === 6 || error.code === "already-exists") preserved++;
      else throw error;
    }
  }
  for (const item of quotes) {
    await db.runTransaction(async (tx) => {
      const ref = db.collection("components").doc(item.id),
        snap = await tx.get(ref);
      if (!snap.exists) throw Error("Produto não encontrado: " + item.id);
      const current = snap.data(),
        old = current.offers || [];
      const normalizeModel = (value) =>
        value.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (normalizeModel(current.model) !== normalizeModel(item.model)) {
        preserved++;
        return;
      }
      const existing = old.find(
        (o) => o.store === "kabum" && o.paymentMethod === "pix",
      );
      if (
        existing &&
        Date.parse(existing.checkedAt) >= Date.parse(item.offer.checkedAt)
      ) {
        preserved++;
        return;
      }
      const offers = Offer.parseMany([
        ...old.filter(
          (o) => !(o.store === "kabum" && o.paymentMethod === "pix"),
        ),
        item.offer,
      ]);
      const patch = { offers };
      if (current.category === "cooler") {
        const liquid = /water|liquid|aio/i.test(current.fullName);
        patch.hardware = {
          ...current.hardware,
          coolingType: liquid ? "liquid" : "air",
        };
        const mm =
          liquid && current.fullName.match(/\b(120|240|280|360|420)\s*mm/i);
        if (mm) patch.hardware.radiatorSizeMm = Number(mm[1]);
      }
      backup.push({
        id: item.id,
        offers: old,
        hardware: current.hardware || {},
      });
      tx.update(ref, patch);
      updated++;
    });
  }
  writeFileSync(
    new URL(
      `../../tmp/availability-before-import-${Date.now()}.json`,
      import.meta.url,
    ),
    JSON.stringify(backup, null, 2),
  );
  console.log(JSON.stringify({ created, offersUpdated: updated, preserved }));
} finally {
  await db.terminate();
}
