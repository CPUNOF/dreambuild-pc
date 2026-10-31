import { hardwareFacts } from "../data/hardwareFacts.js";
import { getDatabase } from "../src/config/firebaseConfig.js";
const database = getDatabase();
try {
  for (const [id, facts] of Object.entries(hardwareFacts)) {
    const ref = database.collection("components").doc(id);
    await database.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) return;
      // Preencher ausências, preservando os campos já editados pelo administrador.
      transaction.update(ref, {
        hardware: { ...facts, ...snapshot.data().hardware },
      });
    });
  }
  console.log(
    "Dados técnicos iniciais acrescentados sem substituir edições existentes ou ofertas.",
  );
} catch {
  console.error("Não foi possível completar os dados técnicos.");
  process.exitCode = 1;
} finally {
  await database.terminate();
}
