# Catálogo ampliado — consulta pontual de 30/10/2026

A primeira ampliação chegou a 243 produtos. A revisão seguinte adicionou 74 modelos: **317 produtos no banco**, preservando os originais e as edições existentes. Consulte também a [Aula 10](aula-10-seletor-e-disponibilidade.md).

| Departamento | Modelos no banco |
| --- | ---: |
| Processadores | 25 |
| Placas de vídeo | 21 |
| Placas-mãe | 26 |
| Memória RAM | 145 |
| Armazenamento | 22 |
| Fontes | 21 |
| Gabinetes | 22 |
| Coolers | 35 |

## Fontes e identificação

- **94 cadastros da KaBuM!:** páginas públicas de categorias/produtos, com código da loja, variante anunciada, fabricante e fotografias do respectivo cadastro.
- **141 cadastros da Kingston Store:** catálogo público do canal, com códigos, capacidades, quantidade de módulos, padrão DDR e imagens correspondentes. Foram excluídos notebooks, memórias registradas/ECC e itens empresariais; os SSDs selecionados são M.2 2280.
- **74 cadastros adicionais** e 109 consultas de oferta nesta revisão: `availabilityProducts.json` e `availabilityQuotes.json`, com fotografias e variantes identificadas.
- Dados da primeira carga: `backend/data/expandedKabum.json`, `expandedCases.json` e `expandedKingston.json`.
- Fotografias e procedência: `frontend/public/hardware/expanded/manifest*.json`. Os direitos continuam com os titulares; não há alegação de licença aberta.

As páginas dos produtos mostram o código e o link da fonte. A identificação distingue fotografias/cadastros de loja das fichas originais de fabricante. Não são imagens geradas por IA nem avaliações fictícias.

## Preços

Há **151 produtos com oferta PIX elegível** no snapshot atual, contando o conjunto original. A nova seleção só usa valores públicos identificados sem assinatura Prime, disponibilidade declarada e modalidade coerente. Campanhas são consideradas apenas quando vigentes no instante da consulta; preços exclusivos de assinatura não substituem o preço público. Frete e cupons individuais não foram presumidos.

Os produtos sem oferta disponível continuam no catálogo e no montador para consulta, mas não podem entrar no carrinho ou ser finalizados em compra. Isso inclui disponibilidade desconhecida: ausência de confirmação não significa estoque garantido. Nenhum valor faltante vira zero ou preço estimado. Consultas são históricas, com data; não garantem o valor/estoque de uma visita futura. Esta foi uma importação pontual, sem robô de monitoramento contínuo.

## Dados técnicos e montador

Os oito modelos iniciais mantêm as fichas técnicas verificadas na etapa anterior. Nos cadastros ampliados foram utilizados os dados identificados nas fontes, sem inventar medidas, consumo ou índices de desempenho. Quando faltarem dados exigidos pela análise automática, o montador indicará o que precisa de conferência. Comprar peças avulsas não certifica compatibilidade entre elas.

O catálogo mostra 24 itens por etapa, com botão para carregar mais, busca por nome/código/marca e ordenação por preço. Produtos com oferta PIX confirmada aparecem primeiro na ordem de destaque. A carga intercala departamentos para evitar concentrar toda a vitrine nos kits de RAM.

## Repetir a carga em outro banco

```powershell
npm.cmd run seed:expanded --workspace backend
```

O script valida todas as fichas antes de gravar e usa criação atômica por ID. Registros existentes são preservados; não é um comando de limpeza ou atualização automática de preços.
