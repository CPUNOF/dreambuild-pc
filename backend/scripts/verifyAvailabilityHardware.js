import { readFileSync } from "node:fs";
import { getDatabase } from "../src/config/firebaseConfig.js";
import { Component } from "../src/models/Component.js";
import { parseComponent } from "../src/models/ComponentInput.js";
const curated = JSON.parse(
  readFileSync(
    new URL("../data/verifiedHardwareUpdates.json", import.meta.url),
    "utf8",
  ),
);
const db = getDatabase();
try {
  for (const item of curated) {
    await db.runTransaction(async (tx) => {
      const ref = db.collection("components").doc(item.id),
        snap = await tx.get(ref);
      if (!snap.exists || snap.data().model !== item.expectedModel)
        throw Error("Variante técnica divergente");
      const current = snap.data(),
        publicPart = new Component(item.id, current),
        merged = parseComponent({
          ...publicPart,
          hardware: { ...current.hardware, ...item.hardware },
          technicalSource: item.technicalSource,
          checkedAt: item.checkedAt,
          specifications: [
            ...publicPart.specifications.filter(
              (row) =>
                !item.specifications.some((newRow) => newRow[0] === row[0]),
            ),
            ...item.specifications,
          ],
        });
      tx.update(ref, {
        hardware: merged.hardware,
        technicalSource: merged.technicalSource,
        checkedAt: merged.checkedAt,
        specifications: merged.specifications,
      });
    });
  }
  console.log(
    "Fichas técnicas verificadas; menções parciais a sockets não tratadas como listas completas.",
  );
} finally {
  await db.terminate();
}
