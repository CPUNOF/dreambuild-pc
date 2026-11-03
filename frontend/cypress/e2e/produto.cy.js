describe("Página de produto", () => {
  it("CT-E2E-09 abre o produto a partir do card e mostra detalhes, ficha e ofertas", () => {
    cy.visitStore("/");
    cy.get(".product-card").contains("a", "Ryzen 3 3200G").click();

    cy.location("pathname").should("eq", "/produto/kabum-102248");
    cy.title()
      .should("contain", "Ryzen 3 3200G")
      .and("contain", "DreamBuild PC");
    cy.get("#product-title").should("contain", "Ryzen 3 3200G");
    cy.get(".product-highlights li").should("have.length", 3);
    cy.get(".actual-product-price").should("contain", "399,99");
    cy.get("#ficha-tecnica .specification-table > div").should(
      "have.length.at.least",
      1,
    );
    cy.get("#ofertas").should("contain", "KaBuM!");
    cy.get(".add-to-builder").should(
      "have.attr",
      "href",
      "/montar?adicionar=kabum-102248",
    );
  });

  it("CT-E2E-10 indica produto sem oferta no PIX e desabilita a compra", () => {
    cy.visitStore("/produto/kabum-662405");
    cy.get("#product-title").should("contain", "Ryzen 7 9800X3D");
    cy.get(".product-price-panel button")
      .should("be.disabled")
      .and("contain", "Indisponível para compra");
  });

  it("CT-E2E-11 volta para a categoria pelo breadcrumb", () => {
    cy.visitStore("/produto/kabum-1000741");
    cy.get(".product-breadcrumb").contains("button", "Placa de vídeo").click();
    cy.location("pathname").should("eq", "/");
    cy.get('[aria-label="Filtrar por departamento"]')
      .contains("button", "Placas de vídeo")
      .should("have.attr", "aria-pressed", "true");
  });

  it("CT-E2E-12 mostra 404 para produto inexistente", () => {
    cy.visitStore("/produto/nao-existe");
    cy.get(".not-found-page")
      .should("contain", "404")
      .and("contain", "Produto não encontrado");
    cy.contains("a", "Voltar para a loja").click();
    cy.location("pathname").should("eq", "/");
  });

  // Regressão do DEF-02: a página pública de montagem recebia o título de 404.
  it("CT-E2E-13 DEF-02 página de montagem pública não recebe título de 404", () => {
    cy.visitStore("/ranking/montagem-exemplo");
    cy.title().should("eq", "Montagem da comunidade | DreamBuild PC");
  });

  it("CT-E2E-14 mostra 404 para rota desconhecida", () => {
    cy.visitStore("/rota/qualquer");
    cy.contains("h1", "Página não encontrada");
    cy.title().should("eq", "Página não encontrada | DreamBuild PC");
  });
});
