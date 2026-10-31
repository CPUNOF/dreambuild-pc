# Aula 5 — Montador, relatório e compra simulada

## Fluxo

1. Abra `/montar`, selecione as oito categorias e clique em Analisar montagem.
2. Corrija incompatibilidades e confira os avisos. O rascunho fica em cookie assinado HttpOnly; o navegador não pode editá-lo diretamente.
3. Entre na conta para salvar uma montagem com nome. `/minhas-montagens` permite reabrir ou remover somente as suas.
4. Na compra simulada, o servidor verifica novamente as peças do catálogo. Gere um cartão fictício e confirme que entendeu a simulação.
5. `/pedidos` guarda recibos e relatórios históricos. Não há pagamento, dados bancários reais, entrega ou documento fiscal válido.

## O Model faz as contas

`Build` verifica socket, padrão/quantidade/capacidade da RAM, suporte de cooler, formato de placa-mãe, medidas de GPU/cooler/fonte, armazenamento e conector da GPU. Dados críticos ausentes impedem uma confirmação. BIOS, QVL, espaço de cabo e capacidade térmica continuam exigindo conferência manual; não são medidos pelo site.

A fórmula didática usa TDP da CPU + potência de referência da GPU + reserva de 50 W, com 25% de margem. A recomendação final é o maior valor entre essa conta e a recomendação cadastrada do fabricante da GPU. No conjunto inicial: 620 W de referência com reserva, 775 W com margem, fonte recomendada de 1000 W pela indicação da Asus. TDP e referência não são consumo medido nem previsão exata de picos. Os 450 W da RTX 4090 são da GPU de referência NVIDIA, não uma medição desta placa OC.

`Comparison` considera apenas ofertas disponíveis, com preço positivo e mesma forma de pagamento. Uma loja só concorre ao menor total se cotar todas as peças selecionadas. A compra combinada escolhe a menor oferta por peça. Ausência de preço gera total nulo, nunca zero nem uma cotação inventada. Frete não entra na comparação.

## Segurança e persistência

- A seleção envia IDs; preços e dados técnicos são recuperados pelo DAO no servidor.
- Builds e pedidos têm proprietário. Outra conta recebe 404, inclusive uma conta ADMIN consultando pedido privado de outra pessoa.
- O cookie do rascunho não substitui a montagem salva no Firestore.
- Snapshots guardam peças, análise e ofertas na data da gravação. Editar/excluir o catálogo ou a montagem não reescreve pedidos antigos.
- O cartão começa com prefixo fictício `000000`, tem Luhn válido e autorização assinada para a conta, válida por dez minutos. Não representa uma bandeira bancária. O pedido guarda somente número mascarado; CVV e número completo não são armazenados no pedido.
- A tentativa de checkout tem chave de idempotência: repetir os mesmos dados devolve o mesmo pedido. Reusar a chave com dados diferentes recebe 409. Índice e pedido são gravados juntos em transação.
- Cotação incompleta não impede uma simulação acadêmica; o recibo informa a ausência do total.

## Rotas

`GET /api/builds/draft`; `POST /api/builds/analyze`; `POST /api/builds`; `GET /api/builds/my`; `GET/DELETE /api/builds/:id`; `POST /api/orders/card`; `POST /api/orders/checkout-dream`; `GET /api/orders/my`; `GET /api/orders/:id`.

Alterações exigem CSRF; gravações privadas exigem sessão. Respostas seguem o envelope da API. Recibo pode ser impresso/salvo em PDF pelo navegador ou exportado em JSON.

## Exercício

Explique a diferença entre rascunho em cookie e registro no banco. Depois, altere temporariamente a fonte de um conjunto de teste e observe a análise. Não altere dados reais do catálogo sem registrar a fonte. Compare como o relatório trata uma peça sem preço e por que isso não significa que ela é gratuita.
