// Comandos que simulam a API do DreamBuild no formato do ApiResponseView:
// { status, message, data, errors, meta }.

const ok = (data, meta = {}) => ({
  status: "success",
  message: "OK",
  data,
  errors: [],
  meta,
});
const fail = (statusCode, message, errors = []) => ({
  statusCode,
  body: { status: "error", message, data: null, errors, meta: {} },
});

export const users = {
  client: {
    id: "user-client",
    name: "Cliente Teste",
    email: "cliente@dreambuild.test",
    role: "CLIENT",
    preferences: {},
    googleLinked: false,
  },
  admin: {
    id: "user-admin",
    name: "Admin Teste",
    email: "admin@dreambuild.test",
    role: "ADMIN",
    preferences: {},
    googleLinked: false,
  },
};

function pixOffer(product) {
  const stock = product.inventory;
  return stock?.quantity > 0
    ? { priceCents: stock.unitPriceCents, quantity: stock.quantity }
    : null;
}

// Monta a resposta de /api/cart com os mesmos campos usados pela interface.
function summarizeCart(lines, catalog) {
  const items = lines.map((line) => {
    const component = catalog.find((p) => p.id === line.componentId) || null;
    const offer = component && pixOffer(component);
    return {
      ...line,
      component,
      unavailable: !offer,
      stockQuantity: offer?.quantity || 0,
      unitPriceCents: offer ? offer.priceCents : null,
      lineTotalCents: offer ? offer.priceCents * line.quantity : null,
    };
  });
  const known = items.reduce((sum, i) => sum + (i.lineTotalCents || 0), 0);
  const hasUnavailableProducts = items.some((i) => i.unavailable);
  return {
    items,
    quoteVersion: "cypress",
    itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
    totalCents: hasUnavailableProducts ? null : known,
    knownSubtotalCents: known,
    hasMissingProducts: items.some((i) => !i.component),
    hasUnavailableProducts,
  };
}

/**
 * Simula a API inteira para uma visita.
 * @param {object} options
 * @param {object|null} options.user usuário já autenticado (null = visitante)
 * @param {Array} options.cart linhas iniciais do carrinho [{componentId, quantity}]
 * @param {boolean} options.catalogError faz /api/components falhar
 */
Cypress.Commands.add(
  "mockApi",
  ({ user = null, cart = [], catalogError = false } = {}) => {
    const state = { user, lines: cart.map((l) => ({ ...l })) };
    cy.wrap(state, { log: false }).as("apiState");

    // Qualquer rota não simulada responde 404 em vez de tentar o servidor real.
    cy.intercept({ url: "/api/**" }, (req) =>
      req.reply(fail(404, `Rota não simulada: ${req.method} ${req.url}`)),
    );
    cy.intercept("/socket.io/**", { statusCode: 404, body: "" });

    cy.intercept("GET", "/api/health", ok({ service: "dreambuild-api" })).as(
      "health",
    );
    cy.intercept(
      "GET",
      "/api/auth/providers",
      ok({ google: { enabled: false, config: null } }),
    );
    cy.intercept("GET", "/api/auth/session", (req) =>
      req.reply(ok({ user: state.user, csrfToken: "csrf-cypress" })),
    ).as("session");

    cy.fixture("catalog.json").then((catalog) => {
      state.catalog = catalog;
      cy.intercept(
        "GET",
        "/api/inventory?*",
        ok(
          catalog
            .filter((p) => p.inventory)
            .map((p) => ({ componentId: p.id, ...p.inventory })),
          { nextCursor: null },
        ),
      ).as("inventory");
      if (catalogError)
        cy.intercept(
          "GET",
          "/api/components?*",
          fail(503, "Catálogo indisponível"),
        ).as("catalog");
      else
        cy.intercept(
          "GET",
          "/api/components?*",
          ok(catalog, { nextCursor: null, source: "firestore" }),
        ).as("catalog");

      cy.intercept("GET", "/api/cart", (req) =>
        req.reply(ok(summarizeCart(state.lines, catalog))),
      ).as("cart");

      cy.intercept(
        { method: /PUT|DELETE/, url: "/api/cart/items/*" },
        (req) => {
          expect(req.headers["x-csrf-token"]).to.eq("csrf-cypress");
          const id = req.url.split("/").pop();
          state.lines = state.lines.filter((l) => l.componentId !== id);
          if (req.method === "PUT")
            state.lines.push({ componentId: id, quantity: req.body.quantity });
          req.reply(ok(summarizeCart(state.lines, catalog)));
        },
      ).as("cartUpdate");
    });

    cy.intercept("POST", "/api/auth/login", (req) => {
      const { email, password } = req.body;
      const found = Object.values(users).find((u) => u.email === email);
      if (!found || password !== "senha-correta-123")
        return req.reply(fail(401, "E-mail ou senha incorretos."));
      state.user = found;
      req.reply(ok({ user: found, csrfToken: "csrf-cypress" }));
    }).as("login");

    cy.intercept("POST", "/api/auth/register", (req) => {
      state.user = {
        ...users.client,
        id: "user-new",
        name: req.body.name,
        email: req.body.email,
      };
      req.reply(ok({ user: state.user, csrfToken: "csrf-cypress" }));
    }).as("register");

    cy.intercept("POST", "/api/auth/logout", (req) => {
      state.user = null;
      req.reply(ok({ csrfToken: "csrf-cypress" }));
    }).as("logout");

    cy.intercept("GET", "/api/orders/my?*", ok([], { nextCursor: null })).as(
      "orders",
    );
  },
);

/** Visita uma rota com a API simulada e espera o catálogo carregar. */
Cypress.Commands.add("visitStore", (path = "/", options = {}) => {
  cy.mockApi(options);
  cy.visit(path);
  cy.wait("@catalog");
});
