# Relatório de execução da regressão

Gerado automaticamente por `scripts/regressao.mjs` em 09/11/2026, 15:56:48.

Ambiente: Node v24.19.0, win32 x64.

## Resumo

| Suíte | Casos | Aprovados | Reprovados | Ignorados |
|---|---:|---:|---:|---:|
| Back-end (node:test) | 277 | 277 | 0 | 0 |
| Front-end (Vitest) | 85 | 85 | 0 | 0 |
| E2E Cypress — API simulada | 35 | 35 | 0 | 0 |
| E2E Cypress — fluxo completo | 4 | 4 | 0 | 0 |
| **Total** | **401** | **401** | **0** | **0** |

Resultado geral: **APROVADO**

## Back-end (node:test)

| Grupo | Caso | Status | Tempo (s) |
|---|---|---|---:|
| test | metadados 3D aceitam somente GLB local com legenda e sinalização explícita | Aprovado | 0.003 |
| test | tamanhos de radiador aceitam números ou texto numérico e rejeitam valores inválidos | Aprovado | 0.002 |
| test | admin CRUD exige sessão e papel, valida dados e preserva URL; cliente recebe 403 | Aprovado | 0.510 |
| test | ofertas rejeitam preço inválido, fonte incompatível, duplicação e data futura | Aprovado | 0.001 |
| test | dados de componente não aceitam imagens com travessia e números técnicos inválidos | Aprovado | 0.000 |
| test | visitante recebe 200, user null, token CSRF e cookie HttpOnly | Aprovado | 0.103 |
| test | 201 cria CLIENT mesmo se o corpo pedir ADMIN e não devolve hash | Aprovado | 0.131 |
| test | 409 para e-mail já cadastrado (sem diferenciar maiúsculas) | Aprovado | 0.077 |
| test | 400 com nome com 1 caractere | Aprovado | 0.017 |
| test | 400 com e-mail inválido | Aprovado | 0.017 |
| test | 400 com senha com 7 caracteres | Aprovado | 0.020 |
| test | 403 CSRF_INVALID quando o token CSRF não é enviado | Aprovado | 0.028 |
| test | 200 com credenciais válidas e renova o cookie de sessão | Aprovado | 0.068 |
| test | e-mail é aceito com maiúsculas e espaços | Aprovado | 0.071 |
| test | 401 genérico para senha incorreta | Aprovado | 0.080 |
| test | 401 genérico para e-mail inexistente | Aprovado | 0.075 |
| test | 401 genérico para conta desativada | Aprovado | 0.072 |
| test | 400 para corpo vazio | Aprovado | 0.009 |
| test | 400 para senha vazia | Aprovado | 0.007 |
| test | 400 para senha com 129 caracteres | Aprovado | 0.035 |
| test | 400 para e-mail numérico | Aprovado | 0.012 |
| test | após o limite configurado a API responde 429 | Aprovado | 0.881 |
| test | encerra a sessão: rota privada volta a responder 401 | Aprovado | 0.134 |
| test | visitante em rota pública GET /api/components?limit=5 → 200 | Aprovado | 0.012 |
| test | visitante em rota privada GET /api/orders/my → 401 | Aprovado | 0.004 |
| test | visitante em rota privada GET /api/builds/my → 401 | Aprovado | 0.003 |
| test | visitante em rota admin GET /api/admin/metrics → 401 | Aprovado | 0.005 |
| test | CLIENT em rota pública GET /api/components?limit=5 → 200 | Aprovado | 0.079 |
| test | CLIENT em rota privada GET /api/orders/my → 200 | Aprovado | 0.075 |
| test | CLIENT em rota privada GET /api/builds/my → 200 | Aprovado | 0.081 |
| test | CLIENT em rota admin GET /api/admin/metrics → 403 | Aprovado | 0.106 |
| test | ADMIN em rota pública GET /api/components?limit=5 → 200 | Aprovado | 0.090 |
| test | ADMIN em rota privada GET /api/orders/my → 200 | Aprovado | 0.086 |
| test | ADMIN em rota privada GET /api/builds/my → 200 | Aprovado | 0.086 |
| test | ADMIN em rota admin GET /api/admin/metrics → 200 | Aprovado | 0.076 |
| test | conta desativada após o login perde acesso (401) | Aprovado | 0.080 |
| test | 200 com lista, meta.limit e cursor nulo no fim | Aprovado | 0.102 |
| test | paginação por cursor percorre todos os itens sem repetir | Aprovado | 0.069 |
| test | filtro por categoria (maiúsculas aceitas) | Aprovado | 0.003 |
| test | 400 para parâmetro inválido: limit=0 | Aprovado | 0.007 |
| test | 400 para parâmetro inválido: limit=101 | Aprovado | 0.003 |
| test | 400 para parâmetro inválido: limit=abc | Aprovado | 0.003 |
| test | 400 para parâmetro inválido: cursor=a%2Fb | Aprovado | 0.004 |
| test | 400 para parâmetro inválido: category=notebook | Aprovado | 0.006 |
| test | 400 para parâmetro inválido: category= | Aprovado | 0.015 |
| test | 503 sem detalhes internos quando o banco falha | Aprovado | 0.080 |
| test | 200 com a ficha do produto | Aprovado | 0.013 |
| test | 404 para produto inexistente | Aprovado | 0.020 |
| test | 400 para identificador com caracteres inválidos | Aprovado | 0.003 |
| test | fluxo cadastrar → consultar → alterar → remover | Aprovado | 0.145 |
| test | 409 ao cadastrar produto com endereço já existente | Aprovado | 0.099 |
| test | 400 para dados incompletos e para troca de slug; 404 para inexistente | Aprovado | 0.122 |
| test | 400 para oferta com preço negativo no PUT | Aprovado | 0.073 |
| test | visitante 401, cliente 403 e nada é gravado | Aprovado | 0.123 |
| test | admin sem token CSRF recebe 403 | Aprovado | 0.080 |
| test | título com 1 caractere (VL - 1) | Aprovado | 0.002 |
| test | título com 2 caracteres (VL) | Aprovado | 0.000 |
| test | título com 120 caracteres (VL) | Aprovado | 0.000 |
| test | título com 121 caracteres (VL + 1) | Aprovado | 0.000 |
| test | título de 120 caracteres + espaço no fim (DEF-04) | Aprovado | 0.000 |
| test | peso 0.09 (VL - 1) | Aprovado | 0.000 |
| test | peso 0.1 (VL) | Aprovado | 0.000 |
| test | peso 10 (VL) | Aprovado | 0.000 |
| test | peso 10.01 (VL + 1) | Aprovado | 0.000 |
| test | peso NaN | Aprovado | 0.000 |
| test | peso em texto | Aprovado | 0.000 |
| test | id com maiúscula | Aprovado | 0.000 |
| test | id com 100 caracteres (VL) | Aprovado | 0.000 |
| test | id com 101 caracteres (VL + 1) | Aprovado | 0.000 |
| test | imagem local com travessia | Aprovado | 0.000 |
| test | imagem HTTP sem TLS | Aprovado | 0.000 |
| test | fonte sem HTTPS | Aprovado | 0.000 |
| test | resultado é normalizado e sempre marcado como não calibrado | Aprovado | 0.000 |
| test | admin cadastra, lista, altera e remove um cenário | Aprovado | 0.304 |
| test | cliente recebe 403 e visitante 401 | Aprovado | 0.116 |
| test | listagem pública valida paginação (400) | Aprovado | 0.014 |
| test | passa no validador oficial (swagger-parser) | Aprovado | 0.484 |
| test | toda operação tem resumo, tag, operationId único e resposta 500 | Aprovado | 0.001 |
| test | rotas autenticadas documentam 401; alterações documentam 403 (CSRF) | Aprovado | 0.001 |
| test | nenhuma rota do Express fica sem documentação e nada documentado deixa de existir | Aprovado | 0.001 |
| test | GET /openapi.json devolve a mesma especificação | Aprovado | 0.086 |
| test | docs/api/openapi.json exportado está atualizado | Aprovado | 0.019 |
| test | GET /api-docs/ devolve a interface Swagger UI | Aprovado | 0.011 |
| test | cenários de visitante, cliente e administrador | Aprovado | 1.072 |
| test | sugestão AM4 chega completa à análise do servidor sem remover bloqueios | Aprovado | 0.035 |
| test | sugestão AM5 chega completa à análise do servidor sem remover bloqueios | Aprovado | 0.005 |
| test | sugestão Intel LGA1700 chega completa à análise do servidor sem remover bloqueios | Aprovado | 0.002 |
| test | fonte é validada pela potência e conectores sem bloqueio por comprimento | Aprovado | 0.001 |
| test | erro antigo de RAM não bloqueia a troca de outra categoria e erro novo continua bloqueado | Aprovado | 0.003 |
| test | fonte e gabinete incompatíveis são rejeitados antes da finalização | Aprovado | 0.003 |
| test | cadastro força CLIENT, remove hash da resposta, renova sessão e logout invalida cookie | Aprovado | 0.291 |
| test | CSRF ausente ou inválido bloqueia cadastro antes de criar usuário | Aprovado | 0.034 |
| test | conta desabilitada perde o perfil na consulta de sessão e acesso privado | Aprovado | 0.088 |
| test | login inválido é genérico; login válido preserva a conta e não o segredo | Aprovado | 0.282 |
| test | tentativas malsucedidas de login atingem 429 | Aprovado | 0.090 |
| test | hashes usam salts distintos e aceitam somente a senha correta | Aprovado | 0.247 |
| test | quantidades de kits contam módulos/GB e multiplicam preço; excesso bloqueia | Aprovado | 0.012 |
| test | NVMe e SATA coexistem com quantidades; M.2 SATA não vira segundo NVMe | Aprovado | 0.001 |
| test | alocação considera SATA compartilhada no protocolo certo e restrição por CPU | Aprovado | 0.002 |
| test | dados ausentes e SSD externo não são aprovados como conexão interna | Aprovado | 0.000 |
| test | cooler incluído só dispensa peça separada quando confirmado; socket do avulso é exato | Aprovado | 0.001 |
| test | configuração rejeita frações, negativos, quantidades de CPU e armazenamento duplicado | Aprovado | 0.001 |
| test | cadastro aceita nomes oficiais M.2_1 e rejeita protocolos inválidos | Aprovado | 0.003 |
| test | prévia pública preserva quantidades, custo unitário e RAM total sem inventar ganho de FPS | Aprovado | 0.013 |
| test | conjunto inicial completo passa nos critérios, com fonte de 1000 W e limites explicados | Aprovado | 0.006 |
| test | socket, DDR, tamanho e fonte incompatíveis são detectados no servidor | Aprovado | 0.002 |
| test | valores de energia ausentes não viram zero nem recomendação válida | Aprovado | 0.000 |
| test | fonte não recebe recomendação sem o piso publicado da GPU e considera potência máxima da CPU | Aprovado | 0.001 |
| test | water cooler exige tamanho de radiador suportado, sem comparar com altura de air cooler | Aprovado | 0.001 |
| test | peça removida, categoria trocada e ID inseguro são rejeitados; montagem parcial é marcada | Aprovado | 0.002 |
| test | comparador escolhe apenas lojas completas e calcula compra combinada por modalidade | Aprovado | 0.002 |
| test | PC completo entra de uma vez no carrinho e repetir a chave não duplica as peças | Aprovado | 0.029 |
| test | montagem incompleta e quantidade acima do limite preservam o carrinho inteiro | Aprovado | 0.001 |
| test | saldo insuficiente em uma peça não adiciona parcialmente o PC | Aprovado | 0.001 |
| test | carrinho valida limites e multiplica preços sem alterar a oferta original | Aprovado | 0.006 |
| test | peça avulsa mantém carrinho no login, exige cotação atual e checkout é privado/idempotente | Aprovado | 0.584 |
| test | consulta pública mantém envelope e transmite paginação validada ao DAO | Aprovado | 0.116 |
| test | parâmetros inválidos não consultam o banco | Aprovado | 0.134 |
| test | categoria é normalizada e produto individual retorna 404 sem consultar dados privados | Aprovado | 0.046 |
| test | falha de banco retorna 503 sem revelar erro interno | Aprovado | 0.019 |
| test | catálogo vazio é sucesso com cursor final nulo | Aprovado | 0.015 |
| test | Model converte ficha armazenada e exclui campos internos da resposta | Aprovado | 0.001 |
| test | base pública informa cópia local em cota excedida e compartilha uma única leitura | Aprovado | 0.003 |
| test | relatório ampliado pode ser gravado no Firestore mesmo sem Steam ID | Aprovado | 0.006 |
| test | base ampliada identifica GPUs exatas e preserva a coorte original; 8 GB não herda 16 GB | Aprovado | 0.011 |
| test | publicação exige consentimento explícito e rejeita FPS/preço forjados | Aprovado | 0.002 |
| test | Firestore DAO mantém uma publicação por montagem, separa resolução/versão e exclui custos incompletos | Aprovado | 0.023 |
| test | admin retira somente demonstrações e remove todas as entradas sem tocar em montagens privadas | Aprovado | 0.019 |
| test | listagem privada pagina todos os registros; cota pública tem recuo sem repetir leituras | Aprovado | 0.017 |
| test | prévia privada usa peças atuais, não expõe dono e muda hash se uma cotação mudar | Aprovado | 0.011 |
| test | rotas públicas dispensam sessão; publicação exige sessão, CSRF, proprietário e prévia atual | Aprovado | 0.671 |
| test | seletor distingue chip de marca comercial e não recomenda fonte sem potência/conectores | Aprovado | 0.003 |
| test | endereço é normalizado, limita campos e mantém apenas um padrão | Aprovado | 0.003 |
| test | cartão digitado exige validade correta e assinatura do emissor fictício | Aprovado | 0.002 |
| test | endereços são privados, persistem na conta e alterações exigem CSRF | Aprovado | 0.435 |
| test | frete é calculado no servidor e faz parte da tentativa idempotente | Aprovado | 0.269 |
| test | Firebase Auth inicia mesmo quando o runtime não permite require de módulos ESM | Aprovado | 0.439 |
| test | entrada da nuvem recusa iniciar sem segredo mesmo se o provedor não definir NODE_ENV | Aprovado | 1.965 |
| test | entrypoint da nuvem atende HTTP e restringe origens sem consultar o banco | Aprovado | 0.442 |
| test | credencial por variável rejeita JSON inválido/projeto divergente sem expor seu conteúdo | Aprovado | 0.001 |
| test | configuração de nuvem inicializa Admin com credencial em memória, sem arquivo nem consulta ao banco | Aprovado | 0.056 |
| test | configuração rejeita pasta, arquivo ausente e JSON inválido antes de conectar | Aprovado | 0.029 |
| test | saúde informa que o servidor responde sem declarar banco conectado | Aprovado | 0.120 |
| test | rota inexistente mantém envelope JSON e status HTTP de erro | Aprovado | 0.028 |
| test | JSON malformado recebe 400 sem revelar stack trace | Aprovado | 0.028 |
| test | payload excessivo recebe 413 | Aprovado | 0.006 |
| test | origem autorizada recebe permissão explícita com credenciais | Aprovado | 0.003 |
| test | origem não autorizada não recebe permissão CORS | Aprovado | 0.002 |
| test | preflight permite métodos do contrato sem wildcard de origem | Aprovado | 0.010 |
| test | visitante tem carrinho vazio | Aprovado | 0.071 |
| test | PUT soma quantidades e calcula total; DELETE remove | Aprovado | 0.086 |
| test | 400 para quantidade 0 | Aprovado | 0.017 |
| test | 400 para quantidade 11 | Aprovado | 0.013 |
| test | 400 para quantidade 1.5 | Aprovado | 0.017 |
| test | 400 para quantidade &quot;3&quot; | Aprovado | 0.015 |
| test | 404 para produto inexistente e 409 para produto sem oferta PIX | Aprovado | 0.030 |
| test | 403 sem token CSRF | Aprovado | 0.017 |
| test | itens adicionados antes do login continuam após o login | Aprovado | 0.107 |
| test | cartão → checkout 201 → pedido em /orders/my e /orders/:id; carrinho esvazia | Aprovado | 0.245 |
| test | 409 quando o carrinho mudou ou a cotação ficou desatualizada; 400 sem cartão | Aprovado | 0.169 |
| test | 401 para visitante no checkout | Aprovado | 0.031 |
| test | outro cliente recebe 404 ao consultar pedido alheio | Aprovado | 0.186 |
| test | pedido com frete mantém baixa atômica e rejeita frete adulterado | Aprovado | 0.008 |
| test | endereços são salvos no documento da conta sem substituir senha ou perfil | Aprovado | 0.002 |
| test | estoque próprio usa preço DreamBuild e não presume saldo a partir de ofertas externas | Aprovado | 0.002 |
| test | movimentação valida inteiros, dinheiro, limite, versão e motivo | Aprovado | 0.001 |
| test | recebimento é idempotente, registra responsável real e preserva saldo ao repetir | Aprovado | 0.003 |
| test | duas compras da última unidade aprovam só uma; repetição não desconta outra vez | Aprovado | 0.001 |
| test | pedido com item insuficiente ou preço alterado não gera baixa parcial nem recibo | Aprovado | 0.001 |
| test | inventário com versão antiga não sobrescreve uma venda e exclusão protege saldo positivo | Aprovado | 0.001 |
| test | estoque público não expõe histórico; escrita exige ADMIN e CSRF e ignora responsável enviado | Aprovado | 0.465 |
| test | 100 recargas do catálogo usam 320 leituras simuladas na janela, em vez de 32.000 | Aprovado | 0.011 |
| test | reiniciar o DAO reaproveita cache público do disco; invalidação remove o registro anterior | Aprovado | 0.004 |
| test | consulta iniciada antes de uma alteração não restaura um cache invalidado | Aprovado | 0.000 |
| test | ler sessão de prazo fixo não dispara escrita touch no Firestore | Aprovado | 0.000 |
| test | cartão fictício tem Luhn válido, pertence ao usuário e rejeita alteração/expiração | Aprovado | 0.006 |
| test | montagens e pedidos respeitam proprietário, checkout repete sem duplicar e preserva histórico | Aprovado | 0.517 |
| test | sockets LGA e AM são exatos; DDR não é intercambiável e dados críticos ausentes bloqueiam | Aprovado | 0.002 |
| test | referências preservam resolução, fontes e preços; notebooks não herdam 1440p de desktop | Aprovado | 0.000 |
| test | PCs e notebooks usam presets equivalentes e não copiam QHD ausente | Aprovado | 0.001 |
| test | GPU conhecida com CPU sem índice mostra somente referência, sem entrar no ranking | Aprovado | 0.004 |
| test | fonte e CPU de teste acompanham cada resultado; índices antigos ficam fora do ranking | Aprovado | 0.002 |
| test | estimativa identifica CPU/GPU e não inventa FPS de GPU desconhecida ou variante móvel | Aprovado | 0.002 |
| test | Google cria CLIENT, mantém vínculo por UID e não expõe UID na resposta pública | Aprovado | 0.005 |
| test | mesmo e-mail local exige vínculo autenticado e preserva o papel já existente | Aprovado | 0.001 |
| test | tokens Google ausentes ou excessivos são rejeitados antes de consultar Firebase | Aprovado | 0.000 |
| test | somente Gmail verificado pelo provedor Google recebe indicação de vínculo automático | Aprovado | 0.001 |
| test | Gmail verificado vincula cliente existente sem duplicar conta nem alterar senha, preferências ou papel | Aprovado | 0.001 |
| test | Gmail sem indicação verificada e conta administrativa continuam exigindo vínculo autenticado | Aprovado | 0.001 |
| test | vínculo automático rejeita conta desabilitada, outro UID ou índice de e-mail divergente sem gravar | Aprovado | 0.000 |
| test | catálogo compartilha consulta em andamento, descarta falha e limita o cache público | Aprovado | 0.002 |
| test | cópia pública é paginada sem duplicar produtos e nunca fornece credenciais | Aprovado | 0.006 |
| test | vitrine e rascunho assinado funcionam sem leitura de sessão; carrinho continua exigindo banco | Aprovado | 0.112 |
| test | gravação atrasada de carrinho não restaura sessão revogada pelo logout | Aprovado | 0.004 |
| test | quantidade 0 (VL inferior - 1) | Aprovado | 0.003 |
| test | quantidade 1 (VL inferior) | Aprovado | 0.000 |
| test | quantidade 10 (VL superior) | Aprovado | 0.000 |
| test | quantidade 11 (VL superior + 1) | Aprovado | 0.000 |
| test | quantidade -1 (PE negativa) | Aprovado | 0.000 |
| test | quantidade 1.5 (PE fracionária) | Aprovado | 0.000 |
| test | quantidade &quot;2&quot; (PE texto) | Aprovado | 0.000 |
| test | 30 modelos (VL superior) é aceito | Aprovado | 0.022 |
| test | 31 modelos (VL superior + 1) é rejeitado | Aprovado | 0.000 |
| test | entrada que não é lista é rejeitada | Aprovado | 0.000 |
| test | modelo repetido é rejeitado | Aprovado | 0.000 |
| test | identificador 128 caracteres (VL) | Aprovado | 0.000 |
| test | identificador 129 caracteres (VL + 1) | Aprovado | 0.001 |
| test | identificador com barra (travessia) | Aprovado | 0.000 |
| test | identificador vazio | Aprovado | 0.000 |
| test | linhas saem ordenadas e só com os campos esperados | Aprovado | 0.002 |
| test | in_stock / pix / 1000 → true | Aprovado | 0.000 |
| test | out_of_stock / pix / 1000 → false | Aprovado | 0.000 |
| test | unknown / pix / 1000 → false | Aprovado | 0.000 |
| test | in_stock / card / 1000 → false | Aprovado | 0.000 |
| test | in_stock / pix / 0 → false | Aprovado | 0.000 |
| test | in_stock / pix / -5 → false | Aprovado | 0.000 |
| test | in_stock / pix / 10.5 → false | Aprovado | 0.000 |
| test | in_stock / pix / null → false | Aprovado | 0.000 |
| test | oferta ausente não é elegível | Aprovado | 0.000 |
| test | método de pagamento pode ser escolhido | Aprovado | 0.000 |
| test | 9 ofertas (VL superior) aceitas | Aprovado | 0.002 |
| test | 10 ofertas (VL + 1) rejeitadas | Aprovado | 0.000 |
| test | mesma loja e pagamento duplicados | Aprovado | 0.000 |
| test | rejeita loja desconhecida | Aprovado | 0.000 |
| test | rejeita URL de outra loja | Aprovado | 0.000 |
| test | rejeita URL sem HTTPS | Aprovado | 0.000 |
| test | rejeita URL com credenciais | Aprovado | 0.000 |
| test | rejeita data futura | Aprovado | 0.000 |
| test | rejeita data antes de 2000 | Aprovado | 0.000 |
| test | rejeita preço 0 (VL inferior - 1) | Aprovado | 0.000 |
| test | rejeita preço acima de 1.000.000.000 (VL + 1) | Aprovado | 0.000 |
| test | rejeita em estoque sem preço | Aprovado | 0.005 |
| test | aceita preço 1 (VL inferior) | Aprovado | 0.000 |
| test | aceita preço 1.000.000.000 (VL superior) | Aprovado | 0.000 |
| test | aceita sem estoque e sem preço | Aprovado | 0.000 |
| test | aceita subdomínio da loja | Aprovado | 0.000 |
| test | padrão sem parâmetros | Aprovado | 0.000 |
| test | limit &quot;0&quot; (VL - 1) | Aprovado | 0.000 |
| test | limit &quot;1&quot; (VL inferior) | Aprovado | 0.000 |
| test | limit &quot;100&quot; (VL superior) | Aprovado | 0.000 |
| test | limit &quot;101&quot; (VL + 1) | Aprovado | 0.000 |
| test | limit &quot;abc&quot; (PE não numérica) | Aprovado | 0.000 |
| test | limit &quot;-1&quot; | Aprovado | 0.000 |
| test | limit repetido na URL (array) | Aprovado | 0.000 |
| test | cursor válido | Aprovado | 0.000 |
| test | cursor com caractere inválido | Aprovado | 0.001 |
| test | cursor com 129 caracteres | Aprovado | 0.000 |
| test | valor padrão é 20 | Aprovado | 0.000 |
| test | vazio (PE inválida) | Aprovado | 0.002 |
| test | 1 caractere (VL inferior - 1) | Aprovado | 0.000 |
| test | 2 caracteres (VL inferior) | Aprovado | 0.000 |
| test | 80 caracteres (VL superior) | Aprovado | 0.000 |
| test | 81 caracteres (VL superior + 1) | Aprovado | 0.000 |
| test | só espaços vira vazio | Aprovado | 0.000 |
| test | espaços nas pontas são removidos | Aprovado | 0.000 |
| test | tipo não string (PE inválida) | Aprovado | 0.000 |
| test | formato válido | Aprovado | 0.001 |
| test | sem @ (PE inválida) | Aprovado | 0.004 |
| test | sem domínio de topo | Aprovado | 0.001 |
| test | com espaço interno | Aprovado | 0.000 |
| test | 254 caracteres (VL superior) | Aprovado | 0.000 |
| test | 255 caracteres (VL superior + 1) | Aprovado | 0.000 |
| test | não string | Aprovado | 0.001 |
| test | e-mail é normalizado para minúsculas e sem espaços nas pontas | Aprovado | 0.000 |
| test | 7 caracteres (VL inferior - 1) | Aprovado | 0.000 |
| test | 8 caracteres (VL inferior) | Aprovado | 0.000 |
| test | 128 caracteres (VL superior) | Aprovado | 0.000 |
| test | 129 caracteres (VL superior + 1) | Aprovado | 0.000 |
| test | número em vez de texto (PE inválida) | Aprovado | 0.000 |
| test | ausente | Aprovado | 0.000 |
| test | campos extras (ex.: role) não passam pela validação | Aprovado | 0.006 |
| test | gera salts diferentes e só aceita a senha correta | Aprovado | 0.210 |
| test | hash malformado nunca é aceito | Aprovado | 0.192 |
| test | dados públicos não expõem hash nem UID do Google | Aprovado | 0.001 |
| test | sugestão didática não inventa peça e rejeita upgrade incompatível | Aprovado | 0.011 |
| test | modelo é sintético, previsível, muda com resolução e apresenta alerta didático | Aprovado | 0.005 |
| test | WebSocket verifica origem, CSRF/sessão e dono; dados privados param no stop e logout | Aprovado | 1.530 |

## Front-end (Vitest)

| Grupo | Caso | Status | Tempo (s) |
|---|---|---|---:|
| test/ProductCatalog.test.jsx | CT-INT-05 catálogo renderizado > mostra todos os produtos com contagem e preço | Aprovado | 0.186 |
| test/ProductCatalog.test.jsx | CT-INT-05 catálogo renderizado > busca ignora acentos e caixa; texto da busca aparece na contagem | Aprovado | 0.022 |
| test/ProductCatalog.test.jsx | CT-INT-05 catálogo renderizado > busca por fabricante da GPU inferido (NVIDIA) | Aprovado | 0.033 |
| test/ProductCatalog.test.jsx | CT-INT-05 catálogo renderizado > categoria filtra e o botão fica pressionado | Aprovado | 0.044 |
| test/ProductCatalog.test.jsx | CT-INT-05 catálogo renderizado > DEF-01 busca só com símbolos ("!!!") não retorna todos os produtos | Aprovado | 0.010 |
| test/ProductCatalog.test.jsx | CT-INT-05 catálogo renderizado > DEF-01 busca só com símbolos ("-") não retorna todos os produtos | Aprovado | 0.012 |
| test/ProductCatalog.test.jsx | CT-INT-05 catálogo renderizado > DEF-01 busca só com símbolos ("  ?  ") não retorna todos os produtos | Aprovado | 0.008 |
| test/ProductCatalog.test.jsx | CT-INT-05 catálogo renderizado > estado vazio chama onClear | Aprovado | 0.089 |
| test/ProductCatalog.test.jsx | CT-INT-05 catálogo renderizado > ordenação por nome e por preço; sem oferta vai para o fim | Aprovado | 0.183 |
| test/ProductCatalog.test.jsx | CT-INT-05 catálogo renderizado > somente disponíveis remove o produto sem estoque próprio | Aprovado | 0.075 |
| test/ProductCatalog.test.jsx | CT-INT-05 catálogo renderizado > botão do carrinho: habilitado chama add, indisponível fica desabilitado | Aprovado | 0.090 |
| test/ProductCatalog.test.jsx | CT-INT-05 catálogo renderizado > mais de 24 produtos mostra paginação incremental | Aprovado | 0.197 |
| test/assembly-experience.test.jsx | Bancada: seleção contextual e compatibilidade > fonte adequada aparece antes de escolher gabinete sem exigir comprimento | Aprovado | 0.176 |
| test/assembly-experience.test.jsx | Bancada: seleção contextual e compatibilidade > RAM antiga com ficha incompleta não esvazia a lista de GPUs válidas | Aprovado | 0.032 |
| test/assembly-experience.test.jsx | Bancada: seleção contextual e compatibilidade > última etapa oferece carrinho e benchmark e não mostra próxima peça | Aprovado | 0.329 |
| test/assembly-experience.test.jsx | Bancada: seleção contextual e compatibilidade > RAM incompatível não aparece na lista da plataforma AM4 | Aprovado | 0.044 |
| test/assembly-experience.test.jsx | Bancada: seleção contextual e compatibilidade > um socket LGA diferente fica oculto, com saída para trocar a plataforma | Aprovado | 0.063 |
| test/assembly-experience.test.jsx | Bancada: seleção contextual e compatibilidade > slots e quantidade aparecem na RAM; não permite exceder os dois slots | Aprovado | 0.062 |
| test/assembly-experience.test.jsx | Bancada: seleção contextual e compatibilidade > refrigeração incluída reduz as etapas obrigatórias; avançar mantém a seleção | Aprovado | 0.092 |
| test/battle-experience.test.jsx | Combate: gráficos, prioridade e compartilhamento > busca e seleção usam o jogo escolhido nas referências | Aprovado | 0.370 |
| test/battle-experience.test.jsx | Combate: gráficos, prioridade e compartilhamento > sem jogos equivalentes não inventa barras nem vencedor | Aprovado | 0.012 |
| test/battle-experience.test.jsx | Combate: gráficos, prioridade e compartilhamento > prioridade muda o resultado entre maior FPS e menor preço | Aprovado | 0.079 |
| test/battle-experience.test.jsx | Combate: gráficos, prioridade e compartilhamento > link compartilha somente seleções públicas e mantém resolução, jogo e prioridade | Aprovado | 0.001 |
| test/builder-session.test.jsx | bancada mantém seleção ao sair e voltar e só zera quando solicitada | Aprovado | 0.327 |
| test/cart-clear.test.jsx | limpar carrinho exige confirmação, faz uma única exclusão e atualiza o estado vazio | Aprovado | 0.404 |
| test/checkout-experience.test.jsx | Revisão da compra > pagamento não renderiza campos que o Chrome possa preencher com cartões salvos | Aprovado | 0.217 |
| test/checkout-experience.test.jsx | Revisão da compra > DreamCard expirado não pode ser selecionado | Aprovado | 0.028 |
| test/checkout-experience.test.jsx | Revisão da compra > endereço não salvo é escolhido sem gravar no servidor | Aprovado | 0.326 |
| test/client.test.js | CT-UNI-11 getCatalog > segue os cursores até o fim e ordena por displayOrder | Aprovado | 0.045 |
| test/client.test.js | CT-UNI-11 getCatalog > usa o cache da sessão na segunda chamada e ignora com force | Aprovado | 0.002 |
| test/client.test.js | CT-UNI-11 getCatalog > cache com mais de 5 minutos é descartado | Aprovado | 0.002 |
| test/client.test.js | CT-UNI-11 getCatalog > marca localSnapshot quando a API usa a cópia local | Aprovado | 0.001 |
| test/client.test.js | CT-UNI-11 getCatalog > cursor repetido interrompe a consulta (evita laço infinito) | Aprovado | 0.003 |
| test/client.test.js | CT-UNI-11 getCatalog > rejeita resposta inválida: HTTP 503 | Aprovado | 0.001 |
| test/client.test.js | CT-UNI-11 getCatalog > rejeita resposta inválida: data que não é lista | Aprovado | 0.001 |
| test/client.test.js | CT-UNI-11 getCatalog > rejeita resposta inválida: meta ausente | Aprovado | 0.001 |
| test/client.test.js | CT-UNI-12 apiRequest > mutação busca a sessão antes e envia X-CSRF-Token | Aprovado | 0.002 |
| test/client.test.js | CT-UNI-12 apiRequest > CSRF_INVALID renova o token e repete uma única vez | Aprovado | 0.003 |
| test/client.test.js | CT-UNI-12 apiRequest > erro da API vira ApiError com status, mensagem e erros | Aprovado | 0.001 |
| test/client.test.js | CT-UNI-12 apiRequest > resposta que não é JSON gera mensagem amigável | Aprovado | 0.001 |
| test/client.test.js | CT-UNI-12 apiRequest > getHealth rejeita resposta de outro serviço | Aprovado | 0.001 |
| test/community-regression.test.jsx | trocar classificação por galeria não usa a linha de ranking como relatório completo | Aprovado | 0.345 |
| test/community-regression.test.jsx | publicação sem cobertura não deixa a galeria em branco | Aprovado | 0.040 |
| test/game-preview.test.jsx | inicia sem som quando visível, pausa fora da tela e respeita pausa ao trocar de jogo | Aprovado | 0.214 |
| test/game-preview.test.jsx | movimento reduzido começa pausado e permite ativação voluntária | Aprovado | 0.084 |
| test/offers.test.js | CT-UNI-09 bestOffer escolhe a menor oferta elegível > entre várias lojas fica com o menor preço PIX disponível | Aprovado | 0.003 |
| test/offers.test.js | CT-UNI-09 bestOffer escolhe a menor oferta elegível > retorna null quando sem ofertas | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-09 bestOffer escolhe a menor oferta elegível > retorna null quando lista vazia | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-09 bestOffer escolhe a menor oferta elegível > retorna null quando só sem estoque | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-09 bestOffer escolhe a menor oferta elegível > retorna null quando preço nulo | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-09 bestOffer escolhe a menor oferta elegível > retorna null quando preço zero | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-09 bestOffer escolhe a menor oferta elegível > retorna null quando preço fracionário | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-09 bestOffer escolhe a menor oferta elegível > availabilityLabel([{"store":"kabum","paymentMethod":"pix","availability":"in_stock","priceCents":50000}]) = Disponível na consulta | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-09 bestOffer escolhe a menor oferta elegível > availabilityLabel([{"store":"kabum","paymentMethod":"pix","availability":"out_of_stock","priceCents":50000}]) = Sem estoque na consulta | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-09 bestOffer escolhe a menor oferta elegível > availabilityLabel([{"store":"kabum","paymentMethod":"pix","availability":"unknown","priceCents":50000}]) = Disponibilidade não confirmada | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-09 bestOffer escolhe a menor oferta elegível > availabilityLabel([]) = Disponibilidade não confirmada | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-09 bestOffer escolhe a menor oferta elegível > money formata centavos em reais (pt-BR) | Aprovado | 0.073 |
| test/offers.test.js | CT-UNI-09 bestOffer escolhe a menor oferta elegível > consultationDate usa data e hora curtas | Aprovado | 0.016 |
| test/offers.test.js | CT-UNI-10 seletor de peças (partições e tabela de decisão) > platformOf({"category":"cpu","brand":"AMD","name":"Ryzen 5","fullName":""}) = AMD | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-10 seletor de peças (partições e tabela de decisão) > platformOf({"category":"cpu","brand":"Intel","name":"Core i5","fullName":""}) = Intel | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-10 seletor de peças (partições e tabela de decisão) > platformOf({"category":"cpu","brand":"X","name":"Chip","fullName":""}) = Não identificado | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-10 seletor de peças (partições e tabela de decisão) > platformOf({"category":"gpu","brand":"MSI","name":"RTX 5060","fullName":""}) = NVIDIA | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-10 seletor de peças (partições e tabela de decisão) > platformOf({"category":"gpu","brand":"Sapphire","name":"Radeon RX 7600","fullName":""}) = AMD | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-10 seletor de peças (partições e tabela de decisão) > platformOf({"category":"gpu","brand":"Intel","name":"Arc B580","fullName":""}) = Intel | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-10 seletor de peças (partições e tabela de decisão) > platformOf({"category":"mobo","brand":"Asus","name":"B650","fullName":"","hardware":{"socket":"AM5"}}) = AMD | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-10 seletor de peças (partições e tabela de decisão) > platformOf({"category":"mobo","brand":"Asus","name":"B760","fullName":"","hardware":{"socket":"LGA1700"}}) = Intel | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-10 seletor de peças (partições e tabela de decisão) > platformOf({"category":"cooler","brand":"X","name":"AIO 240 Water","fullName":""}) = Water cooler | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-10 seletor de peças (partições e tabela de decisão) > platformOf({"category":"cooler","brand":"X","name":"Hyper 212","fullName":""}) = Air cooler | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-10 seletor de peças (partições e tabela de decisão) > platformOf({"category":"ram","brand":"X","name":"Fury DDR5","fullName":""}) = DDR5 | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-10 seletor de peças (partições e tabela de decisão) > platformOf({"category":"ram","brand":"X","name":"Fury","fullName":"","hardware":{"ramType":"DDR4"}}) = DDR4 | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-10 seletor de peças (partições e tabela de decisão) > platformOf({"category":"storage","brand":"Adata","name":"SU650","fullName":""}) = Adata | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-10 seletor de peças (partições e tabela de decisão) > psuFit: sem recomendação de potência → { category: 'psu', hardware: [Object] } | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-10 seletor de peças (partições e tabela de decisão) > psuFit: potência não informada → { category: 'psu', hardware: [Object] } | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-10 seletor de peças (partições e tabela de decisão) > psuFit: abaixo da recomendação (VL: 599 < 600) → { category: 'psu', hardware: [Object] } | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-10 seletor de peças (partições e tabela de decisão) > psuFit: igual à recomendação (VL: 600) → { category: 'psu', hardware: [Object] } | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-10 seletor de peças (partições e tabela de decisão) > psuFit: sem conector da GPU → { category: 'psu', hardware: [Object] } | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-10 seletor de peças (partições e tabela de decisão) > psuFit: conectores da placa-mãe ausentes → { category: 'psu', hardware: [Object] } | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-10 seletor de peças (partições e tabela de decisão) > psuFit: sem gabinete não bloqueia fonte adequada → { category: 'psu', hardware: [Object] } | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-10 seletor de peças (partições e tabela de decisão) > psuFit: comprimento não participa do bloqueio → { category: 'psu', hardware: [Object] } | Aprovado | 0.000 |
| test/offers.test.js | CT-UNI-10 seletor de peças (partições e tabela de decisão) > psuFit: cabe no limite (180 = 180) → { category: 'psu', hardware: [Object] } | Aprovado | 0.000 |
| test/store-search.test.jsx | Busca com sugestões locais > campo vazio mostra sugestões e atalhos sem consultar a rede | Aprovado | 0.320 |
| test/store-search.test.jsx | Busca com sugestões locais > mostra preço sem diferenciar acentos e Enter abre a opção ativa | Aprovado | 0.256 |
| test/store-search.test.jsx | Busca com sugestões locais > Enter sem opção ativa abre todos os resultados | Aprovado | 0.118 |
| test/store-search.test.jsx | Busca com sugestões locais > Escape fecha as opções e preserva o texto digitado | Aprovado | 0.139 |
| test/store-search.test.jsx | Busca com sugestões locais > sem correspondência não lista todos os produtos nem consulta a rede | Aprovado | 0.097 |

## E2E Cypress — API simulada

| Grupo | Caso | Status | Tempo (s) |
|---|---|---|---:|
| CT-E2E-22 faz login com e-mail e senha e abre a conta | Conta e autenticação CT-E2E-22 faz login com e-mail e senha e abre a conta | Aprovado | 1.856 |
| CT-E2E-23 mostra erro com credenciais inválidas | Conta e autenticação CT-E2E-23 mostra erro com credenciais inválidas | Aprovado | 1.435 |
| CT-E2E-24 DEF-03 carregar o catálogo não rouba o foco do formulário | Conta e autenticação CT-E2E-24 DEF-03 carregar o catálogo não rouba o foco do formulário | Aprovado | 2.476 |
| CT-E2E-25 valida campos obrigatórios no navegador | Conta e autenticação CT-E2E-25 valida campos obrigatórios no navegador | Aprovado | 0.670 |
| CT-E2E-26 cria uma conta nova | Conta e autenticação CT-E2E-26 cria uma conta nova | Aprovado | 1.961 |
| CT-E2E-27 redireciona rota protegida para o login e volta após entrar | Conta e autenticação CT-E2E-27 redireciona rota protegida para o login e volta após entrar | Aprovado | 1.659 |
| CT-E2E-28 sai da conta | Conta e autenticação CT-E2E-28 sai da conta | Aprovado | 0.750 |
| CT-E2E-29 bloqueia a administração para clientes | Conta e autenticação CT-E2E-29 bloqueia a administração para clientes | Aprovado | 0.496 |
| CT-E2E-30 mostra atalhos de administrador apenas para ADMIN | Conta e autenticação CT-E2E-30 mostra atalhos de administrador apenas para ADMIN | Aprovado | 0.541 |
| sugere produtos ao digitar e abre a opção escolhida pelo teclado | Experiência de compra e montagem sugere produtos ao digitar e abre a opção escolhida pelo teclado | Aprovado | 1.631 |
| fecha sugestões com Escape e mantém a busca para ver todos os resultados | Experiência de compra e montagem fecha sugestões com Escape e mantém a busca para ver todos os resultados | Aprovado | 1.080 |
| permite revisar quantidade e remover a peça no carrinho lateral | Experiência de compra e montagem permite revisar quantidade e remover a peça no carrinho lateral | Aprovado | 1.095 |
| amplia detalhes do produto e restaura o zoom | Experiência de compra e montagem amplia detalhes do produto e restaura o zoom | Aprovado | 1.048 |
| oculta a RAM DDR5 da CPU AM4 e permite trocar de plataforma | Experiência de compra e montagem oculta a RAM DDR5 da CPU AM4 e permite trocar de plataforma | Aprovado | 0.935 |
| CT-E2E-09 abre o produto a partir do card e mostra detalhes, ficha e ofertas | Página de produto CT-E2E-09 abre o produto a partir do card e mostra detalhes, ficha e ofertas | Aprovado | 1.304 |
| CT-E2E-10 indica produto sem oferta no PIX e desabilita a compra | Página de produto CT-E2E-10 indica produto sem oferta no PIX e desabilita a compra | Aprovado | 2.562 |
| CT-E2E-11 volta para a categoria pelo breadcrumb | Página de produto CT-E2E-11 volta para a categoria pelo breadcrumb | Aprovado | 2.765 |
| CT-E2E-12 mostra 404 para produto inexistente | Página de produto CT-E2E-12 mostra 404 para produto inexistente | Aprovado | 2.697 |
| CT-E2E-13 DEF-02 página de montagem pública não recebe título de 404 | Página de produto CT-E2E-13 DEF-02 página de montagem pública não recebe título de 404 | Aprovado | 0.521 |
| CT-E2E-14 mostra 404 para rota desconhecida | Página de produto CT-E2E-14 mostra 404 para rota desconhecida | Aprovado | 0.572 |
| CT-E2E-01 carrega a página inicial com cabeçalho, catálogo e status do serviço | Vitrine e catálogo CT-E2E-01 carrega a página inicial com cabeçalho, catálogo e status do serviço | Aprovado | 1.188 |
| CT-E2E-02 busca produtos pelo nome ignorando acentos e maiúsculas | Vitrine e catálogo CT-E2E-02 busca produtos pelo nome ignorando acentos e maiúsculas | Aprovado | 1.104 |
| CT-E2E-03 mostra estado vazio e limpa os filtros | Vitrine e catálogo CT-E2E-03 mostra estado vazio e limpa os filtros | Aprovado | 1.950 |
| CT-E2E-04 filtra por departamento | Vitrine e catálogo CT-E2E-04 filtra por departamento | Aprovado | 0.774 |
| CT-E2E-05 filtra somente produtos disponíveis para compra | Vitrine e catálogo CT-E2E-05 filtra somente produtos disponíveis para compra | Aprovado | 0.792 |
| CT-E2E-06 ordena por menor e maior preço no PIX | Vitrine e catálogo CT-E2E-06 ordena por menor e maior preço no PIX | Aprovado | 1.004 |
| CT-E2E-07 exibe erro quando o catálogo falha e permite tentar de novo | Vitrine e catálogo CT-E2E-07 exibe erro quando o catálogo falha e permite tentar de novo | Aprovado | 0.675 |
| CT-E2E-08 alterna entre tema claro e escuro e lembra a escolha | Vitrine e catálogo CT-E2E-08 alterna entre tema claro e escuro e lembra a escolha | Aprovado | 0.556 |
| CT-E2E-15 mostra o carrinho vazio | Carrinho CT-E2E-15 mostra o carrinho vazio | Aprovado | 1.469 |
| CT-E2E-16 adiciona um produto pela vitrine e atualiza o contador | Carrinho CT-E2E-16 adiciona um produto pela vitrine e atualiza o contador | Aprovado | 3.301 |
| CT-E2E-17 não permite adicionar produto indisponível | Carrinho CT-E2E-17 não permite adicionar produto indisponível | Aprovado | 2.661 |
| CT-E2E-18 altera quantidades e remove itens | Carrinho CT-E2E-18 altera quantidades e remove itens | Aprovado | 1.100 |
| CT-E2E-19 bloqueia o checkout com item indisponível | Carrinho CT-E2E-19 bloqueia o checkout com item indisponível | Aprovado | 0.687 |
| CT-E2E-20 exige login para seguir ao checkout | Carrinho CT-E2E-20 exige login para seguir ao checkout | Aprovado | 0.786 |
| CT-E2E-21 mostra erro do servidor ao atualizar o carrinho | Carrinho CT-E2E-21 mostra erro do servidor ao atualizar o carrinho | Aprovado | 0.988 |

## E2E Cypress — fluxo completo

| Grupo | Caso | Status | Tempo (s) |
|---|---|---|---:|
| CT-E2E-FULL-01 cadastro → busca → carrinho → compra simulada → histórico | Fluxo completo front-end + back-end (sem mocks) CT-E2E-FULL-01 cadastro → busca → carrinho → compra simulada → histórico | Aprovado | 9.813 |
| CT-E2E-FULL-02 login inválido, depois válido; logout bloqueia rota privada | Fluxo completo front-end + back-end (sem mocks) CT-E2E-FULL-02 login inválido, depois válido; logout bloqueia rota privada | Aprovado | 5.300 |
| CT-E2E-FULL-03 e-mail duplicado no cadastro mostra erro do servidor (409) | Fluxo completo front-end + back-end (sem mocks) CT-E2E-FULL-03 e-mail duplicado no cadastro mostra erro do servidor (409) | Aprovado | 4.408 |
| CT-E2E-FULL-04 administrador acessa a administração; cliente não | Fluxo completo front-end + back-end (sem mocks) CT-E2E-FULL-04 administrador acessa a administração; cliente não | Aprovado | 4.294 |
