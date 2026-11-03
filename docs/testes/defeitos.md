# Registro de defeitos

Severidade: **Alta** (impede um fluxo ou expõe dados) · **Média** (fluxo funciona, mas com resultado errado ou prejuízo de uso) · **Baixa** (inconsistência pontual).

| ID | Título | Tipo | Severidade | Situação |
| --- | --- | --- | --- | --- |
| [DEF-01](#def-01) | Busca só com símbolos lista o catálogo inteiro | Aplicação (front-end) | Baixa | ✅ Corrigido e com regressão |
| [DEF-02](#def-02) | Página pública de montagem recebe o título "Página não encontrada" | Aplicação (front-end) | Baixa | ✅ Corrigido e com regressão |
| [DEF-03](#def-03) | O fim do carregamento do catálogo tira o foco do campo em que a pessoa digita | Aplicação (front-end, acessibilidade) | Média | ✅ Corrigido e com regressão |
| [DEF-04](#def-04) | Limite máximo do título do jogo medido antes do `trim` | Aplicação (back-end) | Baixa | ✅ Corrigido e com regressão |
| [DEF-07](#def-07) | Especificação Swagger inválida e com códigos de status genéricos | Documentação da API | Média | ✅ Corrigido e com regressão |
| [DEF-05](#def-05) | `npm run test:e2e` quebra no Windows 11 (`spawn wmic.exe ENOENT`) | Ferramenta de teste | Média | ✅ Corrigido (ferramenta trocada) |
| [DEF-06](#def-06) | Mock do Cypress com mensagem de login diferente da API real | Artefato de teste | Baixa | ✅ Corrigido |

Na primeira rodada também houve falhas causadas **pelos próprios testes**, não pela aplicação. Elas estão no [relatório de execução](relatorio-execucao.md#falhas-que-nao-eram-defeitos).

---

<a id="def-01"></a>
## DEF-01 — Busca só com símbolos lista o catálogo inteiro

| Campo | Descrição |
| --- | --- |
| Componente | `frontend/src/components/ProductCatalog.jsx` |
| Condição de ocorrência | Digitar na busca do cabeçalho um termo formado só por símbolos, como `!!!`, `-` ou `?` |
| Passos | 1. Abrir a loja. 2. Digitar `!!!` na busca. |
| Resultado esperado | "Nenhum modelo encontrado", porque nenhum produto contém o termo |
| Resultado obtido | "5 modelos encontrados para “!!!”", com o catálogo inteiro na tela |
| Causa | `normalize()` remove tudo o que não é `[a-z0-9]`. O termo vira `""`, e `"qualquer texto".includes("")` é sempre verdadeiro |
| Como foi encontrado | Teste exploratório com partição de equivalência na busca (classe "termo sem caracteres alfanuméricos") |
| Evidência | [`reports/evidencias/DEF-01-antes-da-correcao.txt`](../../reports/evidencias/DEF-01-antes-da-correcao.txt): 3 casos `× DEF-01 …` reprovados |
| Correção | Quando o termo digitado não é vazio mas fica vazio depois de normalizado, nenhum produto corresponde |
| Regressão | CT-INT-05 (`"!!!"`, `"-"`, `"  ?  "`) — **aprovado** depois da correção |

<a id="def-02"></a>
## DEF-02 — Página pública de montagem recebe o título de 404

| Campo | Descrição |
| --- | --- |
| Componente | `frontend/src/App.jsx` (efeito que define `document.title`) |
| Condição de ocorrência | Abrir qualquer montagem publicada no ranking: `/ranking/<id>` |
| Resultado esperado | Aba com o título "Montagem da comunidade \| DreamBuild PC" |
| Resultado obtido | Aba com o título "Página não encontrada \| DreamBuild PC", embora a página exista. Afeta leitores de tela, histórico, favoritos e compartilhamento |
| Causa | O mapa de títulos tratava `/pedidos/`, `/finalizar/` e `/bancada/`, mas não o prefixo `/ranking/` |
| Evidência | [`reports/evidencias/DEF-02-antes-da-correcao.txt`](../../reports/evidencias/DEF-02-antes-da-correcao.txt) (diff `-'Página não encontrada…' +'Montagem da comunidade…'`) e captura em `reports/evidencias/DEF-02-antes/` |
| Correção | Prefixo `/ranking/` → "Montagem da comunidade" |
| Regressão | CT-E2E-13 — **aprovado** |

<a id="def-03"></a>
## DEF-03 — O fim do carregamento do catálogo rouba o foco do formulário

| Campo | Descrição |
| --- | --- |
| Componente | `frontend/src/App.jsx` (efeito de rolagem e foco, que depende de `loading`) |
| Condição de ocorrência | Abrir `/cadastro` ou `/entrar` e começar a digitar **antes** de o catálogo terminar de carregar (conexão lenta ou primeiro acesso) |
| Passos | 1. Catálogo atrasado em 1,5 s. 2. Focar o campo Nome e digitar "Ana". 3. Esperar o catálogo carregar. |
| Resultado esperado | O foco continua no campo Nome e a digitação segue normalmente |
| Resultado obtido | O foco vai para `main#conteudo`. O resto do texto não entra no campo e o leitor de tela anuncia outro elemento |
| Causa | Quando `loading` passava a `false`, o efeito chamava `window.scrollTo(0,0)` e `#conteudo.focus()` mesmo com a pessoa interagindo com um campo |
| Como foi encontrado | O fluxo completo CT-E2E-FULL-01 falhou de forma intermitente com o campo Nome **vazio** depois da digitação. A hipótese foi isolada num teste determinístico (CT-E2E-24) |
| Evidência | Captura [`reports/evidencias/DEF-03-antes/`](../../reports/evidencias/DEF-03-antes/) mostrando `expected <main#conteudo.page-shell> to have attribute name`, e o log `DEF-03-antes-da-correcao.txt` |
| Correção | O efeito não move foco nem rolagem quando o elemento ativo é `input`, `textarea`, `select` ou `contenteditable` |
| Regressão | CT-E2E-24 — **aprovado** sem retry; CT-E2E-FULL-02, que falhava antes, também passou |

<a id="def-04"></a>
## DEF-04 — Limite máximo do título do jogo medido antes do `trim`

| Campo | Descrição |
| --- | --- |
| Componente | `backend/src/models/Game.js` (`Game.parse`) |
| Condição de ocorrência | Admin cadastra ou altera um cenário com título de 120 caracteres seguido de um espaço (comum ao colar texto) |
| Resultado esperado | Aceito e gravado com 120 caracteres, porque o título é armazenado sem os espaços das pontas |
| Resultado obtido | 400 "Informe nome e identificador válidos para o cenário." |
| Causa | `input.title.trim().length < 2 \|\| input.title.length > 120`: o mínimo usava o texto sem espaços e o máximo usava o texto bruto |
| Como foi encontrado | Análise de valor limite combinando o limite superior com a normalização (o mesmo critério de `User.registration`) |
| Evidência | [`reports/evidencias/DEF-04-antes-da-correcao.txt`](../../reports/evidencias/DEF-04-antes-da-correcao.txt): `✖ título de 120 caracteres + espaço no fim (DEF-04)` |
| Correção | Os dois limites passam a usar `input.title.trim().length` |
| Regressão | CT-UNI-13 — **aprovado**; 121 caracteres sem espaço continuam sendo recusados |

<a id="def-05"></a>
## DEF-05 — `npm run test:e2e` quebra no Windows 11

| Campo | Descrição |
| --- | --- |
| Componente | Ferramenta `start-server-and-test` (usada na primeira versão do script) |
| Condição de ocorrência | Rodar `npm run test:e2e` no Windows 11 24H2 ou mais recente |
| Resultado esperado | Subir o Vite, rodar o Cypress, encerrar o Vite e devolver o código de saída do Cypress |
| Resultado obtido | `Error: spawn wmic.exe ENOENT`. O Vite ficava rodando na porta 5173 e bloqueava as execuções seguintes |
| Causa | A biblioteca usa `wmic.exe` para encerrar a árvore de processos, e esse programa foi removido do Windows |
| Evidência | Saída relatada pela equipe ao executar o script (`spawn wmic.exe ENOENT … syscall: 'spawn wmic.exe'`) |
| Correção | 1ª tentativa: `concurrently` + `wait-on`. Encerrava sem `wmic`, mas ainda falhava com `Port 5173 is already in use` quando o Vite que sobrou da falha anterior continuava ativo. Correção final: `scripts/e2e.mjs` (usado por `test:e2e` e `test:e2e:full`) e `scripts/regressao.mjs` **reaproveitam** servidores já ativos, iniciam os que faltam com `node` diretamente e os encerram pelo PID. Na porta 3001 só aceitam a API E2E em memória |
| Situação | Corrigido; regressão final executada pelo novo orquestrador |

<a id="def-06"></a>
## DEF-06 — Mock do Cypress divergente da API real

| Campo | Descrição |
| --- | --- |
| Componente | `frontend/cypress/support/commands.js` |
| Condição | O mock respondia 401 com "E-mail ou senha **inválidos**.", mas o back-end responde "E-mail ou senha **incorretos**." |
| Risco | O teste passaria mesmo que a tela exibisse um texto que o servidor real nunca envia (falso positivo) |
| Como foi encontrado | Comparação entre o teste de API CT-API-03 e o mock |
| Correção | Mock e CT-E2E-23 alinhados à mensagem real. O fluxo completo CT-E2E-FULL-02 confirma a mensagem contra o servidor de verdade |

<a id="def-07"></a>
## DEF-07 — Especificação Swagger inválida e com códigos de status genéricos

| Campo | Descrição |
| --- | --- |
| Componente | `backend/src/config/openapi.js` |
| Condição de ocorrência | Validar `/openapi.json` com um validador OpenAPI ou importar o arquivo num gerador de cliente |
| Resultado esperado | Documento OpenAPI 3.0.3 válido, com os códigos de status que cada rota realmente devolve |
| Resultado obtido | **56 violações** no validador oficial (`@apidevtools/swagger-parser`), porque o helper `object()` gerava `required: []`, proibido pela especificação. Além disso, as 45 operações listavam o mesmo conjunto de erros (400, 404, 409, 429, 500, 503), inclusive rotas que não podem devolvê-los (`GET /api/health` com 409 e 429, `GET /api/cart` com 404). Não havia nenhum exemplo |
| Causa | O helper sempre incluía `required`; a função `endpoint()` montava a mesma lista fixa de códigos para todas as rotas |
| Como foi encontrado | Ao revisar a documentação Swagger: comparação dos códigos documentados com os erros lançados pelos controllers e com os testes de API |
| Impacto | O Swagger UI tolera o problema e exibe a página, mas ferramentas que validam o contrato rejeitam o arquivo, e quem lê a documentação espera erros que nunca acontecem |
| Correção | `required` só entra quando há campos. Cada rota declara os próprios erros, e os automáticos (401/403/400/413/503) só entram quando se aplicam. Foram acrescentados schemas de resposta (`Session`, `CartSummary`, `Order`, `IssuedDemoCard`...), exemplos com dados reais do catálogo e um guia de uso no topo da página |
| Evidência | Validação da versão original: `INVÁLIDA, 56 violações`; versão corrigida: `válida`. Capturas do Swagger em funcionamento em `reports/evidencias/swagger/` |
| Regressão | CT-API-13 (validador), CT-API-14 (rotas = documentação), CT-API-15 (arquivo exportado atualizado) e CT-API-16 (48 respostas reais usam só códigos documentados) — **aprovados** |
