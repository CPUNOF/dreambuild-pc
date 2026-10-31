import { products } from "../../frontend/src/data/products.js";
import { getDatabase } from "../src/config/firebaseConfig.js";

let database;
try {
  database = getDatabase();
  for (const product of products) {
    const { id, ...document } = product;
    try {
      // create é atômico: repetir a carga não substitui cadastros existentes.
      const specifications = document.specifications.map(([label, value]) => ({
        label,
        value,
      }));
      await database
        .collection("components")
        .doc(id)
        .create({
          ...document,
          specifications,
          displayOrder: products.indexOf(product),
        });
      console.log(`Criado: ${product.name}`);
    } catch (error) {
      if (error.code !== 6 && error.code !== "already-exists") throw error;
      console.log(`Preservado: ${product.name}`);
    }
  }
} catch {
  console.error(
    "A carga não foi concluída. Confira a conexão e a configuração do Firestore antes de repetir.",
  );
  process.exitCode = 1;
} finally {
  if (database) await database.terminate();
}
