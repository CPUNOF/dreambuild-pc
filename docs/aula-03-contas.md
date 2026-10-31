# Aula 3 — Cadastro, login e sessão

## Caminho do usuário

`/cadastro` cria uma conta CLIENT e entra automaticamente; `/entrar` aceita e-mail e senha; `/conta` mostra o perfil e permite sair. O cadastro nunca concede ADMIN com base em um campo enviado pelo navegador.

O servidor guarda apenas o hash scrypt da senha, com salt aleatório. O cookie `dreambuild.sid` é HttpOnly, SameSite=Lax, dura até oito horas e usa Secure em produção HTTPS. Os dados da sessão ficam no Firestore; o cookie contém seu identificador assinado. O segredo local é gerado e salvo em `backend/.env`, ignorado pelo Git. Não reutilizar senha pessoal neste projeto acadêmico.

## Arquivos

- `models/User.js`: valida dados, gera/verifica hashes e seleciona o perfil público.
- `dao/UserDAO.js`: usuários e unicidade do e-mail em transação.
- `dao/SessionDAO.js`: grava, recupera e exclui sessões; sessões expiradas são descartadas ao serem consultadas.
- `config/sessionConfig.js`: adaptador de sessão e opções do cookie.
- `controllers/AuthController.js`: cadastro, login, logout e consulta de sessão.
- `middlewares`: proteção CSRF e verificações de usuário/perfil para as próximas rotas.
- `context/AuthContext.jsx`: estado visual da conta; a permissão real continua no servidor.
- `pages/AccountPage.jsx`: telas de cadastro, entrada e perfil.

## Contrato implementado

| Método | Rota | Comportamento |
| --- | --- | --- |
| GET | `/api/auth/session` | Retorna `{ user, csrfToken }`; user é null para visitante. |
| POST | `/api/auth/register` | Nome, e-mail e senha; cria CLIENT, renova sessão e retorna 201. |
| POST | `/api/auth/login` | Credenciais válidas renovam sessão; falha retorna 401 genérico. |
| POST | `/api/auth/logout` | Destrói sessão e limpa cookie; retorna 200. |

Operações de alteração exigem `X-CSRF-Token`, obtido pela consulta de sessão. Token inválido recebe 403 antes da operação. Cadastro e login limitam tentativas malsucedidas por IP a dez em quinze minutos no processo local. Antes de operar múltiplas instâncias, esse limitador precisa de armazenamento compartilhado.

O Vite encaminha `/api` ao Express. Isso mantém os cookies na mesma origem do site tanto em `localhost` quanto em `127.0.0.1`. Não usar VITE_* para segredos. Nenhuma publicação foi feita.

## Verificação

Na entrega inicial de contas, 18 testes passaram; navegador com cadastro temporário real no Firestore, reload, leitura da sessão por outro processo, logout e novo login. Cookies HttpOnly e telas em quatro larguras conferidos. A conta de verificação foi removida ao final. Montagens e pedidos foram acrescentados depois; veja a Aula 05 e o README para o estado atual.

## Exercício

Crie uma conta de demonstração, atualize `/conta`, saia e entre outra vez. Explique por que fechar ou recarregar uma página não apaga o cadastro, e por que o React não pode conceder o perfil ADMIN sozinho.
