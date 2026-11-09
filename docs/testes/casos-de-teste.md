# Especificação dos casos de teste

Cada caso tem um identificador `CT-<nível>-<nº>`. Nos casos criados para o trabalho (até 31/10) o identificador aparece **no nome do teste automatizado**. Nos casos que vieram com as entregas de 03 a 05/11 (CT-UNI-14, CT-INT-06 a 16 e CT-E2E-31 a 35), a especificação indica o arquivo e o nome exato de cada teste. Assim, o resultado de qualquer caso pode ser localizado nos relatórios JUnit e em [`reports/relatorio-regressao.md`](../../reports/relatorio-regressao.md). Casos com várias entradas (valor limite, partição, tabela de decisão) listam os dados em tabela; cada linha da tabela é um teste automatizado separado.

**Resultado obtido / status** referem-se à rodada R7 (09/11/2026), executada sobre o commit `3a4c511`: back-end 277/277 e front-end 85/85 aprovados. A situação das suítes Cypress (35 + 4 casos) está no [relatório de execução](relatorio-execucao.md#1-resultado-final). Quando a primeira execução revelou um defeito, isso aparece em *Histórico*.

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

### CT-UNI-14 — Fluxo de montagem e compatibilidade no servidor
| Campo | Descrição |
| --- | --- |
| Funcionalidade / Técnica | RF14 · tabela de decisão (fonte × conectores × gabinete) + PE por plataforma (AM4, AM5, LGA1700) + transição de estado (erro antigo × erro novo) |
| Arquivo | `backend/test/assembly-workflow.test.js` |
| Pré-condições | Catálogo real `backend/data/publicCatalogSnapshot.json` com `withVerifiedHardware`; funções puras `suggestAssembly`, `Build` e `psuFit` |
| Dados / passos | Sugestões automáticas para AM4, AM5 e Intel LGA1700 enviadas à análise do servidor; fonte sem comprimento informado; montagem com erro antigo de RAM e troca de outra categoria; fonte e gabinete incompatíveis na finalização |
| Resultado esperado | Sugestões chegam completas à análise sem remover bloqueios; a fonte é validada por potência e conectores, sem bloqueio por comprimento; o erro antigo de RAM não impede trocar outra peça, mas um erro novo continua bloqueando; fonte e gabinete incompatíveis são rejeitados antes da finalização |
| Resultado obtido / Status | Conforme esperado · **Aprovado** (6 testes) |

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

### 4.1 Casos adicionados com as entregas de 03 a 05/11

Estes casos acompanham as funcionalidades de estoque próprio, endereço e frete, PC completo no carrinho, revisão da compra, Combate e galeria da comunidade. Os do back-end usam o Express real com DAOs em memória (`startServer()` de `backend/test/support/memory.js`) ou o controller diretamente; os do front-end usam Vitest + Testing Library com `fetch` simulado.

| ID | Integração verificada | Arquivo | Pré-condições / passos | Resultado esperado | Status |
| --- | --- | --- | --- | --- | --- |
| CT-INT-06 | Estoque próprio: rotas → `InventoryController` → `Inventory` → `InventoryDAO` → checkout | `backend/test/inventory.test.js` | Admin movimenta e recebe estoque; duas compras simultâneas da última unidade; pedido com item insuficiente ou preço alterado; inventário com versão antiga; cliente e visitante consultam e tentam escrever | Preço vem do estoque DreamBuild, sem presumir saldo de ofertas externas; movimentação valida inteiros, dinheiro, limite, versão e motivo; recebimento idempotente com responsável real; só **uma** das compras da última unidade é aprovada; sem baixa parcial nem recibo; versão antiga não sobrescreve venda; exclusão protege saldo positivo; estoque público sem histórico; escrita exige ADMIN e CSRF; frete adulterado rejeitado | Aprovado (9) |
| CT-INT-07 | Endereço, frete e cartão: `AddressController` → `Delivery` → `UserDAO`; `DemoCard`; checkout | `backend/test/delivery.test.js` | Salvar endereços com campos longos e mais de um padrão; cartão digitado com validade errada e assinatura falsa; outro usuário lê endereços; alteração sem CSRF; repetir pedido com o mesmo frete | Endereço normalizado, campos limitados, um único padrão; cartão exige validade correta e assinatura do emissor fictício; endereços privados e persistidos na conta; alteração sem CSRF → 403; frete calculado no servidor e incluído na tentativa idempotente | Aprovado (4) |
| CT-INT-08 | PC completo no carrinho: `CartController` + catálogo + `hardwareFacts` | `backend/test/cart-build.test.js` | Enviar uma montagem completa; repetir com a mesma chave; montagem incompleta; quantidade acima do limite; saldo insuficiente em uma peça | Todas as peças entram de uma vez e a repetição não duplica; montagem incompleta, quantidade acima do limite ou saldo insuficiente preservam o carrinho inteiro, sem adição parcial | Aprovado (3) |
| CT-INT-09 | Bancada (montador) pela interface | `frontend/test/assembly-experience.test.jsx` | Renderizar a bancada com catálogo e escolhas por etapa | Fonte adequada aparece antes do gabinete; RAM antiga com ficha incompleta não esvazia a lista de GPUs; RAM incompatível com AM4 e socket LGA diferente ficam ocultos, com saída para trocar a plataforma; RAM respeita os 2 slots (VL); cooler incluído reduz as etapas; última etapa oferece carrinho e benchmark | Aprovado (7) |
| CT-INT-10 | Sessão da bancada | `frontend/test/builder-session.test.jsx` | Selecionar peças, sair da bancada e voltar; depois pedir para zerar | Seleção mantida ao voltar; só é zerada quando solicitado (transição de estado) | Aprovado (1) |
| CT-INT-11 | Combate de desempenho | `frontend/test/battle-experience.test.jsx` | Escolher jogo, prioridade e resolução; sem jogos equivalentes; copiar link | Referências do jogo escolhido; sem dados equivalentes não inventa barras nem vencedor; prioridade alterna entre maior FPS e menor preço; link compartilha só seleções públicas | Aprovado (4) |
| CT-INT-12 | Limpar carrinho | `frontend/test/cart-clear.test.jsx` | Clicar em "Limpar carrinho" e confirmar | Exige confirmação, faz **uma** única exclusão e mostra o estado vazio | Aprovado (1) |
| CT-INT-13 | Revisão da compra | `frontend/test/checkout-experience.test.jsx` | Abrir o pagamento; DreamCard expirado; endereço não salvo | Sem campos que o navegador preencha com cartões reais; cartão expirado não pode ser selecionado; endereço não salvo é usado sem gravar no servidor | Aprovado (3) |
| CT-INT-14 | Galeria da comunidade | `frontend/test/community-regression.test.jsx` | Trocar classificação por galeria; publicação sem cobertura | Linha do ranking não é usada como relatório completo; galeria não fica em branco | Aprovado (2) |
| CT-INT-15 | Prévia de jogo (acessibilidade) | `frontend/test/game-preview.test.jsx` | Prévia visível e fora da tela; trocar de jogo; `prefers-reduced-motion` | Inicia sem som quando visível e pausa fora da tela; respeita a pausa ao trocar; com movimento reduzido começa pausada e permite ativar | Aprovado (2) |
| CT-INT-16 | Busca com sugestões locais | `frontend/test/store-search.test.jsx` | Campo vazio; termo com acento; Enter com e sem opção ativa; Escape; termo sem correspondência | Sugestões e atalhos sem rede; preço sem diferenciar acentos; Enter abre a opção ativa ou todos os resultados; Escape fecha e preserva o texto; sem correspondência não lista todo o catálogo (mesma classe do DEF-01) | Aprovado (5) |

## 5. Testes funcionais pela interface — Cypress com API simulada

Pré-condições comuns: Vite rodando em `127.0.0.1:5173`; `cy.mockApi()` responde às rotas `/api/**` no mesmo formato do back-end, usando `cypress/fixtures/catalog.json` (5 produtos reais; 4 com estoque próprio DreamBuild, que define o preço de venda, e 1 sem estoque). Desde 03/11 o mock também responde a `GET /api/inventory`. O status de CT-E2E-01 a 30 e de CT-E2E-FULL-01 a 04 é o da R6 (31/10); a reexecução da R7 está pendente (ver [relatório de execução](relatorio-execucao.md#1-resultado-final)). Rotas não previstas respondem 404 em vez de chegar ao servidor real.

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

Casos adicionados em 03 a 05/11 (`frontend/cypress/e2e/experiencia.cy.js`, bloco "Experiência de compra e montagem"):

| ID | Funcionalidade | Teste (nome no Cypress) | Passos principais | Resultado esperado | Status |
| --- | --- | --- | --- | --- | --- |
| CT-E2E-31 | RF04 Sugestões | sugere produtos ao digitar e abre a opção escolhida pelo teclado | digitar "3200G" → seta para baixo → Enter | lista de sugestões com 1 opção; abre `/produto/kabum-102248` com "Ryzen 3 3200G" | ver [relatório](relatorio-execucao.md#1-resultado-final) |
| CT-E2E-32 | RF04 Teclado | fecha sugestões com Escape e mantém a busca para ver todos os resultados | digitar "ssd" + Escape → Enter | lista fechada, texto preservado; 1 resultado na vitrine | ver relatório |
| CT-E2E-33 | RF06 Carrinho lateral | permite revisar quantidade e remover a peça no carrinho lateral | adicionar pela página do produto → +1 → remover | `PUT {quantity:1}` e `{quantity:2}`; total R$ 799,98; `DELETE`; estado vazio; contador 0 | ver relatório |
| CT-E2E-34 | RF05 Zoom da foto | amplia detalhes do produto e restaura o zoom | abrir a foto → ampliar → restaurar → fechar | 200% → 100%; lightbox fechado | ver relatório |
| CT-E2E-35 | RF14 Compatibilidade | oculta a RAM DDR5 da CPU AM4 e permite trocar de plataforma | `/montar?adicionar=kabum-102248` → etapa Memória RAM | "Nenhuma peça compatível com estes filtros."; "Trocar plataforma" zera o progresso | ver relatório |

## 6. Fluxos completos — Cypress sem mocks

Pré-condições: `backend/scripts/e2eServer.js` (Express real, DAOs em memória, porta 3001) e Vite com proxy `/api`. Trava: o teste só roda se `/api/health` responder com `X-DreamBuild-E2E: memory`. Arquivo: `frontend/cypress/fullstack/fluxo-completo.cy.js`.

| ID | Fluxo | Passos | Resultado esperado | Status |
| --- | --- | --- | --- | --- |
| CT-E2E-FULL-01 | RF01→RF06→RF20→RF07→RF08 | cadastrar conta nova → buscar "Adata SU650" → adicionar → +1 no carrinho → revisão → adicionar endereço (exemplo fictício) → continuar para pagamento → gerar e usar DreamCard → revisar pedido → aceitar a simulação → confirmar → "Acompanhar meu pedido" → `/pedidos` | total do carrinho R$ 719,98; modal "Seu pedido está confirmado!"; contador volta a 0; 1 pedido no histórico | Aprovado |
| CT-E2E-FULL-02 | RF01/RF02 | cadastrar → sair → login com senha errada → login correto → sair → `/pedidos` | 401 exibido; login; redireciona para `/entrar` | Aprovado · falhou antes da correção do DEF-03 |
| CT-E2E-FULL-03 | RF01 | cadastrar e-mail já usado | mensagem do servidor "já possui cadastro" (409) | Aprovado |
| CT-E2E-FULL-04 | RF02 | admin → `/admin`; cliente → `/admin` | admin entra; cliente vê "Acesso restrito" | Aprovado |

## 7. Suíte do projeto (regressão)

São os testes de `backend/test/*.test.js` escritos durante o desenvolvimento da aplicação. Os **77** que existiam em 31/10 (linha de base R0) continuam rodando em toda regressão. Com as entregas de 03 a 05/11, a suíte passou a ter **105** testes:

- 22 em arquivos novos, especificados acima como CT-UNI-14 (`assembly-workflow`, 6), CT-INT-06 (`inventory`, 9), CT-INT-07 (`delivery`, 4) e CT-INT-08 (`cart-build`, 3);
- 6 acrescentados a arquivos existentes: `admin.test.js` (+1, tamanhos de radiador), `community.test.js` (+2: relatório ampliado gravado sem Steam ID; admin retira só as demonstrações, sem tocar em montagens privadas) e `references.test.js` (+3: presets equivalentes entre PC e notebook; GPU com CPU sem índice fica fora do ranking; fonte e CPU de teste acompanham cada resultado).

A rastreabilidade por arquivo está em [rastreabilidade.md](rastreabilidade.md#suite-legada). Resultado na R7: **105/105 aprovados**.
