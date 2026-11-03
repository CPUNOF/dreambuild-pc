describe("Vitrine e catálogo", () => {
  it("CT-E2E-01 carrega a página inicial com cabeçalho, catálogo e status do serviço", () => {
    cy.visitStore("/");
    cy.title().should("eq", "DreamBuild PC | Hardware e montagem de PCs");
    cy.get(".brand").should("contain", "dream");
    cy.get("#products-title").should("have.text", "Explore o catálogo");
    cy.get(".product-grid .product-card").should("have.length", 5);
    cy.get(".results-count").should("contain", "5 modelos encontrados");
    cy.get(".service-status").should("contain", "Serviço conectado");
  });

  it("CT-E2E-02 busca produtos pelo nome ignorando acentos e maiúsculas", () => {
    cy.visitStore("/");
    cy.get("#hardware-search").type("ryzen");
    cy.get(".results-count").should("contain", "2 modelos encontrados");
    cy.get(".product-grid .product-card").each(($card) =>
      cy.wrap($card).should("contain", "Ryzen"),
    );
  });

  it("CT-E2E-03 mostra estado vazio e limpa os filtros", () => {
    cy.visitStore("/");
    cy.get("#hardware-search").type("produto-que-nao-existe");
    cy.contains("h3", "Nenhum modelo encontrado").should("be.visible");
    cy.contains("button", "Limpar filtros").click();
    cy.get("#hardware-search").should("have.value", "");
    cy.get(".product-grid .product-card").should("have.length", 5);
  });

  it("CT-E2E-04 filtra por departamento", () => {
    cy.visitStore("/");
    cy.get('[aria-label="Filtrar por departamento"]')
      .contains("button", "Placas de vídeo")
      .click()
      .should("have.attr", "aria-pressed", "true");
    cy.get(".results-count").should("contain", "1 modelo encontrado");
    cy.get(".product-card").should("contain", "RTX 5060");
  });

  it("CT-E2E-05 filtra somente produtos disponíveis para compra", () => {
    cy.visitStore("/");
    cy.contains("label", "Somente disponíveis para compra")
      .find("input")
      .check();
    cy.get(".results-count").should("contain", "4 modelos encontrados");
    cy.get(".product-grid").should("not.contain", "Ryzen 7 9800X3D");
  });

  it("CT-E2E-06 ordena por menor e maior preço no PIX", () => {
    cy.visitStore("/");
    cy.get(".sort-control select").select("price-asc");
    cy.get("#produtos .product-card h3")
      .first()
      .should("contain", "SSD Adata SU650");
    cy.get(".sort-control select").select("price-desc");
    cy.get("#produtos .product-card h3").first().should("contain", "RTX 5060");
    // Produto sem oferta fica sempre no fim da lista.
    cy.get("#produtos .product-card h3")
      .last()
      .should("contain", "Ryzen 7 9800X3D");
  });

  it("CT-E2E-07 exibe erro quando o catálogo falha e permite tentar de novo", () => {
    cy.mockApi({ catalogError: true });
    cy.visit("/");
    cy.get('[role="alert"]')
      .should("contain", "Catálogo indisponível")
      .and("contain", "Não foi possível carregar os produtos");

    cy.fixture("catalog.json").then((catalog) =>
      cy
        .intercept("GET", "/api/components?*", {
          status: "success",
          data: catalog,
          errors: [],
          meta: { nextCursor: null },
        })
        .as("catalogRetry"),
    );
    cy.contains("button", "Tentar novamente").click();
    cy.wait("@catalogRetry");
    cy.get(".product-grid .product-card").should("have.length", 5);
  });

  it("CT-E2E-08 alterna entre tema claro e escuro e lembra a escolha", () => {
    cy.visitStore("/");
    cy.get(".theme-toggle").then(($btn) => {
      const wasDark = $btn.attr("aria-label") === "Ativar modo claro";
      cy.wrap($btn).click();
      cy.get("html").should(
        "have.attr",
        "data-theme",
        wasDark ? "light" : "dark",
      );
      cy.window()
        .its("localStorage")
        .invoke("getItem", "dreambuild-theme")
        .should("eq", wasDark ? "light" : "dark");
    });
  });
});
