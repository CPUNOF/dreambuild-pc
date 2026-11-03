# Relatório de execução dos testes

Período: 31/10/2026 · Ambiente: Windows 11, Node 24.19.0, Cypress 15.21.1 (Electron headless), Vitest 5.0.5.
O relatório com **cada caso executado** e o respectivo status é gerado automaticamente em [`reports/relatorio-regressao.md`](../../reports/relatorio-regressao.md). O log completo da execução final está em [`reports/evidencias/regressao-console.txt`](../../reports/evidencias/regressao-console.txt).

## 1. Resultado final

| Suíte | Ferramenta | Casos | Aprovados | Reprovados |
| --- | --- | ---: | ---: | ---: |
| Back-end — legado do projeto | node:test | 77 | 77 | 0 |
| Back-end — unitários novos | node:test | 80 | 80 | 0 |
| Back-end — API REST (inclui cenários de jogos e contrato Swagger) | node:test | 79 | 79 | 0 |
| Back-end — integração | node:test | 13 | 13 | 0 |
| Front-end — unitários e componentes | Vitest | 60 | 60 | 0 |
| Interface — Cypress com API simulada | Cypress | 30 | 30 | 0 |
| Interface — fluxo completo sem mocks | Cypress | 4 | 4 | 0 |
| **Total** | | **343** | **343** | **0** |

**Critério de saída atendido**: 100% executados, 0 reprovados, todos os defeitos de aplicação corrigidos e com teste de regressão, cobertura de linhas do back-end ≥ 80% (89,52%).

As duas suítes Cypress também foram executadas **com retries desligados** (`--config '{"retries":0}'`), com 30/30 e 4/4 aprovados. Ou seja, nenhum caso depende de uma nova tentativa para passar.

## 2. Rodadas de execução (regressão)

| Rodada | O que mudou | Casos executados | Resultado | Observação |
| --- | --- | ---: | --- | --- |
| R0 — linha de base | Nenhuma alteração; suíte legada | 77 | 77 ✔ | Critério de entrada |
| R1 — Cypress inicial | Primeiros 28 testes E2E | 28 | 18 ✔ · 10 ✘ | Todas as falhas eram dos próprios testes (ver §4) |
| R2 — novos testes | Unitários, API, integração, Vitest e fluxo completo | 77 + 164 + 60 + 34 | Falhas reais: **DEF-01** (3 ✘), **DEF-02** (1 ✘), **DEF-03** (1 ✘ e FULL-02 intermitente), **DEF-04** (1 ✘) | Evidências salvas antes de corrigir |
| R3 — correções | DEF-01..04 corrigidos; mock alinhado (DEF-06) | Suítes afetadas | Todas ✔ | Casos `DEF-xx` passam a fazer parte da regressão |
| R4 — regressão | `node scripts/regressao.mjs` | 335 | 335 ✔ | JUnit, cobertura e relatório gerados |
| R5 — documentação Swagger | Revisão da especificação; **DEF-07** corrigido; 8 testes de contrato | 8 | 1ª verificação ✘ (56 violações) → 8 ✔ | `docs/api/openapi.json` exportado |
| **R6 — regressão final** | `node scripts/regressao.mjs` | **343** | **343 ✔** | Inclui o contrato Swagger |

Na regressão final, os 77 testes legados foram executados de novo **depois** das correções em `Game.js`, `App.jsx` e `ProductCatalog.jsx`, sem nenhuma reprovação.

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

### 5.1 Back-end — `node --experimental-test-coverage` (arquivos de teste excluídos)

| Métrica | Linhas | Ramos | Funções |
| --- | ---: | ---: | ---: |
| **Todos os arquivos** | **89,52%** | **89,09%** | **85,21%** |

| Camada | Destaques |
| --- | --- |
| Models | `User`, `Cart`, `Pagination`, `Component`, `DemoCard`, `Comparison`, `Game` e `ReferencePerformance`: **100%** de linhas · `Offer` 97,8% · `Upgrade` 98,6% · `Build` 87,0% · `ComponentInput` 88,8% |
| Middlewares | `authMiddleware` e `csrfMiddleware`: **100%** |
| Controllers | `AdminController`, `CartController` e `GameController`: 100% · `OrderController` 98,8% · `ComponentController` 94,3% · `CommunityController` 89,1% · `AuthController` 83,6% · `BuildController` 79,2% · `ReferenceController` 29,1% |
| DAOs (Firestore) | `CommunityDAO` 99,4% · `UserDAO` 73,8% · `ComponentDAO` 60,1% · `ReferenceDAO` 47,4% · `BuildDAO` 33,3% · `MetricsDAO` 33,3% · `GameDAO` 25,5% · `OrderDAO` 17,6% |

**Áreas não cobertas e justificativa**

- **DAOs do Firestore (17–60%)**: são o adaptador para o banco externo. Testá-los exigiria um projeto Firebase com credenciais, ou o emulador do Firestore, que depende de Java e de configuração extra. A estratégia substitui esses DAOs por implementações em memória **com a mesma interface**, então tudo acima deles (rotas, sessão, CSRF, regras, controllers) é exercitado. A lógica de cache e de cota que fica dentro dos DAOs é coberta pelos testes legados com um banco falso (`CommunityDAO` 99%).
- **`ReferenceController` (29%) e `BuildController` (79%)**: geram os relatórios de desempenho e a análise de montagem pela interface do montador. As regras de compatibilidade e de FPS estão nos models (`Build` 87%, `ReferencePerformance` 100%) e nos testes legados; faltam testes de rota para `/builds/:id/performance` e `/systems`.
- **`AuthController` (84%)**: as linhas descobertas são os ramos de login e de vínculo com o Google, que dependem da verificação do token pelo Firebase Auth.
- **`googleAuth.js` (77%), `firebaseConfig.js` (85%) e `sessionConfig.js` (88%)**: ramos que só rodam com credenciais de produção ou com `NODE_ENV=production`.

### 5.2 Front-end — `@vitest/coverage-v8` (módulos com testes unitários)

| Módulo | Linhas | Ramos | Funções |
| --- | ---: | ---: | ---: |
| `src/data/offers.js` | 100% | 100% | 100% |
| `src/data/componentSelection.js` | 97,1% | 89,7% | 100% |
| `src/components/ProductCatalog.jsx` | 96,4% | 85,3% | 92,9% |
| `src/components/AddToCartButton.jsx` | 100% | 84,6% | 66,7% |
| `src/api/client.js` | 73,9% | 69,4% | 72,7% |
| `src/components/ProductPrice.jsx` | 22,2% | 15,0% | 16,7% |
| **Total medido** | **81,6%** | **74,6%** | **78,3%** |

**Justificativa**: a cobertura unitária do front-end foi medida só nos módulos com lógica de regra (preço, busca, seleção e cliente HTTP). Páginas e componentes visuais (montador, combate, ranking, 3D) são verificados pelos 34 testes Cypress, que não geram cobertura de código. `ProductPrice.jsx` aparece baixo porque só o `CardPrice` é usado pelo catálogo; `ProductPriceSummary` e `StoreOffers` são exercitados pelo Cypress (CT-E2E-09 e 10). Em `client.js`, falta cobrir `listRecords`, usado nas telas de histórico (coberto pelo fluxo completo).

Relatórios navegáveis: `reports/coverage/frontend/index.html` e `reports/coverage/backend/lcov.info` (gerados pela regressão e publicados como artefato da CI).

## 6. Itens de bônus

| Bônus | Evidência |
| --- | --- |
| Relatório de cobertura com análise | §5 deste documento + `reports/coverage/` |
| Automação de um fluxo completo FE + BE | `frontend/cypress/fullstack/fluxo-completo.cy.js` (4 fluxos, sem mocks) + `backend/scripts/e2eServer.js` |
| Execução em CI | `.github/workflows/testes.yml`: regressão completa a cada push e PR |
| Integração com ferramenta de relatório | JUnit publicado na aba *Checks* do GitHub (`dorny/test-reporter`), resumo no *Job Summary* e `reports/relatorio-regressao.md` gerado a partir dos XMLs |

## 7. Conclusão

A aplicação atende aos critérios de aceite dos requisitos avaliados. Os testes encontraram **quatro defeitos reais**: três no front-end (um de acessibilidade, de severidade média) e um de valor limite no back-end. Todos foram corrigidos e agora estão protegidos por casos de regressão. As regras de segurança mais sensíveis — CSRF, perfis de acesso, mensagem de login que não revela contas, isolamento de pedidos e erros sem detalhes internos — passaram em todos os cenários, inclusive nos de erro. A principal limitação é não exercitar o Firestore e o login com Google reais. Ela foi mitigada com DAOs em memória de mesma interface e com a trava que impede rodar o fluxo completo contra o banco real.
