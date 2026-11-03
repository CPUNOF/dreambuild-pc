describe("Experiência de compra e montagem", () => {
  it("permite revisar quantidade e remover a peça no carrinho lateral", () => {
    cy.visitStore("/produto/kabum-102248");
    cy.get(
      '[aria-label="Adicionar AMD Ryzen 3 3200G, 3.6GHz (4GHz Max Turbo) ao carrinho"]',
    ).click();
    cy.wait("@cartUpdate").its("request.body.quantity").should("eq", 1);
    cy.get("dialog.cart-drawer[open]").should("be.visible");
    cy.get('.cart-drawer [aria-label^="Aumentar AMD Ryzen 3"]').click();
    cy.wait("@cartUpdate").its("request.body.quantity").should("eq", 2);
    cy.get(".drawer-total strong").should("contain", "799,98");
    cy.get('.cart-drawer [aria-label^="Remover AMD Ryzen 3"]').click();
    cy.wait("@cartUpdate").its("request.method").should("eq", "DELETE");
    cy.contains(".drawer-empty", "Qual vai ser a primeira peça?").should(
      "be.visible",
    );
    cy.get('[aria-label="Fechar carrinho lateral"]').click();
    cy.get("dialog.cart-drawer").should("not.have.attr", "open");
    cy.get(".header-cart-link b").should("have.text", "0");
  });

  it("amplia detalhes do produto e restaura o zoom", () => {
    cy.visitStore("/produto/kabum-105015");
    cy.get('[aria-label^="Ampliar imagem de"]').click();
    cy.get('[aria-label="Aumentar zoom"]').click().click();
    cy.get(".lightbox-zoom-tools output").should("have.text", "200%");
    cy.get('[aria-label="Restaurar zoom"]').click();
    cy.get(".lightbox-zoom-tools output").should("have.text", "100%");
    cy.get('[aria-label="Fechar imagem ampliada"]').click();
    cy.get("dialog.image-lightbox").should("not.have.attr", "open");
  });

  it("oculta a RAM DDR5 da CPU AM4 e permite trocar de plataforma", () => {
    cy.visitStore("/montar?adicionar=kabum-102248");
    cy.contains(".assembly-step", "Memória RAM").find("button").first().click();
    cy.get("dialog.component-picker[open]").should("be.visible");
    cy.get(".picker-product").should("not.exist");
    cy.contains("Nenhuma peça compatível com estes filtros.").should(
      "be.visible",
    );
    cy.contains("button", "Trocar plataforma e escolher novamente").click();
    cy.get("dialog.component-picker").should("not.exist");
    cy.get('[role="progressbar"]').should("have.attr", "aria-valuenow", "0");
  });
});
