# Aula 06 — simulação, WebSocket e documentação

O React pede para iniciar um cenário pelo Socket.IO. O servidor verifica sessão, token CSRF e propriedade da montagem, consulta as peças no DAO e produz amostras a cada 500 ms. Cada conexão recebe apenas os próprios resultados. Parar, sair da conta ou completar dois minutos encerra o teste.

Não executamos jogos nem medimos o computador. As imagens são oficiais e ilustrativas. FPS, temperatura, clock, rotação e carga vêm de fórmulas didáticas; não servem para escolher componentes ou fazer overclock real. Os pesos e índices aparecem na bancada. O limiar de alerta de 95 °C é parte do modelo, não a temperatura máxima oficial das peças.

A sugestão de alternativa compara os índices de CPU/GPU, consulta até 100 peças da categoria de menor índice e repete as regras automáticas de compatibilidade. Sem alternativa cadastrada, ela informa a ausência. Não inventa um produto nem transforma os índices em benchmark. As peças iniciais têm índice 100 e não indicam troca nesse modelo.

O card reúne o nome e as peças do conjunto; não atribui classificação de desempenho. No recibo, ele pode ser guardado usando **Imprimir / PDF**.

## Experimento da dupla

1. Breno monta e salva o conjunto inicial; Kaio abre a bancada e explica por que precisa estar conectado.
2. Executem o mesmo cenário em 1080p e 4K. Identifiquem o fator que muda na fórmula.
3. Ativem overclock e fluxo restrito. Observem o alerta fictício e expliquem por que ele não é uma medição.
4. Parem e reiniciem. Ao sair da conta, confirmem que a conexão encerra.
5. Abram a documentação em `/api-docs/`, executem `GET /api/components` e identifiquem `data` e `meta`.

## Onde está cada responsabilidade

- `backend/src/models/Simulation.js`: fórmulas, limites e amostras sintéticas.
- `backend/src/models/Upgrade.js`: comparação didática e compatibilidade da alternativa.
- `backend/src/websocket/`: autenticação, início, parada e isolamento das conexões.
- `frontend/src/pages/BenchPage.jsx`: controles, imagem, indicadores e gráfico.
- `backend/src/config/openapi.js`: contrato REST exibido pelo Swagger.

O aviso de atualização de catálogo usa WebSocket com informações públicas. Não é um monitor automático das lojas: os preços continuam cadastrados manualmente, com fonte, horário, modalidade e disponibilidade.
