# Aula 13 — Quantidades e refrigeração na bancada

A quantidade é de **unidades de compra**. Um kit de 32 GB com dois módulos ocupa dois slots DIMM. Dois kits desse modelo significam 64 GB e quatro slots. O montador mostra ambos os números e impede ultrapassar os slots e a capacidade de RAM confirmados da placa-mãe/CPU. Kits separados não garantem XMP/EXPO ou aprovação na QVL.

Armazenamento aceita quantidades e modelos diferentes: um NVMe para sistema e SSDs SATA adicionais, por exemplo. `partIds.storage` guarda o primeiro modelo, `storageIds` os demais e `quantities` a quantidade por ID. Remover o primeiro promove o seguinte. Até 16 unidades no projeto; omitir quantidade mantém a compatibilidade com montagens antigas (uma unidade).

M.2 é formato, não protocolo: um slot pode aceitar NVMe, SATA ou ambos. O servidor aloca cada unidade em uma conexão que aceita seu protocolo/comprimento, considera restrições por CPU e desconta portas SATA desativadas por compartilhamento. Exemplo real: B450M Steel Legend tem um M.2 para NVMe e outro somente SATA; na MSI PRO B760M-A WIFI, usar o segundo M.2 em SATA desativa a SATA8, mas usar NVMe ali não a desativa. Dados desconhecidos não são tratados como compatibilidade aprovada.

Um cooler separado é opcional **somente quando a versão exata do processador tem cooler incluído confirmado**. O custo dele já faz parte da CPU. Box/Tray/WOF e revisões de embalagem podem variar: não deduzimos a presença de cooler apenas pelo nome Ryzen ou Core. Quando não está confirmado, o montador solicita um cooler separado.

Air coolers e water coolers mostram seus sockets confirmados e podem ser filtrados por socket e tipo. Não presumimos que LGA1700 significa LGA1851 ou que AM4 significa AM5: cada suporte precisa constar na ficha. A análise também confere altura do air cooler ou tamanho nominal do radiador no gabinete. Montagem, temperatura real, posição/espessura do radiador, folga de RAM/cabos e conectores/baias de alimentação SATA ainda precisam de verificação de instalação; não são garantidos somente por potência ou socket.

As quantidades seguem para preços, reserva de potência, montagem salva, pedido, recibo, publicação pública e clonagem. A API recalcula no servidor; alterar um contador pelo navegador não permite aprovar um conjunto incompatível. Aumentar RAM ou SSDs não inventa um aumento de FPS.

## Fichas e fontes

`backend/data/benchHardware.json` contém 58 atualizações verificadas, incluindo mapas de 22 placas-mãe, versões de CPU com cooler, armazenamento e mais coolers. Somando o Noctua original, há **11 modelos com sockets confirmados: três air coolers e oito water coolers**. Os demais produtos do catálogo continuam identificados como não confirmados até termos fichas suficientes. Preços e disponibilidade continuam sendo das consultas de ofertas; a atualização técnica não inventa estoque nem altera preços.

Fontes por SKU ficam no próprio JSON. Exemplos: [ASRock B450M Steel Legend](https://www.asrock.com/MB/AMD/B450M%20Steel%20Legend/index.asp), [MSI PRO B760M-A WIFI](https://www.msi.com/Motherboard/PRO-B760M-A-WIFI/Specification), [Intel Laminar RM1](https://www.intel.com/content/www/us/en/support/articles/000089190/processors/intel-core-processors.html), [Montech NX600 ARGB](https://www.montechpc.com/nx600-argb), [Cooler Master Hyper 212 Spectrum V3](https://www.coolermaster.com/en-global/products/RR-S4NA-17PA-R1.html), [Corsair Nautilus 240 RS](https://www.corsair.com/us/en/p/cpu-coolers/cw-9060088-ww/nautilus-240-rs-liquid-cpu-cooler-cw-9060088-ww), [Corsair 5000D](https://www.corsair.com/us/en/p/pc-cases/cc-9011210-ww/5000d-airflow-tempered-glass-mid-tower-atx-pc-case-black-cc-9011210-ww).

## Firebase e execução local

O catálogo público local foi recomposto com essas fichas. A tentativa de sincronização ao Firestore retornou `Quota exceeded` (0/57 confirmadas na tentativa limitada; Montech acrescentado depois). As 58 atualizações estão preparadas em `backend/scripts/seedBenchHardware.js`, que valida ID/SKU, preserva ofertas e não modifica montagens. Executar novamente após a renovação da cota: `node --env-file=backend/.env backend/scripts/seedBenchHardware.js`. Operações privadas e checkout continuam exigindo o banco; o catálogo local não simula gravação ou aprovação financeira.

O botão **Atualizar catálogo** no seletor renova as fichas sem apagar a montagem. O cache do catálogo mudou de versão para descartar fichas antigas.

## Revisão da interface

| Antes | Depois | Motivo |
|---|---|---|
| Uma RAM sem quantidade | Kits, módulos, capacidade e slots ocupados | O preço do kit e o espaço físico são grandezas diferentes. |
| Um armazenamento | Vários modelos, quantidades e conexões alocadas | Representar uma montagem real com NVMe e SATA. |
| Cooler sempre obrigatório | Incluído na CPU ou separado, conforme o SKU | Evitar cobrar uma peça opcional. |
| Produtos sem sockets ficavam bloqueados | Mais fichas verificadas e filtro por socket | Oferecer alternativas sem remover a proteção de compatibilidade. |

Validação: suíte automatizada do backend, fluxo HTTP de salvar/reabrir/comprar com quantidades, build de produção e Chrome em desktop/390/320 px. A conferência pública local não substitui a verificação de gravações no Firestore após a cota renovar.
