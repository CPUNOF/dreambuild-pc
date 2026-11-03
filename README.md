# DreamBuild PC

Projeto acadêmico de **Breno Dantas e Kaio Marques**.

Loja de hardware com catálogo, carrinho, montagem de computadores, verificação de compatibilidade, comparação de preços, compra simulada e comunidade de configurações. As compras não geram cobranças nem entregas reais.

## Tecnologias

- React, Vite e React Router na interface.
- Node.js e Express na API REST, organizada em MVC e DAO.
- Firebase Firestore para persistência e Firebase Authentication para login Google.
- Sessões com cookie HttpOnly, proteção CSRF e autorização CLIENT/ADMIN no servidor.
- Socket.IO para a simulação didática em tempo real.
- OpenAPI/Swagger.
- Testes: `node:test` (back-end), Vitest + Testing Library (front-end), Cypress (interface e fluxo completo) e GitHub Actions.

## Recursos

- Catálogo de 317 produtos com fotos, fichas, fontes e datas das ofertas.
- Busca, departamentos, carrossel, páginas de produto, carrinho e temas claro/escuro com fundo animado.
- Bancada com seleção e remoção de peças, kits de RAM, quantidades e múltiplos armazenamentos.
- Verificação de socket, geração de RAM, slots DIMM, M.2 NVMe/SATA, portas compartilhadas, refrigeração e requisitos da fonte.
- Cooler separado opcional quando a versão da CPU tem cooler incluído confirmado.
- Montador por etapas, com quantidades e slots junto de cada peça, modelos incompatíveis ocultos e resumo recolhível no celular.
- Vitrines por finalidade, carrinho lateral, zoom na galeria e comparação de vantagens entre setups.
- Cartão PNG da montagem pública, com peças, preço, data e indicação de referências/estimativas de FPS.
- Montagens privadas, pedido simulado, recibo, histórico e perfis de administração.
- Estoque próprio simulado com preço por unidade, entradas, saídas, inventário, alertas e histórico; a compra aprovada dá baixa em uma transação no Firestore.
- Referências de FPS, comparação de PCs/notebooks e publicação voluntária de montagens com ranking por resolução/desempenho/custo.

## Acesso e estoque

Aplicação: https://dreambuild-pc.vercel.app/ · Código: https://github.com/CPUNOF/dreambuild-pc

Entre com uma conta ADMIN e abra **Administração → Estoque de produtos**. Use **Gerenciar** para receber unidades, cadastrar o preço simulado, ajustar o limite de alerta ou registrar uma contagem. É obrigatório informar o motivo. Produtos sem cadastro começam com saldo zero; preços e disponibilidade das outras lojas não criam estoque na DreamBuild.

Na preparação da demonstração, foram cadastradas 50 unidades por produto e completados os preços próprios com valores acadêmicos quando não havia cotação. As movimentações posteriores alteram os saldos normalmente. Esses preços permitem exercitar o carrinho e o checkout; as ofertas externas continuam com suas fontes e datas, separadas dos valores da simulação.

A compra avulsa e a compra de uma montagem exigem saldo para todas as unidades. Pedido, baixas e histórico são gravados juntos; uma repetição da mesma confirmação não desconta duas vezes. A documentação da API está em `/api-docs/`, com link no rodapé para administradores; suas operações protegidas exigem sessão e autorização no servidor.

Os testes automatizados usam dados isolados. Os fluxos de estoque também foram conferidos no navegador com Firestore, incluindo disputa pela última unidade e compra de montagem com quantidades de RAM e armazenamento.

## Testes (VV&TS)

```bash
npm test                # unitários, API e integração (back-end + front-end)
npm run test:e2e        # interface com Cypress (API simulada)
npm run test:e2e:full   # fluxo completo navegador → API real com dados em memória
npm run test:regressao  # tudo + JUnit + cobertura + relatório
```

Na primeira vez, rode `npx --workspace frontend cypress install` (o `.npmrc` desativa scripts de instalação). Plano, casos de teste, rastreabilidade, defeitos e relatório: [`docs/testes/`](docs/testes/README.md).

## Dados e limites

Os FPS publicados são referências de testes externos com fontes e condições identificadas. A estimativa de uma montagem e a simulação animada não são medições feitas no computador do visitante. Ofertas e estoques externos são consultas datadas; não há atualização automática em tempo real das lojas. O saldo próprio da DreamBuild muda pelas movimentações administrativas e pelas compras acadêmicas aprovadas.

O catálogo público tem uma cópia local identificada para consulta durante indisponibilidade do banco. Salvar montagens, administrar, publicar no ranking e finalizar compras exigem validação no backend e persistência real. O banco e a hospedagem estão sujeitos às cotas dos respectivos planos. A verificação final de saldo e preço acontece na confirmação da compra. Cancelamento e devolução com estorno de estoque ainda não estão implementados.

Fotos, nomes e marcas pertencem aos respectivos titulares. As fontes das ofertas, especificações e benchmarks estão preservadas nos dados e na documentação. O projeto tem finalidade acadêmica e não representa as lojas ou fabricantes consultados.

