# Publicação na Vercel

Importe o repositório completo. **Root Directory: raiz (`./`), Framework Preset: Other**, Node.js 24.x e Fluid Compute ativado. Não selecione `frontend` como raiz: a API em `api/server.js`, o backend e as regras compartilhadas fazem parte desta publicação. O `vercel.json` da raiz define instalação, build, saída e rotas. Deixe `VITE_API_URL` sem definição para usar `/api` no mesmo domínio.

Em Settings → Environment Variables, configure para Production (e para Preview se desejar testar nesse ambiente):

| Nome | Valor |
| --- | --- |
| `FIREBASE_PROJECT_ID` | `dreambuild-pc` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Conteúdo completo do JSON privado de serviço, inserido diretamente no painel da Vercel |
| `SESSION_SECRET` | Sequência aleatória com pelo menos 32 caracteres |
| `SERVE_FRONTEND` | `false` |

Não envie o JSON pelo chat ou pelo GitHub. Não configure `GOOGLE_APPLICATION_CREDENTIALS` com um caminho `C:/...` na nuvem. A credencial é lida em memória; localmente o caminho de arquivo continua funcionando. Alterações nas variáveis exigem novo deploy.

O domínio padrão é obtido das variáveis de sistema `VERCEL_PROJECT_PRODUCTION_URL` e `VERCEL_URL`. Se usar domínio próprio, configure `FRONTEND_ORIGINS` com a origem HTTPS exata; várias origens são separadas por vírgulas. Não use `*` com sessões. Configure também o domínio do site em Firebase Authentication → Settings → Authorized domains, para o login Google.

## Conferência no endereço publicado

1. `/api/health` deve retornar JSON; `database: not-checked` confirma apenas presença da configuração, não uma leitura do Firestore.
2. Confira vitrine, fotos e recarga direta de `/montar` e `/ranking`.
3. Faça login, salve/reabra uma montagem e confirme persistência real.
4. Confira autorização CLIENT/ADMIN, carrinho, pedido simulado e recibo.
5. Publique/retire uma montagem com consentimento e confira o ranking.
6. Confira `/api-docs/`, `/openapi.json`, conexão WebSocket, início/parada e logout.

A implementação usa Socket.IO com transporte WebSocket. Segundo a [documentação da Vercel](https://vercel.com/docs/functions/websockets), Fluid Compute é necessário e conexões terminam ao atingir a duração da função. A configuração deste projeto limita a função a 180 segundos e a simulação já limita cada execução a dois minutos. Uma reconexão pode atingir outra instância; uma simulação interrompida precisa ser iniciada novamente. Controles e notificações mantidos em memória não fornecem coordenação global entre instâncias. Persistência de contas, montagens e pedidos permanece no Firestore.

A cota do Firebase e os limites do plano da Vercel continuam valendo. Esta preparação e os testes locais não equivalem a um deploy validado: registre o endereço e o resultado da conferência após publicar.
