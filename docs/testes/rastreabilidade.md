# Matriz de rastreabilidade

O projeto não tem um documento formal de requisitos. Os requisitos abaixo foram **extraídos do comportamento implementado** (rotas em `backend/src/app.js`, regras nos models, telas do front-end) e da documentação existente em `docs/`. Cada requisito tem um critério de aceite e os casos que o verificam.

## Requisitos funcionais

| Req. | Critério de aceite | Casos de teste | Situação |
| --- | --- | --- | --- |
| **RF01** Cadastro, login, logout e sessão | Nome 2..80, e-mail válido ≤ 254, senha 8..128; perfil sempre CLIENT; hash scrypt; login com mensagem genérica; logout invalida a sessão | CT-UNI-01, 02, 03, 04 · CT-API-01, 02, 03, 05 · CT-E2E-22, 23, 25, 26, 28 · CT-E2E-FULL-01, 02, 03 · legado `auth.test.js` | ✅ Coberto |
| **RF02** Controle de acesso por perfil | Visitante: 401 em rota privada; CLIENT: 403 em rota de admin; ADMIN: acesso total; conta desativada perde o acesso | **CT-FUN-01** · CT-API-06, 10 · CT-INT-03, 04 · CT-E2E-20, 27, 29, 30 · CT-E2E-FULL-02, 04 · legado `admin.test.js`, `auth.test.js` | ✅ Coberto |
| **RF03** Catálogo público | Paginação por cursor (`limit` 1..100), filtro por categoria, detalhe 404/400, 503 sem detalhes internos | CT-UNI-08, 11 · CT-API-07, 08 · CT-E2E-01, 07 · legado `catalog.test.js`, `optimization.test.js` | ✅ Coberto |
| **RF04** Busca, filtros e ordenação | Busca sem acento e sem diferenciar maiúsculas, por departamento, "somente disponíveis", ordenação por nome e por preço PIX | CT-INT-05 · CT-E2E-02, 03, 04, 05, 06 | ✅ Coberto (DEF-01 corrigido) |
| **RF05** Página de produto | Ficha, destaques, ofertas por loja, link para o montador, 404 | CT-E2E-09, 10, 11, 12 | ✅ Coberto |
| **RF06** Carrinho | Quantidade 1..10, até 30 modelos, sem repetição, produto sem oferta → 409, CSRF obrigatório, totais corretos | CT-UNI-05 · CT-API-11 · CT-E2E-15..19, 21 · CT-E2E-FULL-01 · legado `cart.test.js` | ✅ Coberto |
| **RF07** Compra simulada | Cartão fictício válido do próprio usuário; cotação e carrinho iguais à sessão; idempotência; carrinho esvaziado | CT-INT-01, 02, 03 · CT-E2E-19 · CT-E2E-FULL-01 · legado `orders.test.js`, `cart.test.js` | ✅ Coberto |
| **RF08** Histórico de pedidos | Lista e detalhe só do dono; pedido alheio → 404 | CT-INT-02, 04 · CT-E2E-27 · CT-E2E-FULL-01 · legado `orders.test.js` | ✅ Coberto |
| **RF09** CRUD de produtos (admin) | Cadastrar 201 / duplicado 409 / incompleto 400; alterar 200 / slug fixo 400; remover 200 / inexistente 404 | CT-UNI-07 · CT-API-09, 10 · legado `admin.test.js` | ✅ Coberto |
| **RF10** CRUD de cenários de jogos (admin) | Título 2..120, peso 0,1..10, imagens locais ou HTTPS, id fixo | CT-UNI-13 · CT-API-12 | ✅ Coberto (DEF-04 corrigido) |
| **RF11** Robustez e segurança da API | Envelope JSON padrão; CSRF; 429 após o limite; 413 para corpo grande; JSON malformado → 400 sem stack; CORS só para origens autorizadas | CT-API-01..04, 07, 10, 11 · CT-UNI-12 · legado `http.test.js`, `deployment.test.js` | ✅ Coberto |
| **RF12** Ofertas e preços | Melhor oferta PIX disponível; ofertas do admin validadas (loja, URL HTTPS da loja, data, preço) | CT-UNI-06, 07, 09 · CT-E2E-06 | ✅ Coberto |
| **RF13** Interface e acessibilidade | Título da aba por rota; foco preservado durante a digitação; tema persistente; mensagens de erro com `role=alert` | CT-E2E-08, 13, 14, 24 · CT-E2E-07, 21, 23 | ✅ Coberto (DEF-02 e DEF-03 corrigidos) |
| **RF14** Montador e compatibilidade | Socket, DDR, fonte, gabinete, cooler, M.2/SATA e quantidades validados no servidor | CT-UNI-10 · legado `build.test.js`, `build-resources.test.js`, `componentSelection.test.js`, `upgrade.test.js` | ✅ Legado + unitário |
| **RF15** Ranking e publicação na comunidade | Publicação com consentimento, sem FPS ou preço forjados; dono controla a publicação | legado `community.test.js`, `references.test.js` | ✅ Legado |
| **RF16** Bancada em tempo real (WebSocket) | Origem, CSRF e dono verificados; dados param no stop e no logout | legado `websocket.test.js` | ✅ Legado |
| **RF18** Documentação da API (Swagger) | Especificação OpenAPI válida, cobrindo todas as rotas, com os códigos de status realmente devolvidos e servida em `/api-docs` | CT-API-13, 14, 15, 16 | ✅ Coberto (DEF-07 corrigido) |
| **RF17** Login com Google | Cria CLIENT, vincula por UID, Gmail verificado | legado `references.test.js` (regras do servidor) | ⚠️ Parcial: popup OAuth não automatizado (ver limitações) |

## Requisitos não funcionais

| Req. | Critério | Casos | Situação |
| --- | --- | --- | --- |
| RNF01 Segurança de credenciais | Senha nunca devolvida; hash com salt; mensagem de login genérica | CT-UNI-04 · CT-API-02, 03 | ✅ |
| RNF02 Sigilo de erros internos | 503 e 400 sem stack nem texto do banco | CT-API-07 · legado `http.test.js`, `catalog.test.js` | ✅ |
| RNF03 Economia de leituras no banco | Cache compartilhado e cópia local quando a cota estoura | CT-UNI-11 · legado `optimization.test.js`, `community.test.js` | ✅ |
| RNF04 Implantação | Recusa iniciar sem segredo; credencial em memória | legado `deployment.test.js`, `firebaseConfig.test.js` | ✅ |

<a id="suite-legada"></a>
## Suíte legada → requisitos

| Arquivo (`backend/test/`) | Casos | Requisitos |
| --- | ---: | --- |
| `admin.test.js` | 4 | RF02, RF09, RF12 |
| `auth.test.js` | 6 | RF01, RF02, RF11 |
| `build.test.js` | 7 | RF14 |
| `build-resources.test.js` | 8 | RF14 |
| `cart.test.js` | 2 | RF06, RF07 |
| `catalog.test.js` | 6 | RF03, RNF02 |
| `community.test.js` | 7 | RF15, RNF03 |
| `componentSelection.test.js` | 1 | RF14 |
| `deployment.test.js` | 5 | RF11, RNF04 |
| `firebaseConfig.test.js` | 1 | RNF04 |
| `http.test.js` | 7 | RF11, RNF02 |
| `optimization.test.js` | 4 | RF03, RNF03 |
| `orders.test.js` | 2 | RF07, RF08 |
| `references.test.js` | 13 | RF15, RF17, RNF03 |
| `sessionDAO.test.js` | 1 | RF01 |
| `upgrade.test.js` | 1 | RF14 |
| `websocket.test.js` | 2 | RF16 |
| **Total** | **77** | |

## Defeitos → requisitos → casos de regressão

| Defeito | Requisito | Caso que reproduziu e agora protege |
| --- | --- | --- |
| DEF-01 | RF04 | CT-INT-05 (3 casos "DEF-01") |
| DEF-02 | RF13 | CT-E2E-13 |
| DEF-03 | RF13, RF01 | CT-E2E-24 (e CT-E2E-FULL-02) |
| DEF-04 | RF10 | CT-UNI-13 ("120 caracteres + espaço") |
| DEF-07 | RF18 | CT-API-13 (validador OpenAPI) e CT-API-16 (contrato de status) |
