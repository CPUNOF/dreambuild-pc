// Exporta a especificação OpenAPI para docs/api/openapi.json.
// Uso: npm run docs:api --workspace backend
// O arquivo pode ser aberto em https://editor.swagger.io (File → Import file)
// sem precisar iniciar o servidor. O teste CT-API-15 falha se ele ficar
// desatualizado em relação a src/config/openapi.js.
import { mkdirSync, writeFileSync } from "node:fs";
import { openapi } from "../src/config/openapi.js";

const target = new URL("../../docs/api/openapi.json", import.meta.url);
mkdirSync(new URL(".", target), { recursive: true });
writeFileSync(target, JSON.stringify(openapi, null, 2) + "\n");
const operations = Object.values(openapi.paths).reduce(
  (total, ops) => total + Object.keys(ops).length,
  0,
);
console.log(`docs/api/openapi.json atualizado (${operations} operações).`);
