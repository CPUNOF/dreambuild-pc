# Login Google e cadastros existentes

O backend valida o ID token pelo Firebase Admin, incluindo revogação, provedor `google.com` e e-mail verificado. O UID é a identidade estável utilizada no vínculo.

Quando um Gmail verificado já possui cadastro local CLIENT, o login pode vincular esse UID ao mesmo usuário em uma transação, preservando senha, preferências, identificador e montagens existentes. Não se cria um segundo cadastro e não há promoção de papel. Uma indicação enviada pelo formulário não habilita essa regra: ela é calculada a partir das claims verificadas pelo servidor.

O vínculo automático fica limitado ao sufixo exato `@gmail.com`. Contas ADMIN e endereços de outros provedores continuam exigindo login por senha e o botão **Vincular Google**, em **Minha conta**. Contas desabilitadas, UID já associado a outro usuário, UID divergente no cadastro e índices inconsistentes são rejeitados.

A [documentação do Google sobre verificação de ID tokens](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token) distingue Gmail, para o qual o Google é autoridade, de e-mails de terceiros. Esta implementação mantém uma política mais restrita para administradores e não usa o domínio do e-mail para presumir vínculo com Google Workspace.
