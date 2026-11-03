describe("Carrinho", () => {
  it("CT-E2E-15 mostra o carrinho vazio", () => {
    cy.visitStore("/carrinho");
    cy.contains("h2", "Seu próximo upgrade começa aqui.").should("be.visible");
    cy.get(".header-cart-link").should(
      "have.attr",
      "aria-label",
      "Meu carrinho, 0 itens",
    );
  });

  it("CT-E2E-16 adiciona um produto pela vitrine e atualiza o contador", () => {
    cy.visitStore("/");
    cy.get(
      '#produtos [aria-label="Adicionar AMD Ryzen 3 3200G, 3.6GHz (4GHz Max Turbo) ao carrinho"]',
    ).click();
    cy.wait("@cartUpdate")
      .its("request.body")
      .should("deep.equal", { quantity: 1 });

    cy.get(".cart-toast")
      .should("contain", "Adicionado ao carrinho")
      .and("contain", "Ryzen 3 3200G");
    cy.get(".header-cart-link b").should("have.text", "1");

    cy.get(".cart-toast").contains("a", "Ver carrinho").click();
    cy.location("pathname").should("eq", "/carrinho");
    cy.get(".cart-item")
      .should("have.length", 1)
      .and("contain", "Ryzen 3 3200G");
    cy.get(".cart-total strong").should("contain", "399,99");
  });

  it("CT-E2E-17 não permite adicionar produto indisponível", () => {
    cy.visitStore("/");
    cy.get('#produtos [aria-label^="Adicionar AMD Ryzen 7 9800X3D"]')
      .should("be.disabled")
      .and("contain", "Indisponível para compra");
  });

  it("CT-E2E-18 altera quantidades e remove itens", () => {
    cy.visitStore("/carrinho", {
      cart: [
        { componentId: "kabum-102248", quantity: 1 },
        { componentId: "kabum-105015", quantity: 2 },
      ],
    });
    cy.get(".cart-item").should("have.length", 2);
    cy.get("h1 small").should("have.text", "(3)");

    cy.get('[aria-label^="Aumentar quantidade de AMD Ryzen 3 3200G"]').click();
    cy.wait("@cartUpdate").its("request.body.quantity").should("eq", 2);
    cy.get("h1 small").should("have.text", "(4)");
    // 2 × 399,99 + 2 × 359,99 = 1.519,96
    cy.get(".cart-total strong").should("contain", "1.519,96");

    cy.get('[aria-label^="Diminuir quantidade de SSD Adata"]').click();
    cy.wait("@cartUpdate");
    cy.get("h1 small").should("have.text", "(3)");

    cy.contains(".cart-item", "SSD Adata")
      .contains("button", "Remover")
      .click();
    cy.wait("@cartUpdate").its("request.method").should("eq", "DELETE");
    cy.get(".cart-item").should("have.length", 1);
  });

  it("CT-E2E-19 bloqueia o checkout com item indisponível", () => {
    cy.visitStore("/carrinho", {
      cart: [{ componentId: "kabum-662405", quantity: 1 }],
    });
    cy.get(".cart-item").should("contain", "Indisponível para compra");
    cy.get(".cart-total strong").should("contain", "Cotação parcial");
    cy.contains("a", "Continuar para revisão")
      .should("have.attr", "aria-disabled", "true")
      .click({ force: true });
    cy.location("pathname").should("eq", "/carrinho");
  });

  it("CT-E2E-20 exige login para seguir ao checkout", () => {
    cy.visitStore("/carrinho", {
      cart: [{ componentId: "kabum-102248", quantity: 1 }],
    });
    cy.contains("a", "Continuar para revisão").click();
    cy.location("pathname").should("eq", "/entrar");
  });

  it("CT-E2E-21 mostra erro do servidor ao atualizar o carrinho", () => {
    cy.visitStore("/");
    cy.intercept("PUT", "/api/cart/items/*", {
      statusCode: 400,
      body: {
        status: "error",
        message: "O limite é de 10 unidades por modelo.",
        data: null,
        errors: [],
        meta: {},
      },
    });
    cy.get('#produtos [aria-label^="Adicionar SSD Adata"]').click();
    cy.get(".cart-toast-error")
      .should("contain", "O limite é de 10 unidades por modelo.")
      .find('[aria-label="Fechar erro do carrinho"]')
      .click();
    cy.get(".cart-toast-error").should("not.exist");
  });
});
