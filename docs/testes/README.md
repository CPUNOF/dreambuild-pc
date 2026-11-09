# Plano de testes — DreamBuild PC (VV&TS)

Documentação do trabalho semestral de **Verificação, Validação e Teste de Software** sobre o Projeto Web Final (Programação para Web Avançada).

| Documento | Conteúdo |
| --- | --- |
| **Este arquivo** | Objetivo, escopo, estratégia, técnicas, ambiente, critérios de entrada e saída, limitações e como executar |
| [Casos de teste](casos-de-teste.md) | Especificação de cada caso: identificação, funcionalidade, pré-condições, dados, passos, resultado esperado, resultado obtido e status |
| [Rastreabilidade](rastreabilidade.md) | Matriz requisito → casos de teste |
| [Defeitos](defeitos.md) | Defeitos encontrados, evidências e situação após a correção |
| [Relatório de execução](relatorio-execucao.md) | Rodadas executadas, quantidades, cobertura de código e análise |
| [Relatório da última regressão](../../reports/relatorio-regressao.md) | Gerado automaticamente: lista cada caso executado e o resultado |

## 1. Objetivo

Verificar se o DreamBuild PC atende às regras de negócio e de segurança implementadas (autenticação, perfis de acesso, catálogo, carrinho, compra simulada e administração) e validar os fluxos principais do ponto de vista de quem usa a loja. Para isso, o trabalho combina testes automatizados em vários níveis, registro de defeitos e uma bateria de regressão que pode ser repetida.

## 2. Escopo

### 2.1 Funcionalidades avaliadas

| ID | Funcionalidade | Níveis aplicados |
| --- | --- | --- |
| RF01 | Cadastro, login, logout e sessão | Unitário, API, E2E, fluxo completo |
| RF02 | Controle de acesso por perfil (visitante, CLIENT, ADMIN) | API (tabela de decisão), E2E, fluxo completo |
| RF03 | Catálogo público: listagem, paginação, categoria e detalhe | Unitário, API, E2E |
| RF04 | Busca, filtros e ordenação da vitrine | Unitário (componente), E2E |
| RF05 | Página de produto (ficha, ofertas, 404) | E2E |
| RF06 | Carrinho: adicionar, alterar quantidade, remover e limites | Unitário, API, E2E, fluxo completo |
| RF07 | Compra simulada do carrinho (cartão fictício, cotação, idempotência) | Integração, fluxo completo |
| RF08 | Histórico de pedidos, separado por dono | Integração, fluxo completo |
| RF09 | CRUD administrativo de produtos | Unitário (validação), API |
| RF10 | CRUD administrativo de cenários de jogos | Unitário, API |
| RF11 | Robustez e segurança da API (CSRF, limite de tentativas, envelope JSON, erros sem detalhes internos, CORS) | API |
| RF12 | Ofertas e preços (melhor oferta, validação de ofertas do admin) | Unitário |
| RF13 | Interface e acessibilidade (título da página, foco, tema, erros, movimento reduzido) | E2E, componente |
| RF18 | Documentação da API (Swagger/OpenAPI) | Contrato automatizado |
| RF14 | Montador e compatibilidade | Unitário, componente, E2E, suíte do projeto |
| RF15 | Ranking, galeria e publicação na comunidade | Componente, suíte do projeto |
| RF16 | Telemetria em tempo real (WebSocket) | Suíte do projeto |
| RF19 | Estoque próprio administrado pela loja | Integração (HTTP real) |
| RF20 | Endereço de entrega e frete | Integração, componente, fluxo completo |
| RF21 | Combate de desempenho | Componente, suíte do projeto |

### 2.2 Fora do escopo

- **Firestore real** e **login com Google (Firebase Auth)**: dependem de credenciais e de um projeto externo. Ver as [limitações](#8-limitações).
- Desempenho sob carga, compatibilidade entre navegadores e testes visuais por comparação de imagens.
- Conteúdo dos dados de catálogo (preços e fichas), que é conferido nas fontes indicadas em [`docs/consultas-precos.md`](../consultas-precos.md).

## 3. Estratégia

Pirâmide de testes: muitos testes rápidos e isolados na base e poucos fluxos completos no topo.

```
                ┌───────────────────────────────┐
                │ Fluxo completo FE + BE (4)    │  Cypress → Vite → Express real
                ├───────────────────────────────┤
                │ E2E com API simulada (35)     │  Cypress + cy.intercept
                ├───────────────────────────────┤
                │ API e integração (92 + 37)    │  HTTP real no Express; DAOs em memória
                ├───────────────────────────────┤
                │ Unitários (80 + 48)           │  models e regras puras do front
                └───────────────────────────────┘
        + 105 testes da suíte do projeto (77 da linha de base), executados em toda regressão
```

| Nível | Ferramenta | O que é exercitado | Onde |
| --- | --- | --- | --- |
| Unitário (back-end) | `node:test` | `User`, `Cart`, `Offer`, `Pagination`, `Game` isolados | `backend/test/unit/`, `backend/test/api/games.api.test.js` |
| Unitário (front-end) | Vitest | `offers.js`, `componentSelection.js`, `api/client.js` (com `fetch` simulado) | `frontend/test/*.test.js` |
| Integração (front-end) | Vitest + Testing Library | `ProductCatalog` + `ProductTile` + `CardPrice` + `AddToCartButton` renderizados juntos; bancada, Combate, revisão da compra, carrinho, busca com sugestões e galeria (CT-INT-09 a 16) | `frontend/test/*.test.jsx` |
| API REST | `node:test` + `fetch` | Requisições HTTP reais ao Express: status, envelope, dados e erros | `backend/test/api/` |
| Contrato da documentação | `node:test` + swagger-parser | Swagger válido, igual às rotas reais e com os códigos de status que a API devolve | `backend/test/api/openapi.contract.test.js` |
| Integração (back-end) | `node:test` | Rotas → middlewares → controllers → models → DAO, incluindo sessão e CSRF | `backend/test/integration/` |
| Funcional caixa-preta (E2E) | Cypress | Telas e fluxos com a API simulada (respostas determinísticas, cenários de erro) | `frontend/cypress/e2e/` |
| Fluxo completo | Cypress | Navegador → Vite → API Express real, sem nenhum mock | `frontend/cypress/fullstack/` |
| Regressão | `scripts/regressao.mjs` | Todas as suítes acima + JUnit + cobertura + relatório | `reports/` |

**Por que DAOs em memória?** O back-end recebe os DAOs por injeção (`createApp({ userDAO, componentDAO, ... })`). `backend/test/support/memory.js` implementa a **mesma interface** dos DAOs do Firestore, inclusive o formato de armazenamento (`specifications` como `{label, value}`). Assim os testes de API, de integração e de fluxo completo exercitam Express, middlewares, sessão, CSRF, controllers e models **reais**, com dados previsíveis e sem credenciais. O catálogo de teste vem do snapshot real `backend/data/publicCatalogSnapshot.json`.

## 4. Técnicas de teste

| Técnica | Onde foi aplicada (exemplos) |
| --- | --- |
| **Partição de equivalência** | E-mail válido / sem `@` / sem domínio / com espaço; quantidade inteira / negativa / fracionária / texto; perfis visitante, CLIENT e ADMIN |
| **Análise de valor limite** | Nome 1/2/80/81; senha 7/8/128/129; e-mail 254/255; quantidade 0/1/10/11; até 30/31 modelos no carrinho; `limit` 0/1/100/101; ofertas 9/10; preço 0/1/10⁹/10⁹+1; peso do jogo 0,09/0,1/10/10,01; título 1/2/120/121; potência da fonte 599/600; comprimento 180/181 mm; cache de 5 min |
| **Tabela de decisão** | Controle de acesso (perfil × tipo de rota → 200/401/403), elegibilidade de oferta (disponibilidade × pagamento × preço), adequação da fonte (potência × conectores × gabinete) |
| **Teste de transição de estado** | Sessão: visitante → logado → logout → visitante; carrinho antes e depois do login; pedido repetido com a mesma chave (idempotência) |
| **Cenários de erro** | 400, 401, 403, 404, 409, 413, 429, 503, resposta não JSON, cursor repetido, CSRF inválido |
| **Teste exploratório dirigido** | Leitura do código com olhar de valor limite e de interação com o usuário, de onde vieram DEF-01 a DEF-04 |

## 5. Ambiente

| Item | Versão / configuração |
| --- | --- |
| Sistema | Windows 11 (local) e Ubuntu (GitHub Actions) |
| Node.js | 24.x (`engines` do projeto) |
| Back-end | Express 5, express-session (MemoryStore nos testes), Socket.IO |
| Front-end | React 19, React Router, Vite 7 |
| Ferramentas de teste | `node:test` (nativo), Vitest 5 + jsdom + Testing Library, Cypress 15 (Electron headless) |
| Cobertura | `--experimental-test-coverage` do Node (lcov) e `@vitest/coverage-v8` (html, lcov) |
| Dados | Snapshot real do catálogo; usuários de teste criados em memória (`cliente@`, `admin@` e `desativada@dreambuild.test`) |
| CI | `.github/workflows/testes.yml`: regressão completa a cada push/PR, relatório JUnit na aba *Checks* e artefatos |

## 6. Critérios de entrada

- Dependências instaladas (`npm install`) e binário do Cypress instalado (`npx --workspace frontend cypress install`). O `.npmrc` usa `ignore-scripts=true`, então isso não acontece sozinho.
- A suíte legada do back-end passando (linha de base: 77/77).
- Porta 5173 livre ou com o Vite do projeto (é reaproveitado). Porta 3001 livre ou com o **servidor E2E em memória**: os scripts se recusam a rodar o fluxo completo contra o `npm run dev`, que é ligado ao Firestore.

## 7. Critérios de saída

- 100% dos casos executados na regressão final, com 0 reprovados.
- Todo defeito encontrado registrado em [defeitos.md](defeitos.md) com evidência, corrigido e coberto por um teste de regressão, ou justificado.
- Cobertura de linhas do back-end ≥ 80% (obtido: 90,68% na R7; 89,52% na R6), com análise das áreas descobertas.
- Relatório de regressão gerado (`reports/relatorio-regressao.md`) e execução na CI.

## 8. Limitações

| Limitação | Motivo | Mitigação |
| --- | --- | --- |
| DAOs do Firestore (`OrderDAO`, `BuildDAO`, `GameDAO`, parte de `ComponentDAO` e `UserDAO`) não são exercitados contra o banco real | Exigem credenciais e um projeto Firebase; rodar testes ali criaria dados reais e consumiria a cota | DAOs em memória com a mesma interface; os testes legados `optimization`, `community` e `sessionDAO` cobrem a lógica com um banco falso; trava `X-DreamBuild-E2E` |
| Login com Google não automatizado | Popup OAuth de terceiros não é automatizável com segurança e exige conta real | Regras de vínculo cobertas por `references.test.js` (12 casos); botão testado como desabilitado quando o provedor está desligado |
| Animações, som e modelo 3D (Three.js) | Saída visual e sonora sem critério objetivo automatizável | Verificação manual durante a demonstração |
| Montador de PC, Combate e Ranking pela interface | Telas extensas; só parte delas é exercitada no navegador real (CT-E2E-35) | Testes de componente da bancada, do Combate e da galeria (CT-INT-09 a 11 e 14) e regras cobertas em `assembly-workflow`, `build*`, `community` e `upgrade` |
| Testes do navegador só em Electron | O Cypress usa Electron por padrão; não houve matriz Chrome/Firefox/Safari | Dá para estender com `--browser` na CI |

## 9. Como executar

```bash
npm install
npx --workspace frontend cypress install   # uma vez (por causa do ignore-scripts)

npm test                 # back-end (node:test) + front-end (Vitest)
npm run test:coverage    # o mesmo, com cobertura
npm run test:e2e         # Cypress com API simulada (sobe o Vite se não estiver ativo)
npm run test:e2e:full    # fluxo completo (sobe a API E2E em memória e o Vite, se preciso)
npm run test:regressao   # TUDO + JUnit + cobertura + reports/relatorio-regressao.md
```

Por camada:

```bash
npm run test:unit --workspace backend      # unitários do back-end
npm run test:api  --workspace backend      # API REST + integração
npm run cy:open   --workspace frontend     # Cypress interativo (Vite já rodando)
npm run cy:open:full --workspace frontend  # fluxo completo no modo interativo
```

Saídas: `reports/junit/*.xml` (JUnit), `reports/coverage/backend/lcov.info`, `reports/coverage/frontend/index.html` e `reports/relatorio-regressao.md`. Na CI tudo fica disponível como artefato `relatorios-de-teste`.
