import { writeFile } from "node:fs/promises";
import { ComponentDAO } from "../src/dao/ComponentDAO.js";
const dao = new ComponentDAO(),
  items = [];
let cursor;
do {
  let page;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      page = await dao.queryList({ limit: 100, cursor });
      break;
    } catch (error) {
      if (error.code !== 8 || attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  items.push(...page.items);
  if (page.source)
    throw new Error(
      "Banco indisponível: a cópia local não será apresentada como uma nova exportação do Firestore.",
    );
  cursor = page.nextCursor;
} while (cursor);
const data = {
  origin: "firestore-export",
  exportedAt: new Date().toISOString(),
  items,
};
await writeFile(
  new URL("../data/publicCatalogSnapshot.json", import.meta.url),
  JSON.stringify(data),
);
console.log(
  `Registro público verificado: ${items.length} produtos. Nenhum usuário, sessão ou credencial foi exportado.`,
);
