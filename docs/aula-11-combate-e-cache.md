# Aula 11 — Combate de PCs, referências e economia no Firebase

## Configurações com preços

`/combate` permite escolher os lados A/B, resolução, jogo e prévia animada. A consulta de 30/10/2026 confirmou estes valores exibidos nos anúncios do marketplace KaBuM!, sem frete:

| Equipamento | Valor à vista listado | Estoque |
| --- | ---: | --- |
| [BluePC, 9800X3D, RTX 5080, 32 GB](https://www.kabum.com.br/produto/1076725) | R$ 24.892,94 | Disponível |
| [Kalango, 9800X3D, RTX 5080, 64 GB](https://www.kabum.com.br/produto/881022) | R$ 36.799,20 | Disponível |
| [Nitro V 15 ANV15-51-51UZ, i5-13420H, RTX 4050, 16 GB](https://www.kabum.com.br/produto/876264) | R$ 6.299,10 | Sem estoque |
| [ASUS TUF A15, Ryzen 7 7735HS, RTX 4050, 16 GB](https://www.kabum.com.br/produto/497084) | R$ 12.060,00 | Sem estoque |

Nos notebooks, é o preço exibido por uma loja sem estoque, não uma oferta comprável. A tela informa isso junto do valor. Não foi localizada nesta rodada outra oferta nova disponível da configuração exata dos testes; nenhuma disponibilidade foi fabricada. As fotos reais foram guardadas no projeto para carregar com consistência.

Equipamentos completos são, por enquanto, opções de comparação. Ainda não são SKUs compráveis pelo carrinho de peças. O carrinho existente continua validando preço e estoque no servidor.

## FPS: o que os números representam

Há 12 jogos de desktop, 12 do Nitro e 10 do ASUS. Os desktops têm referências 1080p/1440p; os notebooks receberam somente os resultados 1080p localizados. A média usa apenas IDs, presets e resoluções em comum. Cenas, versões e drivers ainda podem diferir; a tela não comprova um campeão.

Fontes primárias:

- [Tom’s Hardware: testes gráficos](https://www.tomshardware.com/pc-components/gpus/nvidia-geforce-rtx-5080-review/4) e [bancada usada](https://www.tomshardware.com/pc-components/gpus/nvidia-geforce-rtx-5080-review/3).
- [Notebookcheck: Nitro V 15 ANV15-51-582S](https://www.notebookcheck.net/Acer-Nitro-V-15-ANV15-51-review-Budget-gaming-laptop-with-RTX-4050.794098.0.html).
- [Notebookcheck: ASUS TUF A15 FA507](https://www.notebookcheck.net/Asus-TUF-Gaming-A15-laptop-review-A-budget-gamer-with-an-RTX-4050-and-a-144-Hz-screen.725720.0.html).
- [Índice publicado de CPUs](https://www.tomshardware.com/reviews/cpu-hierarchy,4312.html).

Os PCs anunciados não foram medidos pelo DreamBuild. A bancada publicada usa a mesma CPU/GPU principal, mas RAM, refrigeração e outras peças podem diferir. Os notebooks brasileiros têm diferenças de SKU, sistema operacional e/ou SSD em relação aos testados. Os 75 W do Nitro e 95 W do ASUS pertencem às unidades do teste; o TGP não foi confirmado no anúncio brasileiro. Esses limites ficam nos detalhes da tela.

O trailer oficial da Steam é ilustrativo, sem áudio. O indicador oscilante não é uma medição, mínimo, 1% low ou intervalo de erro. Não há jogo sendo executado no navegador. HLS só é carregado ao iniciar a prévia, para ao sair e pausa com a aba oculta; movimento reduzido mantém o indicador estável.

A primeira versão reconhecia 30 modelos de CPU e apenas RTX 4090/5080. A atualização V2 amplia para 19 GPUs, 12 jogos e 456 FPS publicados, com média do ranking em dez jogos fixos. A [Aula 12](aula-12-ranking-e-fps.md) registra fontes, regras e limites atuais. Continua sendo estimativa experimental, sem calibração por jogo/conjunto ou correção inventada de RAM. A simulação matemática original permanece em uma aba didática separada, via WebSocket.

## Responsabilidade dos arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| `backend/data/readySystems.json` | Configurações, preços, vendedores, estoque, fotos e limites das referências |
| `backend/data/referenceBenchmarks.json` | Dados numéricos conferidos, fontes, presets e versão |
| `backend/src/dao/ReferenceDAO.js` | Firestore e cache das referências públicas |
| `backend/src/controllers/ReferenceController.js` | Rotas e autorização da montagem privada |
| `backend/src/models/ReferencePerformance.js` | Reconhecimento de modelos e estimativa identificada |
| `frontend/src/pages/BattlePage.jsx` | Escolha visual dos lados e confronto |
| `frontend/src/pages/PerformanceBenchPage.jsx` | Referências do PC salvo, separadas da simulação didática |
| `frontend/src/components/FpsStage.jsx` | Indicador ilustrativo e controles |
| `frontend/src/components/GamePreview.jsx` | Trailer oficial e alternativa em caso de falha |

## Por que houve cota excedida

Em 30/10 o banco retornou `RESOURCE_EXHAUSTED: Quota exceeded`. O catálogo completo repetia quatro consultas paginadas. São aproximadamente 320 leituras para 317 produtos, incluindo os documentos extras para detectar a próxima página. Recargas de desenvolvimento repetiam esse custo.

A [documentação do Firestore](https://firebase.google.com/docs/firestore/quotas) informa 50.000 leituras/dia na franquia gratuita e renovação diária perto de meia-noite no fuso do Pacífico. O painel do projeto permite conferir o consumo efetivo. Breno escolheu manter o plano gratuito e aguardar a renovação; nenhuma cobrança foi alterada.

Cache significa reaproveitar uma consulta recente:

- A API compartilha o catálogo por 30 minutos, inclusive consultas simultâneas.
- `backend/.cache/public-catalog.json`, ignorado pelo Git, preserva consultas públicas após reiniciar a API. Falha no disco não impede o cache em memória.
- A aba reaproveita o catálogo por cinco minutos em `sessionStorage`. Ali só ficam fichas públicas, sem senha, token Google, pedidos ou sessão privada.
- Alterações pelos endpoints administrativos invalidam o cache da API. Atualizar a vitrine ignora a cópia da aba; eventos de alteração também a limpam.
- Sessões com `rolling:false` mantêm prazo fixo de oito horas. Consultas sem mudanças deixaram de regravar seu prazo; alterações reais continuam persistidas.
- O combate público tem cache de 30 minutos; benchmarks são reutilizados por versão.
- Autorização, desativação de conta, proprietário, sessão e preço/estoque para compra continuam sendo conferidos no servidor.

**Teste controlado: 100 cargas completas na mesma janela passaram de 32.000 para 320 leituras simuladas do catálogo, redução de 99%.** Isso não inclui leituras privadas nem oferece uso ilimitado. Expiração, alterações administrativas e outros processos podem consultar novamente. Em publicação com várias instâncias, será necessário compartilhar o cache antes de extrapolar esse resultado.

Mudanças diretas pelo Console ou por scripts externos aparecem após a validade do cache. Para importação imediata, limpe o arquivo de cache e reinicie a API; os endpoints administrativos já invalidam automaticamente.

Durante a cota excedida, a vitrine mostra as 317 fichas/cotações das fontes versionadas, com aviso. O combate mantém seus registros verificados. Isso não autoriza login, gravação ou checkout offline. Consultas públicas com cota excedida aguardam cinco minutos antes de tentar o banco novamente em um novo acesso, sem consulta contínua em segundo plano.

## Google e decisões visuais

Breno ativou o provedor Google. O app web foi registrado, os domínios locais autorizados e o botão abre a página oficial de login. O Admin SDK valida token, revogação, provedor e e-mail verificado. Novos usuários recebem `CLIENT`. Uma conta local com o mesmo e-mail exige entrar com senha e vincular explicitamente, preservando seu papel.

`googleWebConfig.json` é configuração pública do app web. A chave privada permanece em `.secrets`, ignorada pelo Git. O navegador usa somente Authentication, com persistência em memória; Firestore continua no backend. A conclusão de login real e os fluxos privados precisam de conferência após a renovação da cota. Nenhuma credencial pessoal foi preenchida no teste do popup.

O 3D foi descartado por Breno: produto usa fotos e a dependência Three.js foi removida. Arquivos históricos não representam uma etapa futura. A bancada passou a usar grade fixa, detalhes no painel, voltar/avançar e seleção por plataforma. Combinações incompatíveis de socket/DDR são bloqueadas no seletor e na gravação do servidor.

| Antes | Depois | Por quê |
| --- | --- | --- |
| Aproximação deslocava peças | Grade fixa e painel de detalhes | Cliques previsíveis |
| Fundo estático | Luzes suaves e textura com pausa | Ambiente sem deslocar conteúdo |
| FPS matemático isolado | Referências com fonte e prévia identificada | Contextualizar a animação |
| Novas bibliotecas na entrada | Google e HLS carregados separadamente | Reduzir o trabalho inicial |

## Pendências explícitas

Ranking e publicação voluntária foram implementados na atualização descrita na [Aula 12](aula-12-ranking-e-fps.md), com prévia, apelido, peças, cotações datadas e retirada. A base V2 já foi gravada no Firebase; a validação completa do ranking no banco real aguarda renovação da cota de leitura. Permanecem a revisão humana, cobertura de combinações ainda não documentadas, ofertas disponíveis dos notebooks, GitHub e hospedagem após aprovação de Breno.
