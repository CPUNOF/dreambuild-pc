# Contrato da API — versão local em 30/10/2026

## Ranking e FPS — atualização V2

| Método e rota | Acesso | Resultado |
| --- | --- | --- |
| `GET /api/benchmarks` | Público | Base de 19 GPUs, 12 jogos e 456 referências de FPS |
| `GET /api/community/ranking?resolution=1080p&sort=performance` | Público | Top 20 por padrão, máximo 50; `1440p` e `sort=value` também disponíveis |
| `GET /api/community/gallery` | Público | 20 publicações mais recentes, inclusive sem classificação |
| `GET /api/community/builds/:id` | Público | Ficha compartilhável sem nome da conta, e-mail ou identificadores privados |
| `GET /api/community/preview/:id` | Dono autenticado | Prévia atual e `previewHash`, sem publicar |
| `POST /api/community/builds` | Dono + CSRF | Publica/atualiza com `buildId`, `nickname`, `title`, `consent: true`, `previewHash`; 201 ou 409 se a prévia mudou |
| `GET /api/community/my?limit=100&cursor=...` | Autenticado | Próprias publicações com `meta.nextCursor` |
| `DELETE /api/community/builds/:id` | Dono + CSRF | Retira ficha e índices, preservando a montagem privada; outro dono recebe 404 |

A API rejeita FPS/preços enviados pelo cliente. O ranking usa dez jogos fixos, resolução e versão iguais. Preço incompleto não entra em custo-benefício; falta de cobertura mantém o PC apenas na galeria. Cache público compartilhado de dez minutos e recuo de cinco minutos por cota excedida, sem polling; ações privadas revalidam o banco. Consulte a [Aula 12](aula-12-ranking-e-fps.md) e o Swagger para detalhes e limites da evidência.

## Demais recursos

Atualização: `/api/systems` consulta equipamentos com preços datados; `/api/builds/:id/performance?resolution=1080p|1440p` consulta referências do proprietário. `/api/auth/providers`, `/api/auth/google` e `/api/auth/google/link` documentam a integração Google no Swagger. Tokens são verificados no servidor; vincular exige sessão e mesmo e-mail verificado.

O catálogo público tem cache compartilhado/persistente de 30 minutos e cópia na aba de cinco minutos. Alterações administrativas invalidam o cache; compras continuam conferindo os documentos atuais. A cota excedida retorna 503 nas operações privadas; consultas públicas podem usar as fontes locais identificadas em `meta.source`. Detalhes e limites: [Aula 11](aula-11-combate-e-cache.md).

Documentação executável: `http://127.0.0.1:5173/api-docs/`. Documento OpenAPI: `/openapi.json`. Fonte: `backend/src/config/openapi.js`. API Express: `http://127.0.0.1:3001`; no React, use o prefixo relativo `/api` para preservar cookies na mesma origem.

## Documentação Swagger (OpenAPI 3.0.3)

| Onde | Endereço |
| --- | --- |
| Interface interativa (local) | `http://localhost:5173/api-docs/` com `npm run dev`, ou com `npm run e2e:server --workspace backend` + `npm run dev:frontend` (dados em memória, sem Firebase) |
| Interface interativa (publicada) | `https://dreambuild-pc.vercel.app/api-docs/` |
| Especificação JSON (servida) | `/openapi.json` |
| Especificação JSON (arquivo) | [`docs/api/openapi.json`](api/openapi.json): abra em https://editor.swagger.io (*File → Import file*) sem iniciar o servidor |
| Fonte | `backend/src/config/openapi.js` |

O que cada uma das 45 operações informa:

- **Acesso** (público, autenticado ou ADMIN) e se exige CSRF.
- **Corpo da requisição** com schema e exemplo, e **parâmetros** com limites (`limit` 1..100, `category`, `resolution`).
- **Resposta de sucesso** com o formato do `data` (sessão, carrinho, pedido, cartão, produto, paginação) e exemplo com dados reais do catálogo.
- **Somente os erros que a rota pode devolver**, cada um com exemplo do envelope `{status:"error", message, data:null, errors, meta}`. 401/403 aparecem só em rotas autenticadas ou que alteram dados, 400/413 só onde há corpo e 503 só onde há consulta ao banco.

Para testar pela interface: *Conta → GET /api/auth/session → Try it out → Execute*, depois `POST /api/auth/login`. A interface busca o token CSRF sozinha antes de cada alteração.

Manutenção:

```bash
npm run docs:api --workspace backend   # regenera docs/api/openapi.json depois de alterar openapi.js
node --test backend/test/api/openapi.contract.test.js
```

O teste de contrato (CT-API-13 a CT-API-16) falha se a especificação deixar de ser válida, se uma rota do Express ficar sem documentação (ou vice-versa), se o arquivo exportado ficar desatualizado ou se uma resposta real usar um código de status não documentado.

## Convenções

Respostas de negócio usam `{status,message,data,errors,meta}`. `status` é `success` ou `error`; o status HTTP mantém seu significado. O documento OpenAPI e os arquivos estáticos são exceções próprias de documentação/assets.

Listagens aceitam `limit` inteiro de 1 a 100 e `cursor` como ID, com letras, números, hífen ou sublinhado, até 128 caracteres. Ordenação por ID. O próximo cursor fica em `meta.nextCursor`; `null` indica fim. Filtro opcional do catálogo: `category=cpu|gpu|mobo|ram|storage|psu|case|cooler`, sem distinguir maiúsculas.

GET de saúde verifica somente HTTP. `database=not-checked` não declara que Firestore respondeu; a conexão é verificada por catálogo/DAO e `check:firebase`.

| Método | Rota | Acesso e resultado |
| --- | --- | --- |
| GET | `/api/health` | Público; estado HTTP |
| GET | `/api/components` | Público; catálogo paginado e categoria opcional |
| GET | `/api/components/:id` | Público; produto identificado |
| GET | `/api/games` | Público; cenários didáticos paginados |
| GET | `/api/auth/session` | Público; `{user,csrfToken}`; visitante tem user nulo |
| POST | `/api/auth/register` | Nome/e-mail/senha; cria CLIENT e renova sessão; 201 |
| POST | `/api/auth/login` | E-mail/senha; renova sessão; 200 |
| POST | `/api/auth/logout` | Destrói sessão e limpa cookie; 200 |
| GET | `/api/builds/draft` | Recupera rascunho do cookie assinado |
| POST | `/api/builds/analyze` | IDs de peças e modalidade; análise atual; cookie de rascunho |
| POST | `/api/builds/upgrade` | Alternativa baseada em índices didáticos, após análise compatível |
| POST | `/api/builds` | Autenticado; salva sua montagem com nome; 201 |
| GET | `/api/builds/my` | Autenticado; suas montagens paginadas |
| GET / DELETE | `/api/builds/:id` | Proprietário; consulta/remove montagem |
| POST | `/api/orders/card` | Autenticado; gera cartão fictício assinado com validade curta |
| POST | `/api/orders/checkout-dream` | Proprietário; `buildId`, `idempotencyKey`, `card`; compra simulada |
| GET | `/api/orders/my` | Autenticado; seus pedidos paginados |
| GET | `/api/orders/:id` | Proprietário; recibo com snapshot e número mascarado |
| POST | `/api/admin/components` | ADMIN; cadastra componente; 201 |
| PUT / PATCH | `/api/admin/components/:id` | ADMIN; atualiza campos, preservando os não enviados e o endereço existente |
| DELETE | `/api/admin/components/:id` | ADMIN; remove componente |
| POST | `/api/admin/games` | ADMIN; cadastra cenário; 201 |
| PUT / DELETE | `/api/admin/games/:id` | ADMIN; edita/remove cenário |
| GET | `/api/admin/metrics` | ADMIN; contagens sem listagem de dados pessoais |

Todos os POST/PUT/PATCH/DELETE exigem `X-CSRF-Token`. Obtenha-o por GET de sessão e envie o cookie junto. O Swagger obtém o token antes das alterações; ele não entra automaticamente numa conta. Usar login no Swagger altera a sessão do mesmo navegador. Não enviar senhas reais para screenshots ou exemplos compartilhados.

## Carrinho e compra avulsa

| Método | Rota | Comportamento |
| --- | --- | --- |
| GET | `/api/cart` | Carrinho da sessão, inclusive visitante; preços calculados no servidor |
| PUT | `/api/cart/items/:id` | Define `{quantity}` entre 1 e 10; máximo de 30 modelos |
| DELETE | `/api/cart/items/:id` | Remove um modelo |
| DELETE | `/api/cart` | Esvazia a sessão atual |
| POST | `/api/orders/checkout-cart` | Login e CSRF; compra avulsa com `{items,quoteVersion,idempotencyKey,card}` |

`items` contém `{componentId,quantity}`; a revisão fornece `quoteVersion`. O servidor compara itens com a sessão e recalcula a cotação. Mudança de preço/disponibilidade retorna 409 para revisão. A versão da cotação não substitui autenticação ou CSRF. A repetição idempotente devolve o pedido anterior mesmo depois de esvaziar o carrinho. Este fluxo permite peças avulsas; `/api/orders/checkout-dream` continua exigindo a montagem completa compatível. Login preserva o carrinho do visitante; logout revoga a sessão.

## Exemplo de montagem completa

```json
{"partIds":{"cpu":"ryzen","gpu":"rtx4090","mobo":"tuf-b650","ram":"corsair","storage":"samsung","psu":"rm1000e","case":"5000d","cooler":"nh-u12a"},"paymentMethod":"pix"}
```

O servidor busca cada ID pelo DAO, confere categoria e calcula compatibilidade, potência e preços. Valores monetários enviados pelo cliente não substituem o banco. Para salvar, acrescente `name` e use POST `/api/builds` autenticado.

Preços usam centavos inteiros e não misturam PIX/cartão. Oferta precisa de loja reconhecida, HTTPS da loja correspondente, consulta não futura e disponibilidade. Só disponibilidade confirmada com preço válido entra na comparação. Carrinho incompleto tem total nulo; o subtotal conhecido é separado. Frete fica excluído.

O checkout do montador revalida o catálogo, exige montagem completa compatível e ofertas elegíveis em todas as peças na modalidade escolhida. O checkout avulso exige oferta PIX disponível para todos os itens. Produto sem estoque ou com disponibilidade desconhecida não entra no carrinho; mudança posterior bloqueia a finalização com 409. Remover um item indisponível continua permitido. Repetir a mesma chave/dados de um pedido já registrado devolve o pedido anterior; mudar os dados com a mesma chave retorna 409. Pedidos históricos preservam seus snapshots.

## Códigos e segurança

200 sucesso; 201 criação; 400 entrada inválida; 401 sessão necessária ou login inválido; 403 papel/CSRF; 404 recurso ausente ou privado de outra pessoa; 409 conflito/idempotência; 413 corpo acima de 100 KB; 429 limite de tentativas; 500 erro genérico; 503 catálogo/dependência indisponível quando tratado. Não retornam stack trace, hash de senha ou chave privada.

CORS explícito com credenciais para as origens configuradas em `FRONTEND_ORIGINS`, separadas por vírgula. Padrão local: `http://localhost:5173,http://127.0.0.1:5173`. Cookie HttpOnly, SameSite=Lax e Secure em produção; CSRF em memória do cliente. Autorização e propriedade são conferidas no servidor.

## Socket.IO

Transporte WebSocket, caminho `/socket.io`, cookie da sessão e `auth.csrfToken`. A origem deve estar autorizada. Cliente emite `bench:start` com `{buildId,gameId,resolution,overclock,restrictedCooling}`; recebe confirmação e `bench:sample` a cada 500 ms. `bench:stop` encerra; `bench:state` informa estado. Limites: uma execução por usuário no processo, dez inícios por minuto e até dois minutos por execução. Logout, desconexão ou perda da autorização interrompem.

`catalog:updated` informa apenas ID/horário de uma alteração pública feita pelo administrador; não contém dados privados nem coleta preços automaticamente. Para múltiplos processos, compartilhar limitadores, coordenação de execução e eventos antes de afirmar essas garantias globalmente.

## Persistência

`POST /builds/analyze` e `POST /builds` aceitam `quantities` (mapa ID → inteiro 1–16, apenas RAM e armazenamento) e `storageIds` (outros modelos de armazenamento; primeiro em `partIds.storage`). Até 16 unidades de armazenamento totais. Respostas e snapshots incluem `quantities`, `storageIds`, `itemCount` e `resources` com módulos/GB, conexões alocadas, portas compartilhadas e refrigeração. Montagens antigas assumem uma unidade. Salvar, checkout, referências e publicações recalculam essas opções no servidor; kits contam `hardware.modules × quantidade`. Cooler separado deixa de ser obrigatório somente com cooler incluído confirmado no SKU da CPU. Consulte `aula-13-quantidades-e-refrigeracao.md` para exemplos e limites de instalação.

Firestore guarda fichas como `[{label,value}]`; o Model publica `[[label,value]]`, pois arrays diretamente aninhados não são aceitos pelo banco. Montagens e pedidos guardam snapshots. `users` não publica `passwordHash`; sessões e credenciais permanecem no servidor.
