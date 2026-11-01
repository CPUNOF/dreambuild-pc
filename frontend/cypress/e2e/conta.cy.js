import { users } from "../support/commands.js";

describe("Conta e autenticação", () => {
  it("CT-E2E-22 faz login com e-mail e senha e abre a conta", () => {
    cy.visitStore("/entrar");
    cy.contains("h2", "Entrar na conta");
    cy.get('input[name="email"]').type(users.client.email);
    cy.get('input[name="password"]').type("senha-correta-123");
    cy.get(".account-form-panel button[type=submit]").click();

    cy.wait("@login").then(({ request }) => {
      expect(request.headers["x-csrf-token"]).to.eq("csrf-cypress");
      expect(request.body).to.deep.equal({
        email: users.client.email,
        password: "senha-correta-123",
      });
    });
    cy.location("pathname").should("eq", "/conta");
    cy.contains("h1", "Olá, Cliente Teste.");
    cy.contains("Perfil de cliente");
    cy.get(".header-account-link").should("contain", "Cliente");
  });

  it("CT-E2E-23 mostra erro com credenciais inválidas", () => {
    cy.visitStore("/entrar");
    cy.get('input[name="email"]').type(users.client.email);
    cy.get('input[name="password"]').type("senha-errada");
    cy.get(".account-form-panel button[type=submit]").click();
    cy.get(".form-error").should("contain", "E-mail ou senha incorretos.");
    cy.location("pathname").should("eq", "/entrar");
  });

  // Regressão do DEF-03: o fim do carregamento do catálogo tirava o foco do
  // campo em que a pessoa estava digitando.
  it("CT-E2E-24 DEF-03 carregar o catálogo não rouba o foco do formulário", () => {
    cy.mockApi();
    cy.fixture("catalog.json").then((catalog) =>
      cy
        .intercept("GET", "/api/components?*", {
          delay: 1500,
          body: {
            status: "success",
            data: catalog,
            errors: [],
            meta: { nextCursor: null },
          },
        })
        .as("slowCatalog"),
    );
    cy.visit("/cadastro");
    cy.get('input[name="name"]').focus().type("Ana");
    cy.wait("@slowCatalog");
    cy.wait(300); // dá tempo de o efeito pós-carregamento executar
    cy.focused().should("have.attr", "name", "name");
    cy.get('input[name="name"]')
      .type(" Souza")
      .should("have.value", "Ana Souza");
  });

  it("CT-E2E-25 valida campos obrigatórios no navegador", () => {
    cy.visitStore("/entrar");
    cy.get(".account-form-panel button[type=submit]").click();
    cy.get('input[name="email"]:invalid').should("exist");
    cy.get("@login.all").should("have.length", 0);
  });

  it("CT-E2E-26 cria uma conta nova", () => {
    cy.visitStore("/entrar");
    cy.contains("a", "Crie sua conta").click();
    cy.location("pathname").should("eq", "/cadastro");
    cy.get('input[name="password"]').should("have.attr", "minlength", "8");

    cy.get('input[name="name"]').type("Maria Silva");
    cy.get('input[name="email"]').type("maria@dreambuild.test");
    cy.get('input[name="password"]').type("senha-forte-123");
    cy.contains("button", "Criar minha conta").click();

    cy.wait("@register").its("request.body").should("deep.equal", {
      name: "Maria Silva",
      email: "maria@dreambuild.test",
      password: "senha-forte-123",
    });
    cy.contains("h1", "Olá, Maria Silva.");
  });

  it("CT-E2E-27 redireciona rota protegida para o login e volta após entrar", () => {
    cy.visitStore("/pedidos");
    cy.location("pathname").should("eq", "/entrar");
    cy.get('input[name="email"]').type(users.client.email);
    cy.get('input[name="password"]').type("senha-correta-123");
    cy.get(".account-form-panel button[type=submit]").click();

    cy.location("pathname").should("eq", "/pedidos");
    cy.wait("@orders");
    cy.contains("h1", "Meus pedidos simulados");
    cy.contains("Seu histórico começa na primeira compra.");
  });

  it("CT-E2E-28 sai da conta", () => {
    cy.visitStore("/conta", { user: users.client });
    cy.contains("h1", "Olá, Cliente Teste.");
    cy.contains("button", "Sair da conta").click();
    cy.wait("@logout");
    cy.location("pathname").should("eq", "/entrar");
    cy.get(".header-account-link").should("contain", "Entrar");
  });

  it("CT-E2E-29 bloqueia a administração para clientes", () => {
    cy.visitStore("/admin", { user: users.client });
    cy.contains("h1", "Acesso restrito");
    cy.get(".store-footer").should("not.contain", "Documentação da API");
  });

  it("CT-E2E-30 mostra atalhos de administrador apenas para ADMIN", () => {
    cy.visitStore("/conta", { user: users.admin });
    cy.contains("Perfil de administrador");
    cy.contains("a", "Administrar catálogo").should(
      "have.attr",
      "href",
      "/admin",
    );
    cy.get(".store-footer")
      .contains("a", "Documentação da API")
      .should("have.attr", "href", "/api-docs/");
  });
});
