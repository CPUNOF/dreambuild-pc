import { manualOffers } from "../data/manualOffers.js";
import { Offer } from "../src/models/Offer.js";
import { getDatabase } from "../src/config/firebaseConfig.js";
const database = getDatabase();
try {
  for (const { id, offers } of manualOffers) {
    const validated = Offer.parseMany(offers);
    const ref = database.collection("components").doc(id);
    await database.runTransaction(async (transaction) => {
      const doc = await transaction.get(ref);
      if (!doc.exists) return;
      const current = doc.data().offers || [];
      const missing = validated.filter(
        (offer) =>
          !current.some(
            (existing) =>
              existing.store === offer.store &&
              existing.paymentMethod === offer.paymentMethod,
          ),
      );
      if (missing.length)
        transaction.update(ref, { offers: [...current, ...missing] });
    });
  }
  console.log("Consultas manuais cadastradas; ofertas existentes preservadas.");
} catch {
  console.error("Não foi possível completar a carga de ofertas.");
  process.exitCode = 1;
} finally {
  await database.terminate();
}
