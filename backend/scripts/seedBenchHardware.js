import { readFileSync } from "node:fs";
import { getDatabase } from "../src/config/firebaseConfig.js";
const updates = JSON.parse(
    readFileSync(new URL("../data/benchHardware.json", import.meta.url)),
  ),
  db = getDatabase();
let done = 0;
const deadline = setTimeout(() => {
  console.error(
    `Limite de espera de 30s atingido; ${done}/${updates.length} fichas confirmadas. Execute novamente após renovar a cota. Não foram publicadas montagens.`,
  );
  process.exit(2);
}, 30000);
try {
  for (const p of updates) {
    await db.runTransaction(
      async (tx) => {
        const ref = db.collection("components").doc(p.id),
          snap = await tx.get(ref);
        if (!snap.exists || snap.data().model !== p.expectedModel)
          throw Error("SKU divergente: " + p.id);
        const fields = Object.fromEntries(
          Object.entries(p.hardware).map(([key, value]) => [
            "hardware." + key,
            value,
          ]),
        );
        fields.technicalSource = p.technicalSource;
        fields.checkedAt = p.checkedAt;
        tx.update(ref, fields);
      },
      { maxAttempts: 1 },
    );
    done++;
    console.log(`Confirmada ${done}/${updates.length}: ${p.id}`);
  }
  console.log(
    `Fichas da bancada atualizadas no Firestore: ${done}. Nenhuma oferta, montagem ou publicação alterada.`,
  );
} catch (error) {
  if (error.code === 8) {
    console.log(
      `Cota de leitura excedida; ${done}/${updates.length} fichas atualizadas. Importação restante preparada para após a renovação.`,
    );
    process.exitCode = 2;
  } else {
    console.error("Importação interrompida:", error.message);
    process.exitCode = 1;
  }
} finally {
  clearTimeout(deadline);
  await db.terminate();
}
