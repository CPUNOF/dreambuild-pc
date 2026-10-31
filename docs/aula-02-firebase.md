# Aula 2 — Criar o banco do projeto

O Firebase é o serviço; o Firestore é o banco de documentos que usaremos nele. O React continuará falando com a API Express. Somente o servidor terá acesso ao Firestore pelo Firebase Admin SDK.

## 1. Criar o projeto

1. Abra o [Console do Firebase](https://console.firebase.google.com/) e entre com a conta Google que você escolheu.
2. Selecione **Criar projeto** ou **Adicionar projeto** e use o nome **DreamBuild PC**.
3. Anote o **ID do projeto** que o console mostrar. Ele pode receber um sufixo para ficar único.
4. Google Analytics não é necessário para esta entrega. Você pode deixá-lo desativado.
5. Mantenha o plano sem faturamento, Spark. Não precisamos vincular cartão para esta etapa.

O ID pode ser informado no chat. Senha, chave privada e arquivo de credenciais não devem ser enviados aqui.

**Registro de 30/10/2026:** projeto `dreambuild-pc`, São Paulo, modo de produção, conforme informado por Breno. Credencial local configurada e leitura real confirmada. Os quatro produtos foram gravados e recuperados pela API/DAO em outro processo. A vitrine e as páginas React agora leem esse catálogo. A chave permaneceu fora do Git.

## 2. Criar o Firestore

1. Dentro do projeto, abra **Firestore Database**. A organização do menu pode aparecer como **Build** ou **Databases & Storage**.
2. Clique em **Criar banco de dados** e selecione a edição **Standard**, caso haja escolha de edição.
3. Use o banco padrão, `(default)`.
4. Confira a localização antes de confirmar. Para este projeto brasileiro, a proposta é **São Paulo (`southamerica-east1`)**, quando disponível. Informe a região escolhida para mantermos o registro do ambiente.
5. Escolha **modo de produção**: o navegador não terá leitura/gravação direta, mas o servidor autenticado poderá acessar pelo Admin SDK.

Não é necessário criar coleções manualmente. A carga inicial será feita pelo script do servidor quando a conexão estiver configurada.

## 3. Preparar o acesso local do servidor

Esta etapa ocorre depois de criar o projeto e o banco:

1. Abra **Configurações do projeto → Contas de serviço → Firebase Admin SDK**.
2. Gere uma chave privada para o servidor e salve o JSON no seu computador.
3. Crie a pasta `backend/.secrets` e salve o arquivo como `firebase-service-account.json`. Essa pasta fica fora do Git.
4. Copie `backend/.env.example` para `backend/.env` e configure o ID e o caminho **absoluto** desse arquivo. Exemplo, adaptando o ID:

```dotenv
FIREBASE_PROJECT_ID=seu-id-do-projeto
GOOGLE_APPLICATION_CREDENTIALS=C:/Users/breno/Documents/ProjetoSite/backend/.secrets/firebase-service-account.json
```

Nunca colocar essa chave em `frontend`, em uma variável `VITE_*`, no chat ou no repositório.

Na raiz do projeto, o comando abaixo faz uma consulta real de leitura, sem criar dados:

```powershell
npm.cmd run check:firebase --workspace backend
```

Se a configuração ainda não existir, ele explica o que falta e termina com erro. Isso é esperado antes de informar o projeto e o caminho das credenciais.

Para a carga inicial, execute na raiz `npm.cmd run seed:catalog --workspace backend`. Esse comando já foi executado e cria apenas documentos ausentes: repetir não substitui os existentes. As fotos continuam em arquivos do site; o banco guarda seus caminhos e os dados dos produtos.

O caminho das credenciais deve terminar no **arquivo JSON baixado**, inclusive se ele estiver dentro de outra pasta. Uma pasta com nome terminado em `.json` continua sendo uma pasta; a configuração verifica isso antes de autenticar.

## Exercício: acompanhar o dado até a tela

1. No Firebase, abra Firestore → Dados → `components`. Devem aparecer `rtx4090`, `ryzen`, `corsair` e `samsung`.
2. Abra `http://localhost:3001/api/components?limit=2` e observe `data` e `meta.nextCursor`.
3. Abra a loja e um produto. O React consulta a API; o DAO consulta o banco; o Model organiza a ficha; a View devolve JSON.
4. Reinicie os serviços com `Ctrl+C` e `npm.cmd run dev`. Os dados continuam no banco.

Leitura e persistência foram verificadas. Preços, as outras quatro categorias, administração e montador continuam pendentes.

## Referências de configuração

- [Primeiros passos com Firestore](https://firebase.google.com/docs/firestore/quickstart): criação do banco e modo de produção para acesso pelo servidor.
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup): conta de serviço e `GOOGLE_APPLICATION_CREDENTIALS`.
- [Cotas do Firestore](https://firebase.google.com/docs/firestore/pricing): o banco possui cotas de uso sem faturamento; recursos adicionais podem exigir outro plano.
