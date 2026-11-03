import { defineConfig } from "cypress";

// Testes E2E da interface. A API é simulada com cy.intercept (ver
// cypress/support/commands.js), então não é preciso Firebase nem back-end.
export default defineConfig({
  e2e: {
    baseUrl: "http://127.0.0.1:5173",
    specPattern: "cypress/e2e/**/*.cy.js",
    supportFile: "cypress/support/e2e.js",
    viewportWidth: 1366,
    viewportHeight: 900,
    video: false,
    defaultCommandTimeout: 8000,
    retries: { runMode: 1, openMode: 0 },
  },
});
