# Aula 08 — carrinho, compra avulsa e confirmação

Agora é possível comprar uma única peça, várias unidades do mesmo modelo ou produtos de categorias diferentes. O montador continua sendo o lugar para verificar se as peças formam um PC compatível; o carrinho não exige um computador completo.

## O caminho dos dados

1. O botão **Adicionar ao carrinho** envia somente o ID e a quantidade para a API.
2. `CartController` consulta o componente no DAO. `Cart` valida limites e calcula as linhas usando as ofertas do banco.
3. A sessão guarda os IDs/quantidades no Firestore pelo `SessionDAO`. Recarregar a página mantém o carrinho; entrar na conta preserva os itens do visitante.
4. O checkout exige login, cartão fictício, consentimento e a versão da cotação revisada.
5. O servidor confere os dados novamente. Se preço, disponibilidade ou itens mudarem, pede revisão em vez de registrar outro valor silenciosamente.
6. O pedido guarda um snapshot com quantidades e preços. A chave idempotente impede duplicar a mesma tentativa. Depois da confirmação, o carrinho fica vazio.

Limites: até 30 modelos e de 1 a 10 unidades por modelo. Os limites são validados no servidor, não apenas nos botões. Após a revisão de Breno, produtos sem oferta PIX disponível passaram a ser bloqueados na inclusão e na finalização. Eles continuam no catálogo/montador para consulta. Sair da conta encerra a sessão e seu carrinho; ele não é uma lista compartilhada entre dispositivos.

## Por que o som só toca no final

O diálogo começa conferindo o pedido, espera a resposta da API e apresenta a confirmação. A celebração e o som só são acionados após o servidor devolver o pedido registrado. Falha de rede ou validação não toca o som de sucesso.

O áudio é uma composição curta original com corpo grave e quatro notas de mallet, gerados pela Web Audio API com controle de ganho e compressor. Não é um arquivo copiado do Mercado Livre. O navegador recebe a autorização de áudio a partir do clique em confirmar. Há controle de som antes e durante o fluxo; a preferência ligada/desligada é o único dado deste recurso salvo em localStorage. Uma confirmação já apresentada não toca novamente ao recarregar o recibo. O trajeto animado de entrega é ilustrativo e não consulta transportadoras.

Movimento reduzido remove a celebração animada e as pausas decorativas. A confirmação textual permanece disponível.

## Carrossel da vitrine

O destaque alterna 16 produtos, com fade, setas, indicadores e pausa. A troca automática para quando o usuário interage, quando o carrossel fica fora da tela, com a aba oculta ou com movimento reduzido. Fotos e links correspondem aos produtos reais do banco.

## Exercício da dupla

- Breno adiciona uma CPU sem estar conectado, altera para duas unidades e recarrega o carrinho.
- Kaio explica por que mudar o preço pelo navegador não altera o total calculado no servidor.
- Entrem na conta e confirmem que os itens continuam lá.
- Comprem uma peça em simulação, observem as etapas e o som, consultem o recibo e sua quantidade.
- Desliguem o som e façam outra simulação; a preferência deve ser respeitada.
- No código, acompanhem `CartContext → API → CartController/Cart → ComponentDAO` e a persistência da sessão.

O `SessionDAO` também registra revogação no logout. Assim, uma gravação atrasada de carrinho não pode restaurar uma sessão que acabou de ser encerrada.
