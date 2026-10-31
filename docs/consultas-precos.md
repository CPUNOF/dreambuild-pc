# Consultas manuais — 30/10/2026

Valores curados a partir das páginas das próprias lojas. Fonte e horário ficam em cada oferta; não há monitor automático. Ofertas existentes do administrador são preservadas ao repetir o script `seed:offers`.

| Peça | Consulta | Tratamento |
| --- | --- | --- |
| Ryzen 7 7800X3D, 100-100000910WOF | Pichau: R$ 1.799,99 no PIX; R$ 2.117,64 no cartão. A listagem de processadores indicava em estoque. | Disponível na consulta, sem garantia de atualização posterior. |
| Ryzen 7 7800X3D, mesma variante | KaBuM!, código 426262: R$ 1.849,99 no PIX, com botão de compra na página. | Oferta disponível na consulta. Parcelamento não foi convertido em outro total por multiplicação/arredondamento. |
| TUF Gaming B650-PLUS WIFI | Pichau: R$ 1.749,99 no PIX. | Disponibilidade não confirmada; não entra no total elegível. |
| ROG Strix RTX 4090 OC | Pichau: R$ 18.530,63 no PIX. | Disponibilidade não confirmada; não entra no total elegível. |
| Samsung 980 PRO 1 TB, MZ-V8P1T0B/AM | KaBuM!, código 355145: produto esgotado. | Sem estoque, preço nulo. |
| Corsair 5000D Airflow, CC-9011210-WW | Terabyte, código 21473: produto indisponível; campos de preço sem modalidade inequívoca. | Sem estoque e sem atribuir uma cotação disponível. |
| Corsair RM1000e | Terabyte oferecia CP-9020297-BR, enquanto a variante cadastrada/fotografada é CP-9020297-NA. | Não presumir equivalência de código regional; oferta não associada automaticamente. |
| Kit Corsair branco e Noctua NH-U12A | Não obtida cotação inequívoca das variantes nas três lojas durante esta consulta. | Nenhum preço inventado. |

URLs completas estão em `backend/data/manualOffers.js` e nas ofertas do Firestore. Algumas consultas diretas receberam 403; os registros foram limitados ao conteúdo público acessível. Fonte da disponibilidade do Ryzen: [listagem Pichau](https://www.pichau.com.br/hardware/processadores), conferida junto à página de produto. A comparação de um conjunto completo permanece incompleta enquanto faltarem ofertas elegíveis de suas peças; o algoritmo foi verificado com casos completos e incompletos nos testes.
