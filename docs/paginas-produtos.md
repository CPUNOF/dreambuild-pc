# Páginas de produtos — 30/10/2026

## O que ficou pronto

A vitrine agora abre páginas React com endereço próprio, galeria, ampliação, código exato da variante, descrição e ficha técnica. Não há preço, estoque ou avaliação inventados. As três lojas aparecem como locais de futuras ofertas cadastradas, sem botão de compra ainda.

O estilo da loja aprovado foi preservado: cabeçalho azul escuro, ações laranja e produto fotografado sobre fundo claro. O gabinete conceitual continua fora da página inicial.

## Como o React organiza isso

Uma **rota** associa um endereço a uma página. O React Router foi adicionado para que `/` abra a loja e `/produto/:slug` abra um produto. O **slug** é o trecho legível do endereço, como `amd-ryzen-7-7800x3d`.

Um **componente** é uma parte reutilizável da interface. `ProductPage` recebe o produto identificado pela rota; `ProductGallery` controla a imagem selecionada e a ampliação. Alterar uma miniatura muda o estado da galeria sem recarregar o site inteiro.

| Arquivo | Responsabilidade |
| --- | --- |
| `frontend/src/main.jsx` | Habilita o roteador. |
| `frontend/src/App.jsx` | Compartilha cabeçalho/rodapé e escolhe a página pela rota. |
| `frontend/src/pages/HomePage.jsx` | Preserva a vitrine e seus filtros. |
| `frontend/src/pages/ProductPage.jsx` | Exibe o produto ou informa endereço inexistente. |
| `frontend/src/components/ProductGallery.jsx` | Miniaturas, setas, teclado e diálogo de imagem ampliada. |
| `frontend/src/data/products.js` | Fonte da carga inicial e URLs das fichas oficiais; a interface consulta a API. |
| `frontend/public/hardware/official/manifest.json` | Origem interna das dez fotografias em uso. |
| `frontend/vercel.json` | Regra de rotas para a publicação futura do front-end; ainda não validada em hospedagem real. |

## Exercício em dupla

1. Breno: abra a loja, entre no Ryzen e copie seu endereço. Cole esse endereço em outra aba e atualize a página.
2. Kaio: localize no código o modelo `100-100000910WOF` e compare com a ficha exibida.
3. Troquem a imagem por miniatura, abram a ampliação e usem Escape para fechar.
4. Busquem “Corsair” pelo cabeçalho e expliquem por que somente uma peça aparece.
5. Expliquem juntos: onde o catálogo fica guardado e quem tem permissão para acessá-lo?

Resposta atual: **no Firestore**, consultado pelo servidor através do DAO e entregue ao React pela API. O arquivo JavaScript serve à carga inicial e aos nomes dos departamentos. O navegador não recebe a chave nem acessa o Firestore diretamente.

## Verificação realizada

- Quatro URLs diretas e atualização da página; navegação com voltar/avançar.
- Miniaturas, setas, teclado, ampliação, Escape e retorno de foco.
- Busca pelo cabeçalho a partir de uma página de produto e páginas inexistentes.
- Larguras 320, 390, 768, 1024 e 1440 pixels sem rolagem horizontal.
- Fotografias carregadas e variantes/fichas correspondentes; nenhuma falha JavaScript nos fluxos verificados.
- Build e 13 testes aprovados; leitura real em outro processo, paginação e repetição segura da carga verificadas.

O teste de navegador foi uma verificação local desta entrega, com leitura real do catálogo pelo Firestore. Celular físico e hospedagem pública ainda não foram validados.
