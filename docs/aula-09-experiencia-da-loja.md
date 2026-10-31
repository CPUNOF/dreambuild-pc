# Aula 09 — disponibilidade, tema e bancada visual

Esta revisão responde aos comentários de Breno: confirmação no canto, compra de item sem disponibilidade, áudio discreto demais, vitrine pouco separada e montagem sem uma bancada visual.

## Revisão de design

| Before (antes) | After (depois) | Why (motivo) |
| --- | --- | --- |
| Diálogo dependia da margem padrão do navegador | Posição fixa, margem automática, altura ajustada e limite pela janela | O reset de CSS retirou a centralização padrão; a regra explícita evita o canto da tela |
| Existir no catálogo bastava para adicionar ao carrinho | Oferta PIX disponível exigida pela API, revalidada no checkout | Interface desabilitada sozinha não impede uma requisição direta |
| Três tons graves simultâneos | Corpo grave e quatro notas curtas com ganho limitado | Dar mais definição ao momento de aprovação sem repetir áudio durante a entrega |
| Uma lista principal concentrava toda a navegação | Seleção de ofertas, departamentos fotográficos, convite da bancada e catálogo completo | Separar descoberta, consulta e compra, com espaço entre seções |
| Montador centrado nos selects | Bancada fotográfica com posições, aproximação, zoom e painel de seleção | Relacionar visualmente a peça escolhida ao conjunto e manter os controles acessíveis |
| Somente aparência clara | Tema claro/escuro persistido; fotos mantidas em sua apresentação original | Mudar superfícies e contraste sem escurecer as fotografias |

## Disponibilidade não é compatibilidade

Uma RTX 4090 pode existir no catálogo como referência técnica e ainda estar bloqueada para compra. A combinação de peças é analisada no montador; a compra depende das ofertas registradas no banco. Disponibilidade desconhecida também bloqueia. Não foi inventado estoque para liberar os 201 modelos sem oferta PIX elegível.

O servidor reconsulta as peças antes de aprovar, inclusive no fluxo de PC completo. Um item que ficou indisponível no carrinho recebe aviso e pode ser removido. A quantidade não representa reserva de estoque de loja externa. As consultas têm data e não são integração de estoque ao vivo.

## Como a bancada aproxima

Cada posição representa uma categoria. Ao clicar, o React escolhe o ponto de interesse; uma transformação CSS desloca e amplia a superfície. O navegador interpola `transform`, sem atualizar estado React a cada frame. Há visão geral, controle de zoom e seleção do modelo no painel. Teclado e movimento reduzido usam mudanças imediatas.

É uma bancada **fotográfica**, com fotos reais e posições ilustrativas. Não é montagem física em escala, encaixe automático ou detecção espacial. Os modelos opcionais Three.js continuam nas páginas de produto; esta etapa não substituiu as fotos por um gabinete conceitual.

## Entrega e confirmação

A aprovação real da simulação no servidor abre a celebração e dispara o áudio uma vez. O caminhão percorre uma rota ilustrativa até a casa; os rótulos mostram uma prévia, não eventos de transportadora. Repetir a animação não repete o som. Com movimento reduzido, aparece o estado final estático.

O diálogo fica centralizado na janela, pode rolar em telas baixas e conserva o foco. Ao sair da celebração, o checkout exibe o pedido concluído, sem convidar a repetir uma compra já aprovada.

## Tema e movimento

O botão de lua/sol no cabeçalho alterna a aparência. `theme-init.js` recupera a preferência antes de montar o React; `theme.css` define as cores escuras. Os estilos mantêm seus valores claros como fallback. Apenas a preferência visual é persistida; ela não é credencial.

Entradas de seção, hover das fotos, fade do carrossel, zoom e entrega animam principalmente opacidade e transformação. Não há contagem regressiva falsa, avaliações inventadas ou desconto calculado sem preço anterior confirmado.

## Exercícios de Breno e Kaio

1. Tentem adicionar a RTX 4090 indisponível e expliquem por que o bloqueio também precisa existir na API.
2. Alternem o tema e recarreguem uma página de produto.
3. Abram a bancada, aproximem a CPU, escolham um modelo e voltem à visão geral.
4. Comprem uma peça disponível e confiram centralização, áudio e prévia de entrega.
5. Ativem movimento reduzido no sistema/navegador e comparem o fluxo.

Ainda precisam da revisão subjetiva da dupla: timbre/volume em seus alto-falantes, uso em celular físico e se a bancada fotográfica corresponde à apresentação desejada.
