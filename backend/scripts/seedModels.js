import { getDatabase } from "../src/config/firebaseConfig.js";
import { modelAssets } from "../data/modelAssets.js";
const db = getDatabase();
try {
  for (const [id, model3d] of Object.entries(modelAssets)) {
    const ref = db.collection("components").doc(id);
    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(ref);
      if (current.exists && !current.data().model3d)
        transaction.update(ref, { model3d });
    });
  }
  console.log(
    "Metadados dos quatro modelos acrescentados, preservando edições e fotografias.",
  );
} catch {
  console.error("Não foi possível registrar os modelos.");
  process.exitCode = 1;
} finally {
  await db.terminate();
}
