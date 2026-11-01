# Especificação dos casos de teste

Cada caso tem um identificador `CT-<nível>-<nº>` que aparece **no nome do teste automatizado**, então o resultado de cada um pode ser localizado nos relatórios JUnit e em [`reports/relatorio-regressao.md`](../../reports/relatorio-regressao.md). Casos com várias entradas (valor limite, partição, tabela de decisão) listam os dados em tabela; cada linha da tabela é um teste automatizado separado.

**Resultado obtido / status** referem-se à regressão final (31/10/2026, 343/343 aprovados). Quando a primeira execução revelou um defeito, isso aparece em *Histórico*.

Prefixos: `UNI` unitário · `INT` integração · `API` API REST · `FUN` funcional caixa-preta · `E2E` interface com API simulada · `E2E-FULL` fluxo completo sem mocks.

---

## 1. Testes unitários — back-end (`node:test`)

### CT-UNI-01 — Nome no cadastro
| Campo | Descrição |
| --- | --- |
| Funcionalidade | RF01 Cadastro (`User.registration`) |
| Objetivo | Aceitar nomes de 2 a 80 caracteres após remover os espaços das pontas |
| Técnica | Valor limite + partição de equivalência |
| Pré-condições | Nenhuma (função pura) |
| Passos | Chamar `User.registration({ ...válido, name })` para cada entrada |
| Arquivo | `backend/test/unit/user.unit.test.js` |

| Entrada `name` | Classe | Esperado | Obtido | Status |
| --- | --- | --- | --- | --- |
| `""` | inválida | 400 "nome" | 400 | Aprovado |
| `"A"` (1) | limite − 1 | 400 | 400 | Aprovado |
| `"Al"` (2) | limite inferior | aceito | aceito | Aprovado |
| 80 caracteres | limite superior | aceito | aceito | Aprovado |
| 81 caracteres | limite + 1 | 400 | 400 | Aprovado |
| `"     "` | só espaços | 400 | 400 | Aprovado |
| `"  Al  "` | com espaços nas pontas | aceito como `"Al"` | `"Al"` | Aprovado |
| `12345` | tipo inválido | 400 | 400 | Aprovado |

### CT-UNI-02 — E-mail no cadastro
| Campo | Descrição |
| --- | --- |
| Funcionalidade / Técnica | RF01 · PE + VL (máx. 254) |
| Dados | válido; sem `@`; sem domínio de topo; com espaço; 254 caracteres; 255 caracteres; `null`; `"  ANA@DreamBuild.TEST "` |
| Resultado esperado | Válidos e 254 aceitos; demais 400; e-mail normalizado para `ana@dreambuild.test` |
| Resultado obtido / Status | Conforme esperado · **Aprovado** (8 testes) |

### CT-UNI-03 — Senha
| Campo | Descrição |
| --- | --- |
| Funcionalidade / Técnica | RF01 · VL 8..128 + PE |
| Dados | 7, 8, 128 e 129 caracteres; número; ausente; corpo com `role: "ADMIN"` |
| Resultado esperado | 8 e 128 aceitos; 7, 129, número e ausente → 400; o campo `role` é descartado |
| Resultado obtido / Status | Conforme esperado · **Aprovado** (7 testes) |

### CT-UNI-04 — Hash de senha e dados públicos
| Campo | Descrição |
| --- | --- |
| Objetivo | `scrypt` com salt aleatório; verificação só com a senha correta; `User.public` não expõe `passwordHash` nem `googleUid` |
| Dados | mesma senha com dois hashes; senha errada; hashes malformados (`undefined`, `""`, `scrypt:abc:def`, `md5:…`) |
| Resultado esperado | Hashes diferentes; `verify` verdadeiro só para a senha correta; malformados sempre falsos |
| Resultado obtido / Status | Conforme esperado · **Aprovado** (3 testes) |

### CT-UNI-05 — Linhas do carrinho (`Cart.lines`)
| Campo | Descrição |
| --- | --- |
| Funcionalidade / Técnica | RF06 · VL + PE |
| Arquivo | `backend/test/unit/cart-offer-pagination.unit.test.js` |

| Entrada | Esperado | Status |
| --- | --- | --- |
| quantidade 0 / 1 / 10 / 11 | 400 / aceito / aceito / 400 | Aprovado |
| quantidade −1, 1,5, `"2"` | 400 | Aprovado |
| 30 modelos / 31 modelos | aceito / 400 | Aprovado |
| lista que não é array; modelo repetido | 400 | Aprovado |
| ID com 128 / 129 caracteres; `../admin`; vazio | aceito / 400 / 400 / 400 | Aprovado |
| linhas fora de ordem com campo extra | ordenadas, só `componentId` e `quantity` | Aprovado |

### CT-UNI-06 — Elegibilidade de oferta (tabela de decisão)
Regra: **elegível ⇔ disponível ∧ forma de pagamento pedida ∧ preço inteiro > 0**.

| Disponibilidade | Pagamento | Preço | Esperado | Status |
| --- | --- | --- | --- | --- |
| in_stock | pix | 1000 | ✔ elegível | Aprovado |
| out_of_stock | pix | 1000 | ✘ | Aprovado |
| unknown | pix | 1000 | ✘ | Aprovado |
| in_stock | card | 1000 | ✘ (pedido PIX) | Aprovado |
| in_stock | pix | 0 / −5 / 10,5 / null | ✘ | Aprovado |
| oferta ausente | — | — | ✘ | Aprovado |
| in_stock | card (pedido card) | 1000 | ✔ | Aprovado |

### CT-UNI-07 — Validação de ofertas do administrador (`Offer.parseMany`)
| Campo | Descrição |
| --- | --- |
| Técnica | VL (9/10 ofertas; preço 0/1/10⁹/10⁹+1) + PE (loja, URL, data) |
| Dados rejeitados (400) | 10 ofertas; duplicidade loja+pagamento; loja desconhecida; URL de outra loja; URL sem HTTPS; URL com usuário e senha; data futura; data anterior a 2000; preço 0; preço > 10⁹; em estoque sem preço |
| Dados aceitos | 9 ofertas; preço 1; preço 10⁹; sem estoque e sem preço; subdomínio da loja |
| Resultado obtido / Status | Conforme esperado · **Aprovado** (16 testes) |

### CT-UNI-08 — Paginação (`pagination`)
| Dados | Esperado | Status |
| --- | --- | --- |
| sem parâmetros | `limit = 20` | Aprovado |
| `limit` "0" / "1" / "100" / "101" | 400 / ok / ok / 400 | Aprovado |
| `limit` "abc", "−1", repetido (array) | 400 | Aprovado |
| cursor válido / com `/` / com 129 caracteres | ok / 400 / 400 | Aprovado |

### CT-UNI-13 — Cenário de jogo (`Game.parse`)
| Campo | Descrição |
| --- | --- |
| Funcionalidade / Técnica | RF10 · VL + PE |
| Arquivo | `backend/test/api/games.api.test.js` |
| Dados | título 1/2/120/121 caracteres; **120 caracteres + espaço no fim**; peso 0,09/0,1/10/10,01/NaN/"1"; id com maiúscula, com 100 e 101 caracteres; imagem com `..`; imagem HTTP; fonte sem HTTPS |
| Resultado esperado | Limites válidos aceitos, demais 400; título normalizado; `calibrated` sempre `false` |
| Resultado obtido / Status | Conforme esperado · **Aprovado** (18 testes) |
| Histórico | 1ª execução: **reprovado** no caso "120 + espaço" → [DEF-04](defeitos.md#def-04) |

## 2. Testes unitários — front-end (Vitest)

### CT-UNI-09 — Melhor oferta, disponibilidade e formatação (`offers.js`)
| Campo | Descrição |
| --- | --- |
| Objetivo | Escolher a menor oferta elegível; rótulo de disponibilidade; formatação em reais |
| Dados | ofertas de 3 lojas com estoque e pagamento variados; listas vazias; preços nulo, zero e fracionário; 39999, 151996 e 1 centavo |
| Resultado esperado | Pichau (R$ 450,00) como melhor PIX; `null` sem oferta elegível; "R$ 399,99", "R$ 1.519,96", "R$ 0,01" |
| Arquivo / Status | `frontend/test/offers.test.js` · **Aprovado** (13 testes) |

### CT-UNI-10 — Seletor de peças (`componentSelection.js`)
| Campo | Descrição |
| --- | --- |
| Técnica | PE (plataforma por categoria) + **tabela de decisão** da fonte (potência × conectores × gabinete) com VL 599/600 W e 180/181 mm |
| Resultado esperado | 13 partições classificadas corretamente; fonte `fail` abaixo da potência, sem conector da GPU ou maior que o gabinete; `unknown` quando falta dado; `pass` nos limites exatos |
| Arquivo / Status | `frontend/test/offers.test.js` · **Aprovado** (22 testes) |

### CT-UNI-11 — Carregamento do catálogo (`getCatalog`)
| Campo | Descrição |
| --- | --- |
| Pré-condições | `fetch` simulado com `vi.spyOn`; `sessionStorage` limpo |
| Passos / dados | 2 páginas com cursor; 2 chamadas seguidas; `force: true`; relógio em exatamente 5 min; `meta.source = curated-local`; cursor repetido; HTTP 503; `data` que não é lista; `meta` ausente |
| Resultado esperado | Segue os cursores e ordena por `displayOrder`; usa o cache; ignora o cache com `force` e quando ele tem 5 min; marca `localSnapshot`; interrompe laço infinito; rejeita respostas inválidas |
| Arquivo / Status | `frontend/test/client.test.js` · **Aprovado** (8 testes) |

### CT-UNI-12 — Requisições à API (`apiRequest`, `getHealth`)
| Campo | Descrição |
| --- | --- |
| Resultado esperado | Mutação busca `/auth/session` antes e envia `X-CSRF-Token`; `CSRF_INVALID` renova o token e repete **uma** vez; erro vira `ApiError {status, message, errors}`; resposta HTML vira mensagem amigável; health de outro serviço é rejeitado |
| Arquivo / Status | `frontend/test/client.test.js` · **Aprovado** (5 testes) |

## 3. Testes de API REST (`node:test` + HTTP real)

Pré-condição comum: `startServer()` sobe o Express real em porta aleatória com DAOs em memória e 3 usuários (`cliente@`, `admin@` e `desativada@dreambuild.test`, senha `senha-de-teste-123`). Cada cliente HTTP mantém o próprio cookie e o próprio token CSRF.

| ID | Endpoint / objetivo | Dados e passos | Resultado esperado | Obtido | Status |
| --- | --- | --- | --- | --- | --- |
| CT-API-01 | `GET /api/auth/session` | visitante | 200, envelope `{status,message,data,errors,meta}`, `user: null`, token CSRF, cookie HttpOnly, `Cache-Control: no-store` | igual | Aprovado |
| CT-API-02 | `POST /api/auth/register` | válido com `role: ADMIN`; e-mail repetido em maiúsculas; nome 1 caractere; e-mail inválido; senha com 7; sem CSRF | 201 como CLIENT e sem hash; 409; 400; 400; 400; 403 `CSRF_INVALID` sem gravar | igual | Aprovado (6) |
| CT-API-03 | `POST /api/auth/login` | válido; e-mail com maiúsculas e espaços; senha errada; e-mail inexistente; conta desativada; corpo vazio; senha vazia; senha com 129; e-mail numérico | 200 e cookie renovado; 200; **mesmo 401 "E-mail ou senha incorretos."** nos 3 casos (não revela se a conta existe); 400 | igual | Aprovado (9) |
| CT-API-04 | Limite de tentativas | 11 logins errados com `authLimit: 10` | 10 × 401, depois 429 | igual | Aprovado |
| CT-API-05 | `POST /api/auth/logout` | logar, acessar `/orders/my`, sair, acessar de novo | 200 → 200 → 401 | igual | Aprovado |
| CT-API-06 | Tabela de decisão de acesso | ver [CT-FUN-01](#ct-fun-01) | — | — | Aprovado (13) |
| CT-API-07 | `GET /api/components` | `limit=100`; páginas de 2 com cursor; `category=CPU`; `limit` 0/101/abc; cursor `a/b`; categoria inválida e vazia; DAO lançando erro interno | 200 com `meta`; percorre os 5 itens sem repetir; só CPUs; 400; **503 sem texto interno** | igual | Aprovado (10) |
| CT-API-08 | `GET /api/components/:id` | existente; inexistente; `a.b` | 200 com ficha; 404; 400 | igual | Aprovado (3) |
| CT-API-09 | CRUD `/api/admin/components` | cadastrar → consultar → alterar → remover → consultar; duplicado; incompleto; troca de slug; inexistente; oferta com preço negativo | 201 → 200 → 200 → 200 → 404; 409; 400; 400; 404; 400 | igual | Aprovado (4) |
| CT-API-10 | Admin bloqueado | visitante, cliente, admin sem CSRF | 401; 403; 403 — nada gravado nem removido | igual | Aprovado (2) |
| CT-API-11 | `/api/cart` | visitante; PUT 2 + PUT 1; DELETE; quantidades 0/11/1,5/"3"; produto inexistente; sem oferta; sem CSRF | vazio; total = Σ linhas; 400; 404; 409; 403 | igual | Aprovado (8) |
| CT-API-12 | CRUD `/api/admin/games` | admin cadastra, lista, altera, troca id, peso 11, duplica, remove duas vezes; cliente; visitante; `limit=0` | 201, 200, 200, 400, 400, 409, 200, 404; 403; 401; 400 | igual | Aprovado (3) |

| CT-API-13 | Especificação Swagger válida | `SwaggerParser.validate`; summary, tag, operationId único e 500 em toda operação; 401 nas autenticadas, 403 nas alterações | OpenAPI 3.0.3 válida | igual | Aprovado (3) · 1ª verificação **reprovada** → [DEF-07](defeitos.md#def-07) |
| CT-API-14 | Documentação = rotas reais | comparar `app.router.stack` com `openapi.paths` | nenhuma rota sem documentação e nenhuma operação inexistente (45 = 45) | igual | Aprovado |
| CT-API-15 | Documentação servida | `GET /openapi.json`; `docs/api/openapi.json`; `GET /api-docs/` | JSON idêntico à fonte; arquivo exportado atualizado; HTML do Swagger UI | igual | Aprovado (3) |
| CT-API-16 | Contrato de status | 48 chamadas reais (visitante, cliente, admin; sucesso e erro) | cada status devolvido está documentado na operação; envelope `{status,message,data,errors,meta}` coerente | igual | Aprovado |

<a id="ct-fun-01"></a>
### CT-FUN-01 — Tabela de decisão: controle de acesso (caixa-preta)

Condições: **perfil** × **tipo de rota**. Ações: permitir (200), 401 (não autenticado) ou 403 (sem permissão). Arquivo: `backend/test/api/auth-access.api.test.js`.

| Regra | Perfil | Pública `GET /components` | Privada `GET /orders/my`, `/builds/my` | Admin `GET /admin/metrics` |
| --- | --- | --- | --- | --- |
| R1 | Visitante | 200 ✔ | 401 ✔ | 401 ✔ |
| R2 | CLIENT | 200 ✔ | 200 ✔ | 403 ✔ |
| R3 | ADMIN | 200 ✔ | 200 ✔ | 200 ✔ |
| R4 | CLIENT desativado depois do login | — | 401 ✔ | — |

Todos os 13 casos foram **aprovados**. A mesma regra também é validada pela interface em CT-E2E-27, 29 e 30 e em CT-E2E-FULL-04.

## 4. Testes de integração

| ID | Integração verificada | Pré-condições / passos | Resultado esperado | Status |
| --- | --- | --- | --- | --- |
| CT-INT-01 | Sessão ↔ autenticação ↔ carrinho | visitante adiciona GPU → faz login | carrinho mantém a GPU depois de a sessão ser regenerada | Aprovado |
| CT-INT-02 | Carrinho → `Cart.summarize` → `DemoCard` → `OrderController` → `OrderDAO` → histórico | logar; CPU×1 + RAM×2; gerar cartão; `checkout-cart`; consultar `/orders/my` e `/orders/:id`; repetir com a mesma chave | 201 com total igual ao carrinho; número do cartão não aparece no pedido; pedido no histórico; carrinho vazio; repetição → 200 com o **mesmo** pedido, sem duplicar | Aprovado |
| CT-INT-03 | Validações cruzadas do checkout | sem cartão; quantidade diferente da sessão; cotação antiga; CVV alterado; visitante | 400; 409; 409; 400; 401 | Aprovado (2) |
| CT-INT-04 | Isolamento por dono | cliente compra; admin consulta o pedido do cliente | 404 e o pedido não aparece na lista do admin | Aprovado |
| CT-INT-05 | Componentes React juntos (Vitest + Testing Library) | `ProductCatalog` com 5 produtos reais e carrinho simulado | contagem, preço, busca sem acento, busca "nvidia", categoria, estado vazio, ordenação, "somente disponíveis", botão do carrinho, paginação de 24 em 24; **DEF-01** (busca só com símbolos) | Aprovado (12) |

Histórico do CT-INT-05: na 1ª execução, os 3 casos de DEF-01 foram **reprovados** → [DEF-01](defeitos.md#def-01).

## 5. Testes funcionais pela interface — Cypress com API simulada

Pré-condições comuns: Vite rodando em `127.0.0.1:5173`; `cy.mockApi()` responde às rotas `/api/**` no mesmo formato do back-end, usando `cypress/fixtures/catalog.json` (5 produtos reais, 1 sem oferta). Rotas não previstas respondem 404 em vez de chegar ao servidor real.

| ID | Funcionalidade | Passos principais | Resultado esperado | Status |
| --- | --- | --- | --- | --- |
| CT-E2E-01 | RF03 Vitrine | abrir `/` | título da aba, 5 cards, "5 modelos encontrados", "Serviço conectado" | Aprovado |
| CT-E2E-02 | RF04 Busca | digitar "ryzen" | 2 resultados, todos com "Ryzen" | Aprovado |
| CT-E2E-03 | RF04 Estado vazio | buscar termo inexistente → "Limpar filtros" | mensagem de vazio; busca limpa; 5 cards | Aprovado |
| CT-E2E-04 | RF04 Departamento | "Placas de vídeo" | botão `aria-pressed`, 1 resultado (RTX 5060) | Aprovado |
| CT-E2E-05 | RF04 Disponíveis | marcar "Somente disponíveis" | 4 resultados, sem o 9800X3D | Aprovado |
| CT-E2E-06 | RF04/RF12 Ordenação | menor e maior preço | SSD primeiro; RTX primeiro; sem oferta por último | Aprovado |
| CT-E2E-07 | RF03 Erro | catálogo 503 → "Tentar novamente" com sucesso | alerta "Catálogo indisponível"; depois 5 cards | Aprovado |
| CT-E2E-08 | RF13 Tema | alternar tema | `data-theme` muda e fica salvo no `localStorage` | Aprovado |
| CT-E2E-09 | RF05 Produto | clicar num card | URL, título, destaques, R$ 399,99, ficha, KaBuM!, link do montador | Aprovado |
| CT-E2E-10 | RF05/RF06 | abrir produto sem oferta | botão "Indisponível para compra" desabilitado | Aprovado |
| CT-E2E-11 | RF05 | trilha → categoria | volta à vitrine filtrada | Aprovado |
| CT-E2E-12 | RF05 404 | `/produto/nao-existe` | "404 · Produto não encontrado"; voltar | Aprovado |
| CT-E2E-13 | RF13 **DEF-02** | `/ranking/montagem-exemplo` | título "Montagem da comunidade \| DreamBuild PC" | Aprovado · 1ª execução **reprovada** → [DEF-02](defeitos.md#def-02) |
| CT-E2E-14 | RF13 404 | rota desconhecida | h1 e título de página não encontrada | Aprovado |
| CT-E2E-15 | RF06 | `/carrinho` vazio | mensagem; contador 0 | Aprovado |
| CT-E2E-16 | RF06 | adicionar pela vitrine → "Ver carrinho" | `PUT {quantity:1}`; aviso; contador 1; total R$ 399,99 | Aprovado |
| CT-E2E-17 | RF06 | produto sem oferta na vitrine | botão desabilitado | Aprovado |
| CT-E2E-18 | RF06 VL | + / − / remover | (3) → (4) e total R$ 1.519,96 → (3) → `DELETE` | Aprovado |
| CT-E2E-19 | RF06/RF07 | carrinho com item indisponível | "Cotação parcial"; checkout bloqueado | Aprovado |
| CT-E2E-20 | RF02 | visitante → "Continuar para revisão" | redireciona para `/entrar` | Aprovado |
| CT-E2E-21 | RF06 erro | servidor responde 400 | aviso de erro com a mensagem; fechar | Aprovado |
| CT-E2E-22 | RF01 | login válido | CSRF enviado; corpo correto; `/conta` "Olá, Cliente Teste." | Aprovado |
| CT-E2E-23 | RF01 | senha errada | "E-mail ou senha incorretos."; continua em `/entrar` | Aprovado |
| CT-E2E-24 | RF13 **DEF-03** | catálogo atrasado 1,5 s; digitar no campo Nome | o foco continua no campo; texto completo | Aprovado · 1ª execução **reprovada** → [DEF-03](defeitos.md#def-03) |
| CT-E2E-25 | RF01 | enviar o formulário vazio | `:invalid` no e-mail; nenhuma chamada de login | Aprovado |
| CT-E2E-26 | RF01 | cadastro | `minlength=8`; corpo correto; "Olá, Maria Silva." | Aprovado |
| CT-E2E-27 | RF02 | `/pedidos` como visitante → login | volta para `/pedidos` com o histórico vazio | Aprovado |
| CT-E2E-28 | RF01 | sair da conta | `/entrar`; cabeçalho mostra "Entrar" | Aprovado |
| CT-E2E-29 | RF02 | cliente em `/admin` | "Acesso restrito"; sem link da documentação da API | Aprovado |
| CT-E2E-30 | RF02 | admin em `/conta` | "Administrar catálogo" e link `/api-docs/` | Aprovado |

## 6. Fluxos completos — Cypress sem mocks

Pré-condições: `backend/scripts/e2eServer.js` (Express real, DAOs em memória, porta 3001) e Vite com proxy `/api`. Trava: o teste só roda se `/api/health` responder com `X-DreamBuild-E2E: memory`. Arquivo: `frontend/cypress/fullstack/fluxo-completo.cy.js`.

| ID | Fluxo | Passos | Resultado esperado | Status |
| --- | --- | --- | --- | --- |
| CT-E2E-FULL-01 | RF01→RF06→RF07→RF08 | cadastrar conta nova → buscar "Adata SU650" → adicionar → +1 no carrinho → revisão → gerar cartão → aceitar → confirmar → "Acompanhar meu pedido" → `/pedidos` | total R$ 719,98; modal "Seu pedido está confirmado!"; contador volta a 0; 1 pedido no histórico | Aprovado |
| CT-E2E-FULL-02 | RF01/RF02 | cadastrar → sair → login com senha errada → login correto → sair → `/pedidos` | 401 exibido; login; redireciona para `/entrar` | Aprovado · falhou antes da correção do DEF-03 |
| CT-E2E-FULL-03 | RF01 | cadastrar e-mail já usado | mensagem do servidor "já possui cadastro" (409) | Aprovado |
| CT-E2E-FULL-04 | RF02 | admin → `/admin`; cliente → `/admin` | admin entra; cliente vê "Acesso restrito" | Aprovado |

## 7. Suíte legada do projeto (regressão)

Os 77 testes que já existiam no repositório rodam em toda regressão, sem alterações. A rastreabilidade por arquivo está em [rastreabilidade.md](rastreabilidade.md#suite-legada). Resultado final: **77/77 aprovados**.
