# Aula 4 — Administração e ofertas

O painel `/admin` exige conta ADMIN. As rotas no servidor verificam a sessão, consultam o perfil atual no banco e só então permitem o cadastro, edição ou remoção. Alterar o React ou enviar `role: ADMIN` pelo cadastro não concede acesso.

| Método | Rota | Resultado |
| --- | --- | --- |
| POST | `/api/admin/components` | 201, cria componente validado. |
| PUT/PATCH | `/api/admin/components/:id` | 200, atualiza dados e ofertas. |
| DELETE | `/api/admin/components/:id` | 200, remove o componente; 404 se não existe. |

Sem sessão: 401. Cliente: 403. Token CSRF incorreto: 403. Dados incompletos: 400. Endereço duplicado: 409. O endereço de um produto existente é fixo para preservar os links.

## Como editar

Entre na conta de demonstração ADMIN. As credenciais aleatórias ficam somente no arquivo ignorado `backend/.secrets/demo-accounts.json`. Ele foi gerado por `npm.cmd run create:demo --workspace backend`, sem substituir contas existentes.

No painel, clique em Editar. Cada seção tem uma responsabilidade: identificação e descrição; ficha textual; galeria; dados numéricos do montador; ofertas. A ficha usa uma característica por linha no formato `Nome: valor`. Listas técnicas usam vírgulas. Não precisa editar JSON.

Para cada oferta, registre loja, forma de pagamento, preço em reais, disponibilidade, URL do produto e data/hora da consulta. O servidor converte/valida o preço como centavos inteiros. A fonte precisa ser HTTPS e pertencer à loja escolhida. Ofertas disponíveis precisam de preço positivo; sem estoque pode ficar sem preço. Duas ofertas da mesma loja/pagamento não são aceitas.

Não preencher preços sem consulta. Dados de estoque representam o momento registrado, sem atualização automática. A vitrine destaca a menor oferta disponível no PIX; a página de produto mostra os registros e links, sem incluir frete.

## Verificação

21 testes aprovados, incluindo 401/403, CRUD, duplicação, URL fixa, preço, fonte, data e dados técnicos. No navegador, CLIENT foi bloqueado; ADMIN criou um registro temporário no Firestore, editou por formulário, recarregou e removeu o registro. Nenhum produto real do catálogo foi removido no teste.

## Exercício

Compare o acesso com as duas contas de demonstração. Explique por que esconder um botão não substitui a verificação do servidor. Antes de cadastrar uma oferta, confira o código da variante na loja e no catálogo.
