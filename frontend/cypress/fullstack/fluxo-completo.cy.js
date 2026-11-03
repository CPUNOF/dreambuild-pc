// CT-E2E-FULL-01 a 03 — Fluxos completos SEM mocks: o navegador conversa com a
// API Express real (backend/scripts/e2eServer.js) pelo proxy do Vite.
// Pré-condição: `npm run e2e:server --workspace backend` e `npm run dev`.

const unique = () =>
  `e2e-${Date.now()}-${Cypress._.random(1e6)}@dreambuild.test`;

function register(name, email) {
  cy.visit("/cadastro");
  cy.get('input[name="name"]').type(name);
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type("senha-forte-e2e-1");
  cy.contains("button", "Criar minha conta").click();
  cy.contains("h1", `Olá, ${name}.`);
}

describe("Fluxo completo front-end + back-end (sem mocks)", () => {
  before(() => {
    // Trava de segurança: só roda contra o servidor E2E com DAOs em memória.
    cy.request("/api/health")
      .its("headers")
      .its("x-dreambuild-e2e")
      .should("eq", "memory");
  });

  beforeEach(() => {
    cy.intercept("/api/**").as("api"); // só observa; não altera respostas
  });

  it("CT-E2E-FULL-01 cadastro → busca → carrinho → compra simulada → histórico", () => {
    const email = unique();
    register("Pessoa E2E", email);

    cy.visit("/");
    cy.get("#hardware-search").type("Adata SU650");
    cy.get("#produtos .product-card").should("have.length", 1);
    cy.get('#produtos [aria-label^="Adicionar SSD Adata SU650"]').click();
    cy.get(".cart-toast").should("contain", "Adicionado ao carrinho");
    cy.get(".header-cart-link b").should("have.text", "1");

    cy.visit("/carrinho");
    cy.get('[aria-label^="Aumentar quantidade de SSD Adata"]').click();
    cy.get("h1 small").should("have.text", "(2)");
    cy.get(".cart-total strong").should("contain", "719,98"); // 2 × 359,99

    cy.contains("a", "Continuar para revisão").click();
    cy.location("pathname").should("eq", "/checkout");
    cy.contains("button", "Gerar cartão fictício").click();
    cy.contains("label", "Entendi que esta compra é uma simulação")
      .find("input")
      .check();
    cy.contains("button", "Confirmar compra simulada")
      .should("be.enabled")
      .click();
    // Modal de sucesso (dialog) com o resumo do pedido.
    cy.get("dialog.purchase-journey[open]", { timeout: 15000 })
      .should("contain", "Seu pedido está confirmado!")
      .contains("a", "Acompanhar meu pedido")
      .click();
    cy.get(".header-cart-link b").should("have.text", "0");
    cy.contains("h1", "Pedido confirmado.");
    cy.visit("/pedidos");
    cy.get(".order-list article").should("have.length", 1).and("contain", "R$");
  });

  it("CT-E2E-FULL-02 login inválido, depois válido; logout bloqueia rota privada", () => {
    const email = unique();
    register("Pessoa Login", email);
    cy.contains("button", "Sair da conta").click();
    cy.location("pathname").should("eq", "/entrar");

    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type("senha-errada-123");
    cy.get(".account-form-panel button[type=submit]").click();
    cy.get(".form-error").should("contain", "E-mail ou senha incorretos.");

    cy.get('input[name="password"]').clear().type("senha-forte-e2e-1");
    cy.get(".account-form-panel button[type=submit]").click();
    cy.contains("h1", "Olá, Pessoa Login.");

    cy.contains("button", "Sair da conta").click();
    cy.visit("/pedidos");
    cy.location("pathname").should("eq", "/entrar");
  });

  it("CT-E2E-FULL-03 e-mail duplicado no cadastro mostra erro do servidor (409)", () => {
    const email = unique();
    register("Primeira Conta", email);
    cy.contains("button", "Sair da conta").click();

    cy.visit("/cadastro");
    cy.get('input[name="name"]').type("Segunda Conta");
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type("senha-forte-e2e-1");
    cy.contains("button", "Criar minha conta").click();
    cy.wait("@api"); // garante que houve chamada real
    cy.get(".form-error").should("contain", "já possui cadastro");
  });

  it("CT-E2E-FULL-04 administrador acessa a administração; cliente não", () => {
    cy.visit("/entrar");
    cy.get('input[name="email"]').type("admin@dreambuild.test");
    cy.get('input[name="password"]').type("senha-de-teste-123");
    cy.get(".account-form-panel button[type=submit]").click();
    cy.contains("Perfil de administrador");
    cy.contains("a", "Administrar catálogo").click();
    cy.location("pathname").should("eq", "/admin");
    cy.contains("h1", "Acesso restrito").should("not.exist");

    cy.clearCookies();
    cy.visit("/entrar");
    cy.get('input[name="email"]').type("cliente@dreambuild.test");
    cy.get('input[name="password"]').type("senha-de-teste-123");
    cy.get(".account-form-panel button[type=submit]").click();
    cy.contains("Perfil de cliente");
    cy.visit("/admin");
    cy.contains("h1", "Acesso restrito");
  });
});
