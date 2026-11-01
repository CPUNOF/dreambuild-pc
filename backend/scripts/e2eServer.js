// Servidor para os testes E2E de fluxo completo (front-end + back-end real).
// Sobe a API Express de verdade (rotas, middlewares, controllers, models,
// sessão e CSRF) com os DAOs em memória de test/support/memory.js, no lugar
// do Firestore. Assim o Cypress exercita a integração ponta a ponta sem
// credenciais do Firebase e com dados previsíveis a cada execução.
// Cada cenário cria um usuário com e-mail único, então não há reinício de estado.
//
// Uso: node scripts/e2eServer.js   (porta 3001, a mesma do proxy do Vite)
import { createServer } from "node:http";
import { memoryApp } from "../test/support/memory.js";

const port = Number(process.env.E2E_PORT || 3001);
const { app } = await memoryApp();

// Marca todas as respostas: o Cypress e scripts/regressao.mjs só rodam o fluxo
// completo se este cabeçalho estiver presente, para nunca gravar dados de teste
// no back-end de desenvolvimento ligado ao Firestore real.
const marked = (req, res) => {
  res.setHeader("X-DreamBuild-E2E", "memory");
  app(req, res);
};

createServer(marked).listen(port, "127.0.0.1", () =>
  console.log(`API E2E (DAOs em memória) em http://127.0.0.1:${port}`),
);
