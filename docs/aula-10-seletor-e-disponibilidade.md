# Aula 10 — seleção visual, disponibilidade e fonte

| Before | After | Why |
| --- | --- | --- |
| Select com dezenas de nomes | Seletor com fotos, preço, busca e filtros | Identificar a peça sem depender de uma lista comprida |
| Navegação dependia do objeto ampliado | Faixa fixa de categorias e Voltar/Avançar; imagens sem arrasto | Manter os controles acessíveis durante o zoom |
| Oito linhas de formulário | Cartões com fotos, preço, troca e ficha | Ler a configuração como um conjunto |
| Retângulo com número fictício | DreamCard com chip ilustrativo, acabamento e verso | Valorizar a experiência sem representar um banco |
| Importação exigia desconto PIX de 15% | Conferência da condição pública informada pela loja | Ofertas públicas de 10% também existiam |
| Piso da fonte podia ignorar a falta da recomendação da GPU | Informação ausente impede recomendação; potência máxima publicada da CPU é considerada | Não transformar ausência de dados em dimensionamento confiável |

## Catálogo desta revisão

Foram adicionados 74 modelos aos 243 anteriores: **317 produtos**, com **151 ofertas PIX elegíveis** no snapshot de 30/10/2026.

| Departamento | Modelos | Com oferta PIX |
| --- | ---: | ---: |
| CPU | 25 | 24 |
| GPU | 21 | 18 |
| Placas-mãe | 26 | 20 |
| RAM | 145 | 11 |
| Armazenamento | 22 | 14 |
| Fontes | 21 | 16 |
| Gabinetes | 22 | 16 |
| Coolers | 35 | 32 |

A refrigeração disponível inclui **20 water coolers e 12 air coolers**. A vitrine passou a destacar oito departamentos. A RTX 4090 sem oferta confirmada continua bloqueada para compra.

As fontes da consulta foram páginas públicas da KaBuM!: [water coolers](https://www.kabum.com.br/hardware/coolers/water-cooler), [air coolers](https://www.kabum.com.br/busca/air-cooler), [RAM](https://www.kabum.com.br/hardware/memoria-ram), [SSDs](https://www.kabum.com.br/hardware/ssd-2-5), [gabinetes](https://www.kabum.com.br/perifericos/gabinetes), [fontes](https://www.kabum.com.br/hardware/fontes) e [placas-mãe](https://www.kabum.com.br/hardware/placas-mae).

Foram selecionados venda direta, disponibilidade declarada, quantidade positiva e preço público sem Prime. Campanhas só foram consideradas quando vigentes e disponíveis na consulta. Não foram antecipadas campanhas futuras nem criados descontos fictícios. Consultas não reservam estoque de loja externa e podem ficar desatualizadas.

Os arquivos `backend/data/availabilityProducts.json` e `availabilityQuotes.json` guardam o snapshot. `frontend/public/hardware/expanded/manifest-availability.json` registra a origem das fotos. O importador preserva descrições, outras ofertas e consultas mais recentes; não é monitoramento contínuo.

## Filtros da bancada

CPU é separada em AMD/Intel. Placa-mãe usa plataforma e marca comercial, abrindo inicialmente na plataforma da CPU escolhida quando identificada. A GPU usa fabricante do chip, como NVIDIA/AMD/Intel, separado da marca da placa, como ASUS/MSI. Uma CPU AMD não obriga uma GPU AMD.

Refrigeração tem Air cooler/Water cooler; RAM tem DDR4/DDR5. Fotos selecionam o modelo. Voltar/Avançar percorrem as oito posições; a faixa fixa permite mudar de categoria durante o zoom. Modelos sem oferta continuam acessíveis para estudo, com a compra bloqueada.

## Dimensionamento da fonte

O servidor considera a maior referência cadastrada entre TDP e potência máxima publicada da CPU, soma a referência da GPU e 50 W de reserva, aplica 25% de margem e compara com o piso publicado pelo fabricante da GPU. Sem referências positivas ou sem esse piso, **não emite recomendação**. É estimativa didática, não medição de picos.

O filtro também verifica conector da GPU, ATX/EPS e comprimento dentro do limite do gabinete. Falta de informação não recebe aprovação. Quantidade de cabos, distribuição de conectores, folgas e instalação continuam exigindo o manual. Não misturem cabos modulares de modelos diferentes.

A MSI MAG A1000PLS PCIE5 foi conferida na [ficha oficial da MSI](https://www.msi.com/Power-Supply/MAG-A1000PLS-PCIE5/Specification): 1000 W, profundidade de 150 mm e conectores ATX, EPS e GPU publicados. A atualização está em `verifiedHardwareUpdates.json`, vinculada ao modelo exato. Ter 1000 W não aprova automaticamente qualquer PC.

Water coolers usam o tamanho do radiador e os suportes cadastrados do gabinete; não o limite de altura de air cooler. Posição, espessura e interferências continuam indicadas para conferência. Menções avulsas a sockets em divulgação não foram tratadas como uma lista completa de suporte.

## Exercício da dupla

1. Escolham CPU Intel, abram placas-mãe e comparem os filtros AMD/Intel. Confirmem a análise, inclusive socket e BIOS.
2. Nas GPUs, filtrem o fabricante do chip e depois a marca comercial.
3. Preencham as peças de referência e abram fontes: o piso do exemplo é 1000 W. Observem por que 650 W não passa e por que conectores/dimensões também importam.
4. Compare os water coolers e air coolers com o filtro de disponibilidade ligado.
5. Gerem o DreamCard, virem o cartão e concluam uma compra avulsa. Ele permanece fictício; o áudio só toca na aprovação.

Para outro banco, após as cargas anteriores: `npm.cmd run seed:availability --workspace backend`. Isso importa o snapshot incluído e aplica a ficha verificada; não consulta novos preços a cada execução.
