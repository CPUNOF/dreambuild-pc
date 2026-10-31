# Aula 12 — Ranking público e referências de FPS

## Como experimentar

1. Abra **Ranking de PCs** no menu (`/ranking`). A consulta é pública; projetos privados nunca entram automaticamente.
2. Em **Explorar os testes de 19 GPUs** (`/referencias-fps`), selecione GPU A, uma adversária opcional, resolução e jogo. São **19 GPUs, 12 jogos e 456 resultados publicados**. A animação é ilustrativa e não mede o navegador.
3. Entre na conta, monte um PC compatível com as categorias obrigatórias e salve. Cooler separado é opcional quando incluído no SKU da CPU (Aula 13). Em **Minhas montagens**, escolha **Publicar meu PC**.
4. Confira a prévia, escolha apelido e nome públicos e marque o consentimento. Nenhum e-mail, nome da conta ou nome privado da montagem é publicado.
5. A ficha pública tem peças, cotações com fontes/datas, resultados dos jogos, link compartilhável, **Colocar em combate** e **Montar uma versão minha**. Esta última cria uma seleção editável; não altera o projeto do autor.
6. Em **Minhas publicações**, use **Retirar publicação** para remover a ficha e suas duas classificações. A montagem privada continua salva. Excluir apenas a montagem privada não retira uma publicação: ela é um snapshot separado, como informado no diálogo.

## O que o ranking compara

Há classificações separadas em **1080p e 1440p**, por FPS estimado ou por FPS por real do projeto. Os participantes precisam usar a mesma versão da base e o mesmo conjunto fixo de dez jogos. O orçamento soma cotações PIX válidas de todas as unidades escolhidas, sem frete; a ficha registra as datas. Cotação parcial não recebe uma posição por custo-benefício. O indicador da tela é `média estimada ÷ preço em reais × 1.000`, em FPS por R$ 1.000.

Cada publicação só possui uma entrada por montagem/versão/resolução. Republicar a mesma montagem atualiza a entrada; não duplica participantes. Empates de pontuação têm desempate estável pelo ID. A tela exibe os 20 primeiros da categoria e a galeria as 20 publicações mais recentes. A lista privada usa paginação para permitir retirar inclusive publicações mais antigas.

**Este é um ranking de estimativas experimentais, não de desempenho medido nos PCs dos participantes.** Não há medições de todas as combinações possíveis. O modelo usa o menor valor entre a referência publicada da GPU e uma curva de teto baseada na GPU mais rápida da base, ajustada pelo índice médio da CPU, limitada à CPU de teste. Não há validação por jogo ou margem de erro demonstrada. RAM, drivers, refrigeração e BIOS não recebem fatores inventados.

Uma CPU/GPU sem correspondência exata fica sem FPS estimado e sem posição, mas a montagem compatível pode ser publicada na galeria. As referências publicadas da GPU podem ser exploradas separadamente em `/referencias-fps`, no PC do laboratório de origem. O quadro técnico da publicação indica cobertura e versão.

## Base de referência V2

`backend/data/referenceBenchmarks.json`, versão **reference-2026-10-30-v2**, preserva qualidade gráfica, resolução, VRAM, fontes e computador de teste. Identificação de chip impede herdar resultados de Ti, Super, XT, XTX, GRE ou variantes móveis. Variantes de 8 e 16 GB são independentes; RTX 3060 sem VRAM confirmada não herda automaticamente a variante de 12 GB.

| Família | Modelos cobertos |
| --- | --- |
| GeForce | RTX 3060 12 GB; 4060; 4060 Ti 8/16 GB; 4070; 4090; 5060; 5060 Ti 8/16 GB; 5070; 5070 Ti; 5080 |
| Radeon | RX 7600; 7600 XT; 7700 XT; 7800 XT; 9060 XT 16 GB; 9070; 9070 XT |

Os 12 jogos são Assassin’s Creed Mirage, Baldur’s Gate 3, Black Myth: Wukong, Dragon Age: The Veilguard, Final Fantasy XVI, Flight Simulator 2020/2024, God of War Ragnarök, Horizon Forbidden West, The Last of Us Part I, A Plague Tale: Requiem e S.T.A.L.K.E.R. 2. Baldur’s Gate 3 (diferenças de patches entre análises) e Flight Simulator 2024 ficam fora da média de dez jogos do ranking. O site mantém as 12 fichas para consulta.

Fontes primárias do laboratório:

- [Testes da RTX 5080 e GPUs comparadas](https://www.tomshardware.com/pc-components/gpus/nvidia-geforce-rtx-5080-review/4).
- [Testes da RX 9070 XT e RTX 5070 Ti](https://www.tomshardware.com/pc-components/gpus/amd-radeon-rx-9070-xt-review/4).
- [Testes da RX 9060 XT, RTX 5060, 5060 Ti 8/16 GB e outras GPUs](https://www.tomshardware.com/pc-components/gpus/amd-radeon-rx-9060-xt-16gb-review/4), com [equipamento e condições](https://www.tomshardware.com/pc-components/gpus/amd-radeon-rx-9060-xt-16gb-review/3).
- [Índice publicado de CPUs](https://www.tomshardware.com/reviews/cpu-hierarchy,4312.html), com 30 perfis reconhecidos na base.

As análises usaram Ryzen 7 9800X3D e 32 GB DDR5-6000. Drivers e versões de jogos variam entre publicações; a análise da RX 9060 XT lista CL28 no equipamento e menciona CL30 no texto. Essa diferença é registrada, sem fingir condições perfeitamente idênticas entre todos os resultados.

Os números foram conferidos nas resoluções impressas nos gráficos. A ordem dos gráficos varia entre páginas; a importação não assume posição fixa de 1080p/1440p. Valores com reconhecimento óptico incerto foram lidos nos números originais. Gráficos da fonte não foram copiados para a interface pública. O trailer oficial do jogo é uma prévia, não captura da montagem.

## Onde cada parte do código trabalha

| Arquivo | Responsabilidade |
| --- | --- |
| `models/ReferencePerformance.js` | Identificar CPU/GPU/VRAM, calcular estimativas e elegibilidade do conjunto fixo |
| `models/CommunityBuild.js` | Validar consentimento/campos, hash da prévia e resumo sem dados privados |
| `controllers/CommunityController.js` | Conferir dono, revalidar peças/preços, preparar e publicar a prévia |
| `dao/CommunityDAO.js` | Transações e consultas reais no Firestore, cache público e remoção atômica |
| `PublicationDialog.jsx` | Mostrar prévia e recolher apelido, título e consentimento |
| `RankingPage.jsx` / `PublicBuildPage.jsx` | Classificação, galeria, ficha pública e acesso ao combate |
| `BenchmarkReferencesPage.jsx` | Explorar/comparar referências publicadas sem login |
| `MyPublicationsPage.jsx` | Listar e retirar apenas as próprias publicações |

O servidor recalcula preços e FPS. O navegador não pode enviar uma pontuação. Se preços, peças ou base mudarem entre prévia e confirmação, a API responde 409 e exige revisar a nova prévia e confirmar novamente.

No Firestore, `public_builds` mantém o snapshot público e referências internas de dono/montagem. A API pública devolve somente o snapshot. `community_rankings/{versão-resolução}/entries` mantém índices derivados para classificação, evitando ler todas as fichas para ordenar. Publicação e retirada atualizam ficha e índices na mesma transação.

## Cota gratuita e verificação real

A V2 foi **gravada com sucesso no Firebase dreambuild-pc**, em um único documento de `benchmark_datasets`. Em seguida, a API real confirmou `/api/benchmarks` com status 200, V2 e 19 GPUs. As consultas reais de ranking/galeria ainda retornaram **503 por cota de leitura excedida**. Portanto, a implementação está concluída e testada, mas a conferência de ponta a ponta no Firestore real depende da renovação da cota, conforme a decisão de Breno de manter o plano gratuito. Nenhum PC foi publicado automaticamente para demonstrar a tela.

Consultas públicas não carregam sessão. O DAO compartilha consultas simultâneas e usa cache de dez minutos, invalidado ao publicar/retirar. Ao receber cota excedida, aguarda cinco minutos antes de uma nova tentativa pública, somente quando houver novo acesso. Não há polling. Operações privadas continuam autenticadas e frescas; falha de banco não é convertida em publicação falsa ou sucesso local.

Comando para importar somente a base, sem alterar PCs prontos ou publicar montagens:

```powershell
node --env-file=backend/.env backend/scripts/seedReferences.js --dataset-only
```

## Evidências

Os testes mantidos em `backend/test/community.test.js` verificam 456 pontos, variantes de GPU/VRAM, dados ausentes, consentimento, adulteração, dono, CSRF, prévia, paginação, transações, cache, retirada e resposta de cota. A suíte completa passou com **60 testes**; build aprovado e auditoria de produção sem vulnerabilidades reportadas. O teste de navegador usou dados **isolados**: publicação, ficha com oito peças, combate, cópia editável, resolução/custo, galeria, referências e retirada; nenhuma publicação de teste chegou ao Firebase. Chrome em 1254/390/320 px, tema escuro e ausência de erros JavaScript/overflow nas telas conferidas. A página real de referências, sem mocks, também confirmou 19 GPUs/12 jogos e 320 px sem overflow. Quando a API usa a cópia local versionada, informa `dataOrigin: curated-local` e a tela exibe o aviso correspondente. As capturas ficam em `tmp/`, ignorado pelo Git.

| Before | After | Why |
| --- | --- | --- |
| Duas GPUs nas referências | 19 modelos e variantes, 12 jogos, 456 pontos | Cobrir mais peças do catálogo com dados verificáveis |
| Projetos apenas privados | Publicação voluntária com prévia e retirada | Compartilhar sem revelar a conta |
| Comparação sem classificação pública | Cenários por resolução, versão e jogos fixos | Evitar médias de conjuntos de jogos diferentes |
| Sem distinção de orçamento no ranking | Custo-benefício exige preço completo e datado | Não premiar um projeto com peças sem preço |

## Exercício da dupla

Breno: explique a diferença entre o FPS publicado de uma GPU e a estimativa de uma montagem. Kaio: acompanhe o caminho React → Controller → Model → DAO → Firestore e explique por que os FPS não vêm do formulário. Depois invertam e tentem publicar com uma peça faltando, trocar 8 por 16 GB e retirar uma publicação.

