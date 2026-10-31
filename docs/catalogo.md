# Catálogo de peças reais — planejamento da sprint 2

Status em 30/10/2026: quatro produtos persistidos na coleção `components` do Firestore. A loja e as páginas React consultam os dados pela API/DAO. Fotografias oficiais e fichas conferidas nos fabricantes; os arquivos de imagem permanecem em `frontend/public`. Não há estoque ou ofertas cadastradas. As outras quatro categorias e os preços com fonte/data continuam pendentes na sprint 2.

## Variantes verificadas nesta entrega

| Produto | Código identificado | Página |
| --- | --- | --- |
| Asus ROG Strix RTX 4090 OC 24 GB | ROG-STRIX-RTX4090-O24G-GAMING | `/produto/asus-rog-strix-rtx-4090-oc-24gb` |
| AMD Ryzen 7 7800X3D em caixa | 100-100000910WOF | `/produto/amd-ryzen-7-7800x3d` |
| Corsair Vengeance RGB DDR5 32 GB, branca | CMH32GX5M2D6000C36W | `/produto/corsair-vengeance-rgb-ddr5-32gb-6000-branco` |
| Samsung 980 PRO 1 TB, versão fotografada dos EUA | MZ-V8P1T0B/AM | `/produto/samsung-980-pro-nvme-1tb` |

Fonte da carga inicial e URLs das fichas: `frontend/src/data/products.js`. A interface consulta o banco pela API. Fotografias: `frontend/public/hardware/official/manifest.json`, com fabricante, URL e data. Direitos das imagens permanecem com os fabricantes; não há atribuição falsa de licença aberta. As imagens antigas do Commons não estão em uso na interface.

O Samsung usa apenas a foto verificada da variante de 1 TB. Infográficos genéricos da galeria do fabricante não foram usados como fotos adicionais. Para o comparador, o código regional e as condições da oferta precisarão ser conferidos; não presumir que códigos diferentes representam automaticamente a mesma oferta.

As quatro peças ainda não completam um PC. Placa-mãe, fonte, gabinete e cooler devem ser selecionados antes do montador. Os campos necessários às regras de compatibilidade serão estruturados no Model; a ficha textual sozinha não substitui essas regras.

## Dados de cada componente

| Grupo | Dados previstos |
| --- | --- |
| Identificação | Categoria, marca, nome comercial completo e código exato do fabricante (quando disponível) |
| Especificações | Características usadas na compatibilidade, com URL da ficha do fabricante e data da consulta |
| Imagem | Foto ou imagem de produto com origem e permissão de uso verificadas; alternativa visual quando não disponível |
| Oferta | Loja, URL do produto, preço em BRL, modalidade de pagamento, disponibilidade e data/hora da consulta |
| Visualização 3D futura | Caminho do modelo GLB e indicação de quais produtos a representação atende |

As oito categorias são CPU, GPU, placa-mãe, RAM, armazenamento, fonte, gabinete e cooler. O catálogo inicial terá peças suficientes para montar pelo menos uma configuração completa compatível e demonstrar uma combinação incompatível. A seleção exata será conferida nas fontes antes da carga inicial.

## Como serão conferidas as peças

1. Selecionar modelos reais e consultar as fichas técnicas dos fabricantes.
2. Identificar a variante exata: capacidade da memória, modelo da GPU, versão da placa-mãe etc.
3. Consultar manualmente ofertas da mesma variante nas três lojas do comparador.
4. Registrar fonte, data, disponibilidade e modalidade de pagamento. Preço não encontrado permanece ausente; não preencher com zero nem inventar uma oferta.
5. Cadastrar pelo servidor e conferir o percurso Firestore → DAO → API → interface.

Preços consultados são registros de uma data; não significam atualização automática. O relatório futuro deve tratar peças sem oferta ou sem estoque e informar se o frete não está incluído. A loja de menor total só pode ser escolhida entre as que tenham ofertas elegíveis para todas as peças necessárias.

## Imagens e modelos 3D

O produto terá identificação e dados reais no catálogo. A geração dos modelos 3D é uma tarefa adicional: os GLBs do Blender serão carregados por Three.js na sprint 7. O modelo precisa ser descrito de acordo com sua fidelidade, por exemplo como representação estilizada, quando for o caso.

Three.js permanece instalado, mas a demonstração de gabinete conceitual foi retirada da página inicial após a anotação do usuário sobre seu acabamento visual. O visualizador de produtos reais com modelos GLB continua planejado para a sprint 7.

## Critérios de conclusão

- Peças identificadas e fichas de origem registradas.
- Ofertas manuais com fonte/data e ausência de preço tratada corretamente.
- Dados persistidos no Firestore e apresentados pela API na interface.
- Catálogo continua disponível após reiniciar o servidor.
- Nenhum acesso direto do navegador ao Firestore.
