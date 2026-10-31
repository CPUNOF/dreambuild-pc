import { readFileSync } from "node:fs";
import { getDatabase } from "../src/config/firebaseConfig.js";
import { parseComponent } from "../src/models/ComponentInput.js";
const sources = [
  "expandedKabum.json",
  "expandedCases.json",
  "expandedKingston.json",
];
const raw = sources.flatMap((file) =>
  JSON.parse(readFileSync(new URL("../data/" + file, import.meta.url), "utf8")),
);
// Intercalar departamentos mantém a vitrine variada, mesmo com muitos kits de RAM.
const groups = [
  "cpu",
  "gpu",
  "mobo",
  "psu",
  "case",
  "cooler",
  "storage",
  "ram",
].map((category) => raw.filter((part) => part.category === category));
const ordered = [];
while (groups.some((group) => group.length))
  for (const group of groups) if (group.length) ordered.push(group.shift());
const records = ordered.map((input, index) => {
  try {
    return {
      id: input.id,
      document: { ...parseComponent(input), displayOrder: 100 + index },
    };
  } catch {
    throw new Error("Ficha inválida na carga: " + input.id);
  }
});
const database = getDatabase();
let created = 0,
  preserved = 0;
try {
  for (const { id, document } of records) {
    try {
      await database.collection("components").doc(id).create(document);
      created++;
    } catch (error) {
      if (error.code === 6 || error.code === "already-exists") preserved++;
      else throw error;
    }
  }
  console.log(JSON.stringify({ created, preserved, prepared: records.length }));
} catch {
  console.error(
    "Carga interrompida. Os registros existentes foram preservados; confira os dados e repita.",
  );
  process.exitCode = 1;
} finally {
  await database.terminate();
}
