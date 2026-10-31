# DreamBuild PC

Projeto acadêmico de **Breno Dantas e Kaio Marques**.

Loja de hardware com catálogo, carrinho, montagem de computadores, verificação de compatibilidade, comparação de preços, compra simulada e comunidade de configurações. As compras não geram cobranças nem entregas reais.

## Tecnologias

- React, Vite e React Router na interface.
- Node.js e Express na API REST, organizada em MVC e DAO.
- Firebase Firestore para persistência e Firebase Authentication para login Google.
- Sessões com cookie HttpOnly, proteção CSRF e autorização CLIENT/ADMIN no servidor.
- Socket.IO para a simulação didática em tempo real.
- OpenAPI/Swagger e testes com o executor nativo do Node.js.

## Recursos

- Catálogo de 317 produtos com fotos, fichas, fontes e datas das ofertas.
- Busca, departamentos, carrossel, páginas de produto, carrinho e temas claro/escuro com fundo animado.
- Bancada com seleção e remoção de peças, kits de RAM, quantidades e múltiplos armazenamentos.
- Verificação de socket, geração de RAM, slots DIMM, M.2 NVMe/SATA, portas compartilhadas, refrigeração e requisitos da fonte.
- Cooler separado opcional quando a versão da CPU tem cooler incluído confirmado.
- Montagens privadas, pedido simulado, recibo, histórico e perfis de administração.
- Referências de FPS, comparação de PCs/notebooks e publicação voluntária de montagens com ranking por resolução/desempenho/custo.

## Executar localmente

Requisitos: **Node.js 22.12 ou superior**, npm e um projeto Firebase configurado.

```powershell
npm.cmd ci
Copy-Item backend/.env.example backend/.env
```

Edite `backend/.env`: informe o ID do seu projeto, o caminho absoluto da credencial de serviço e um `SESSION_SECRET` aleatório com pelo menos 32 caracteres. Guarde a credencial fora dos arquivos versionados. Não coloque segredos em variáveis `VITE_*`.

Para gerar uma chave de sessão local:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

No Firebase, configure o Firestore e habilite Google como provedor de autenticação caso queira usar esse login. O procedimento está na [documentação de configuração](docs/aula-02-firebase.md).

Para preparar um banco novo, execute as cargas iniciais na ordem:

```powershell
npm.cmd run check:firebase --workspace backend
npm.cmd run seed:catalog --workspace backend
npm.cmd run seed:hardware --workspace backend
npm.cmd run seed:offers --workspace backend
npm.cmd run seed:games --workspace backend
node --env-file=backend/.env backend/scripts/seedReferences.js
npm.cmd run seed:expanded --workspace backend
npm.cmd run seed:availability --workspace backend
node --env-file=backend/.env backend/scripts/seedBenchHardware.js
npm.cmd run create:demo --workspace backend
npm.cmd run dev
```

Não repita as cargas a cada abertura. Consulte as mensagens dos comandos e resolva falhas de configuração/cota antes de prosseguir. Os comandos administrativos de atualização técnica podem alterar as fichas correspondentes; mantenha cópia das suas edições antes de executá-los em outro catálogo.

| Serviço | Endereço local |
| --- | --- |
| Site | http://127.0.0.1:5173/ |
| Administração | http://127.0.0.1:5173/admin |
| API | http://127.0.0.1:3001/api/health |
| Swagger | http://127.0.0.1:5173/api-docs/ |
| OpenAPI | http://127.0.0.1:5173/openapi.json |

`npm.cmd run dev` inicia frontend e backend; Ctrl+C encerra. Em outros sistemas, utilize `npm` no lugar de `npm.cmd`.

## Contas e segurança

O cadastro público cria somente clientes. O comando `create:demo` prepara contas de demonstração CLIENT/ADMIN e grava as senhas aleatórias somente em `backend/.secrets/demo-accounts.json`, ignorado pelo Git. Combine o acesso de avaliação por canal privado. Não há senhas de demonstração publicadas neste repositório.

`.env`, chaves privadas, sessões, senhas e caches não fazem parte da entrega. Os arquivos `.env.example` contêm apenas modelos de configuração.

## Organização

```text
backend/
  src/controllers/   Coordenação das requisições
  src/models/        Regras e validação
  src/dao/           Persistência e transações
  src/views/         Respostas JSON
  src/middlewares/   Sessão, autorização e CSRF
  src/websocket/     Simulação autenticada
  data/              Dados públicos e fontes
  scripts/           Configuração e cargas administrativas
  test/              Testes automatizados
frontend/
  src/pages/         Páginas React
  src/components/    Componentes e controles
  src/context/       Estado compartilhado
  src/api/           Cliente HTTP
  public/            Imagens e recursos públicos
shared/              Regras compartilhadas de seleção e recursos
docs/                Documentação técnica
```

## Verificação

```powershell
npm.cmd test
npm.cmd run build
```

As validações automatizadas usam dados isolados; não comprovam por si só os fluxos na hospedagem ou em um Firestore sem cota disponível. A configuração de CORS, cookies, HTTPS, login Google e WebSocket precisa ser validada nos domínios publicados.

## Dados e limites

Os FPS publicados são referências de testes externos com fontes e condições identificadas. A estimativa de uma montagem e a simulação animada não são medições feitas no computador do visitante. Preços e estoque são consultas datadas; não há atualização automática em tempo real das lojas.

O catálogo público tem uma cópia local identificada para consulta durante indisponibilidade do banco. Salvar montagens, administrar, publicar no ranking e finalizar compras continuam exigindo validação no backend e persistência real. Na preparação desta versão, a sincronização de novas fichas técnicas e a conferência final do ranking no Firestore estavam pendentes por cota excedida.

Fotos, nomes e marcas pertencem aos respectivos titulares. As fontes das ofertas, especificações e benchmarks estão preservadas nos dados e na documentação. O projeto tem finalidade acadêmica e não representa as lojas ou fabricantes consultados.

Consulte o [índice da documentação](docs/README.md), o [contrato da API](docs/api.md) e os [limites de validação](docs/limites-e-validacao.md).
