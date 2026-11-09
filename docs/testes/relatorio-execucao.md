# Relatório de execução dos testes

Períodos: 31/10/2026 (R0–R6) e 09/11/2026 (R7, sobre o commit `3a4c511`, depois das entregas de 03 a 05/11).
Ambientes: Windows 11 com Node 24.19.0, Cypress 15.21.1 (Electron headless) e Vitest 5.0.5 nas rodadas R0–R6; Linux com Node 22.23.4 e Vitest 5.0.5 nas suítes `node:test` e Vitest da R7.
O relatório com **cada caso executado** e o respectivo status é gerado automaticamente em [`reports/relatorio-regressao.md`](../../reports/relatorio-regressao.md). O log completo da execução de 31/10 está em [`reports/evidencias/regressao-console.txt`](../../reports/evidencias/regressao-console.txt).

## 1. Resultado final

Rodada R7 (09/11/2026):

| Suíte | Ferramenta | Casos | Aprovados | Reprovados |
| --- | --- | ---: | ---: | ---: |
| Back-end — suíte do projeto (77 da linha de base + 28 das entregas de 03 a 05/11) | node:test | 105 | 105 | 0 |
| Back-end — unitários do trabalho | node:test | 80 | 80 | 0 |
| Back-end — API REST (inclui cenários de jogos e contrato Swagger) | node:test | 79 | 79 | 0 |
| Back-end — integração | node:test | 13 | 13 | 0 |
| Front-end — unitários e componentes (60 + 25 novos) | Vitest | 85 | 85 | 0 |
| Interface — Cypress com API simulada (30 + 5 novos) | Cypress | 35 | ⏳ pendente | ⏳ pendente |
| Interface — fluxo completo sem mocks | Cypress | 4 | ⏳ pendente | ⏳ pendente |
| **Total** | | **401** | **362 de 362 executados** | **0** |

As suítes Cypress da R7 ainda precisam ser executadas com `npm run test:regressao` no Windows: o ambiente Linux usado para a R7 não tem acesso ao download do binário do Cypress. Depois dessa execução, preencha as duas linhas marcadas com ⏳ e o total a partir de `reports/relatorio-regressao.md`, que é regenerado pelo próprio script.

**Critério de saída**: nas suítes já executadas da R7, 100% dos casos foram aprovados, sem nenhum reprovado, e a cobertura de linhas do back-end ficou ≥ 80% (90,68%). Todos os defeitos de aplicação estão corrigidos e cobertos por teste de regressão. O critério só fica totalmente atendido depois da execução Cypress pendente.

Na R6 (31/10) as duas suítes Cypress também foram executadas **com retries desligados** (`--config '{"retries":0}'`), com 30/30 e 4/4 aprovados. Ou seja, nenhum caso dependia de uma nova tentativa para passar.

## 2. Rodadas de execução (regressão)

| Rodada | O que mudou | Casos executados | Resultado | Observação |
| --- | --- | ---: | --- | --- |
| R0 — linha de base | Nenhuma alteração; suíte legada | 77 | 77 ✔ | Critério de entrada |
| R1 — Cypress inicial | Primeiros 28 testes E2E | 28 | 18 ✔ · 10 ✘ | Todas as falhas eram dos próprios testes (ver §4) |
| R2 — novos testes | Unitários, API, integração, Vitest e fluxo completo | 77 + 164 + 60 + 34 | Falhas reais: **DEF-01** (3 ✘), **DEF-02** (1 ✘), **DEF-03** (1 ✘ e FULL-02 intermitente), **DEF-04** (1 ✘) | Evidências salvas antes de corrigir |
| R3 — correções | DEF-01..04 corrigidos; mock alinhado (DEF-06) | Suítes afetadas | Todas ✔ | Casos `DEF-xx` passam a fazer parte da regressão |
| R4 — regressão | `node scripts/regressao.mjs` | 335 | 335 ✔ | JUnit, cobertura e relatório gerados |
| R5 — documentação Swagger | Revisão da especificação; **DEF-07** corrigido; 8 testes de contrato | 8 | 1ª verificação ✘ (56 violações) → 8 ✔ | `docs/api/openapi.json` exportado |
| R6 — regressão de 31/10 | `node scripts/regressao.mjs` | 343 | 343 ✔ | Inclui o contrato Swagger |
| **R7 — regressão após as entregas de 03 a 05/11** | `node scripts/regressao.mjs` (back-end e front-end) | **362** + 39 Cypress pendentes | **362 ✔** | Estoque próprio, endereço e frete, PC completo no carrinho, limpar carrinho, revisão da compra, Combate, galeria da comunidade; 53 casos novos de `node:test` e Vitest e 5 novos no Cypress |

Na R6, os 77 testes legados foram executados de novo **depois** das correções em `Game.js`, `App.jsx` e `ProductCatalog.jsx`, sem nenhuma reprovação. Na R7, os 343 casos da R6 que continuam existindo foram executados de novo junto com os novos, também sem reprovação nas suítes `node:test` e Vitest. A R7 não encontrou novos defeitos.

## 3. Defeitos

| ID | Severidade | Encontrado por | Situação após correção |
| --- | --- | --- | --- |
| DEF-01 Busca só com símbolos lista tudo | Baixa | CT-INT-05 (partição de equivalência) | Corrigido · 3 casos de regressão ✔ |
| DEF-02 Título de 404 em `/ranking/:id` | Baixa | CT-E2E-13 | Corrigido ✔ |
| DEF-03 Foco roubado do formulário | Média | CT-E2E-FULL-01 (intermitente) → CT-E2E-24 | Corrigido ✔ (sem retry) |
| DEF-04 Máximo do título antes do `trim` | Baixa | CT-UNI-13 (valor limite) | Corrigido ✔ |
| DEF-05 `wmic.exe` no Windows 11 | Média (ferramenta) | Execução do `npm run test:e2e` | Ferramenta substituída ✔ |
| DEF-06 Mock com mensagem divergente | Baixa (teste) | Comparação com CT-API-03 | Corrigido ✔ |
| DEF-07 Swagger inválido e com códigos genéricos | Média (documentação) | Validador OpenAPI + CT-API-16 | Corrigido ✔ |

Detalhes e evidências: [defeitos.md](defeitos.md).

<a id="falhas-que-nao-eram-defeitos"></a>
## 4. Falhas que não eram defeitos da aplicação

Separar o erro do teste do erro do sistema também faz parte da verificação:

| Falha observada | Causa real | Ajuste no teste |
| --- | --- | --- |
| `cy.click()` em 2 elementos (login) | A busca do cabeçalho também é um `button[type=submit]` | Seletor limitado a `.account-form-panel` |
| Botão "Adicionar Ryzen…" não encontrado | O nome real do produto começa com "AMD"; a home repete cards nos destaques | `aria-label` completo e escopo `#produtos` |
| Ordenação: esperado Ryzen 3 primeiro | O SSD (R$ 359,99) é mais barato que o Ryzen 3 (R$ 399,99) | Expectativa corrigida |
| Clique em link com `aria-disabled` | O link desabilitado tem `pointer-events: none` por estilo | `click({ force: true })` para provar que não navega |
| 429 em testes de login sem relação com o limitador | Todos os testes compartilham o IP 127.0.0.1 e acumulavam falhas no limitador | Limite alto no servidor compartilhado; CT-API-04 usa servidor próprio com `authLimit: 10` |
| `PUT /admin/components` → 400 | O DAO em memória não reproduzia o formato do Firestore (`specifications` como `{label, value}`) | DAO de teste alinhado ao DAO real |
| "Ver meu pedido" coberto | Por design, abre um `<dialog>` modal de sucesso | O teste usa o botão do modal |

## 5. Cobertura de código (bônus)

Números da R7 (09/11/2026).

### 5.1 Back-end — `node --experimental-test-coverage` (arquivos de teste excluídos)

| Métrica | Linhas | Ramos | Funções |
| --- | ---: | ---: | ---: |
| **Todos os arquivos** | **90,68%** | **89,16%** | **87,05%** |

| Camada | Destaques |
| --- | --- |
| Models | `User`, `Cart`, `Pagination`, `Component`, `DemoCard`, `Comparison`, `Game`, `ReferencePerformance`, `Delivery` e `Inventory`: **100%** de linhas · `Upgrade` 98,6% · `Offer` 97,8% · `CommunityBuild` 96,3% · `Simulation` 94,2% · `ComponentInput` 89,4% · `Build` 88,8% |
| Middlewares | `authMiddleware` e `csrfMiddleware`: **100%** |
| Controllers | `AddressController`, `AdminController`, `CartController` e `GameController`: 100% · `OrderController` 96,7% · `ComponentController` 94,3% · `CommunityController` 87,6% · `AuthController` 83,6% · `InventoryController` 82,9% · `BuildController` 80,8% · `ReferenceController` 29,1% |
| Regras compartilhadas (`shared/`) | `delivery`, `inventory` e `verifiedHardware`: 100% · `suggestAssembly` 97,2% · `selectionCompatibility` 94,0% · `buildResources` 93,2% · `assemblyCompatibility` 75,7% |
| DAOs (Firestore) | `CommunityDAO` 99,4% · `SessionDAO` 76,9% · `UserDAO` 76,6% · `InventoryDAO` 76,1% · `OrderDAO` 75,9% · `ComponentDAO` 63,1% · `ReferenceDAO` 47,4% · `BuildDAO` 33,3% · `MetricsDAO` 33,3% · `GameDAO` 25,5% |

**Áreas não cobertas e justificativa**

- **DAOs do Firestore (25–77%)**: são o adaptador para o banco externo. Testá-los exigiria um projeto Firebase com credenciais, ou o emulador do Firestore, que depende de Java e de configuração extra. A estratégia substitui esses DAOs por implementações em memória **com a mesma interface**, então tudo acima deles (rotas, sessão, CSRF, regras, controllers) é exercitado. A lógica de cache e de cota que fica dentro dos DAOs é coberta pelos testes legados com um banco falso (`CommunityDAO` 99%).
- **`ReferenceController` (29%) e `BuildController` (81%)**: geram os relatórios de desempenho e a análise de montagem pela interface do montador. As regras de compatibilidade e de FPS estão nos models (`Build` 89%, `ReferencePerformance` 100%) e nos testes legados; faltam testes de rota para `/builds/:id/performance` e `/systems`.
- **`AuthController` (84%)**: as linhas descobertas são os ramos de login e de vínculo com o Google, que dependem da verificação do token pelo Firebase Auth.
- **`InventoryController` (83%)**: as linhas descobertas são a listagem paginada do histórico de movimentações pelo painel do administrador; as regras de movimentação estão em `Inventory` e `shared/inventory.js`, ambos com 100% de linhas.
- **`shared/assemblyCompatibility.js` (76%)**: ramos de mensagens de incompatibilidade de combinações raras (portas e conectores específicos); os bloqueios principais são cobertos por CT-UNI-14 e CT-INT-09.
- **`googleAuth.js` (77%), `firebaseConfig.js` (85%) e `sessionConfig.js` (88%)**: ramos que só rodam com credenciais de produção ou com `NODE_ENV=production`.

### 5.2 Front-end — `@vitest/coverage-v8` (módulos com testes unitários)

| Módulo | Linhas | Ramos | Funções |
| --- | ---: | ---: | ---: |
| `src/data/offers.js` | 100% | 100% | 100% |
| `src/components/AddToCartButton.jsx` | 100% | 83,3% | 66,7% |
| `src/data/componentSelection.js` | 96,6% | 90,4% | 100% |
| `src/components/ProductCatalog.jsx` | 96,6% | 86,1% | 93,3% |
| `src/api/client.js` | 91,0% | 80,8% | 84,6% |
| `src/components/ProductPrice.jsx` | 41,7% | 18,2% | 16,7% |
| **Total medido** | **90,3%** | **79,2%** | **81,3%** |

**Justificativa**: a cobertura unitária do front-end foi medida só nos módulos com lógica de regra (preço, busca, seleção e cliente HTTP). Páginas e componentes visuais (montador, combate, ranking, 3D) são verificados pelos 34 testes Cypress, que não geram cobertura de código. `ProductPrice.jsx` aparece baixo porque só o `CardPrice` é usado pelo catálogo; `ProductPriceSummary` e `StoreOffers` são exercitados pelo Cypress (CT-E2E-09 e 10). Em `client.js` (91%), as linhas restantes são ramos de erro de rede pouco frequentes. Os testes de componente novos (CT-INT-09 a 16) exercitam páginas como a bancada, o Combate e a revisão da compra, mas essas páginas não entram na lista de arquivos medidos da configuração de cobertura.

Relatórios navegáveis: `reports/coverage/frontend/index.html` e `reports/coverage/backend/lcov.info` (gerados pela regressão e publicados como artefato da CI).

## 6. Itens de bônus

| Bônus | Evidência |
| --- | --- |
| Relatório de cobertura com análise | §5 deste documento + `reports/coverage/` |
| Automação de um fluxo completo FE + BE | `frontend/cypress/fullstack/fluxo-completo.cy.js` (4 fluxos, sem mocks) + `backend/scripts/e2eServer.js` |
| Execução em CI | `.github/workflows/testes.yml`: regressão completa a cada push e PR |
| Integração com ferramenta de relatório | JUnit publicado na aba *Checks* do GitHub (`dorny/test-reporter`), resumo no *Job Summary* e `reports/relatorio-regressao.md` gerado a partir dos XMLs |

## 7. Conclusão

A aplicação atende aos critérios de aceite dos requisitos avaliados, inclusive dos que entraram com as entregas de 03 a 05/11 (RF19 estoque próprio, RF20 endereço e frete, RF21 Combate e as ampliações de RF06, RF14 e RF15), que passaram em todos os casos `node:test` e Vitest da R7. Os testes encontraram **quatro defeitos reais**: três no front-end (um de acessibilidade, de severidade média) e um de valor limite no back-end. Todos foram corrigidos e agora estão protegidos por casos de regressão. As regras de segurança mais sensíveis — CSRF, perfis de acesso, mensagem de login que não revela contas, isolamento de pedidos e erros sem detalhes internos — passaram em todos os cenários, inclusive nos de erro. A principal limitação é não exercitar o Firestore e o login com Google reais. Ela foi mitigada com DAOs em memória de mesma interface e com a trava que impede rodar o fluxo completo contra o banco real.
