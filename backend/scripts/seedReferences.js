import { readFile } from "node:fs/promises";
import { getDatabase } from "../src/config/firebaseConfig.js";
const data = JSON.parse(
  await readFile(
    new URL("../data/referenceBenchmarks.json", import.meta.url),
    "utf8",
  ),
);
const systems = JSON.parse(
  await readFile(new URL("../data/readySystems.json", import.meta.url), "utf8"),
);
const db = getDatabase(),
  batch = db.batch();
const datasetOnly = process.argv.includes("--dataset-only");
batch.set(db.collection("benchmark_datasets").doc(data.version), data);
const records = datasetOnly ? [] : systems;
const refs = records.map((system) =>
  db.collection("reference_systems").doc(system.id),
);
const saved = refs.length ? await db.getAll(...refs) : [];
for (const [index, system] of records.entries()) {
  const previous = saved[index].exists ? saved[index].data() : {};
  const prices = Object.fromEntries(
    [
      "priceCents",
      "priceKind",
      "priceCheckedAt",
      "offerUrl",
      "sellerName",
      "storeName",
      "available",
    ]
      .filter((key) => Object.hasOwn(previous, key))
      .map((key) => [key, previous[key]]),
  );
  batch.set(
    refs[index],
    {
      ...system,
      ...prices,
      checkedAt: data.checkedAt,
      datasetVersion: data.version,
    },
    { merge: true },
  );
}
await batch.commit();
console.log(
  `Referências importadas: versão ${data.version}, ${Object.keys(data.gpuProfiles || {}).length} GPUs, ${data.games.length} jogos. ${datasetOnly ? 0 : systems.length} configurações prontas atualizadas. Nenhuma montagem de usuário foi publicada.`,
);
