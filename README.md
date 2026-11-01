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
- Montagens privadas, pedido simulado, recibo, histórico e perfis de administração.
- Referências de FPS, comparação de PCs/notebooks e publicação voluntária de montagens com ranking por resolução/desempenho/custo.

As validações automatizadas usam dados isolados; não comprovam por si só os fluxos na hospedagem ou em um Firestore sem cota disponível. A configuração de CORS, cookies, HTTPS, login Google e WebSocket precisa ser validada nos domínios publicados.

## Testes (VV&TS)

```bash
npm test                # unitários, API e integração (back-end + front-end)
npm run test:e2e        # interface com Cypress (API simulada)
npm run test:e2e:full   # fluxo completo navegador → API real com dados em memória
npm run test:regressao  # tudo + JUnit + cobertura + relatório
```

Na primeira vez, rode `npx --workspace frontend cypress install` (o `.npmrc` desativa scripts de instalação). Plano, casos de teste, rastreabilidade, defeitos e relatório: [`docs/testes/`](docs/testes/README.md).

## Dados e limites

Os FPS publicados são referências de testes externos com fontes e condições identificadas. A estimativa de uma montagem e a simulação animada não são medições feitas no computador do visitante. Preços e estoque são consultas datadas; não há atualização automática em tempo real das lojas.

O catálogo público tem uma cópia local identificada para consulta durante indisponibilidade do banco. Salvar montagens, administrar, publicar no ranking e finalizar compras continuam exigindo validação no backend e persistência real. Na preparação desta versão, a sincronização de novas fichas técnicas e a conferência final do ranking no Firestore estavam pendentes por cota excedida.

Fotos, nomes e marcas pertencem aos respectivos titulares. As fontes das ofertas, especificações e benchmarks estão preservadas nos dados e na documentação. O projeto tem finalidade acadêmica e não representa as lojas ou fabricantes consultados.

