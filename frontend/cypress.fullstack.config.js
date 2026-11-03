import { defineConfig } from "cypress";
import base from "./cypress.config.js";

// Fluxos completos contra a API real (backend/scripts/e2eServer.js).
export default defineConfig({
  ...base,
  e2e: {
    ...base.e2e,
    specPattern: "cypress/fullstack/**/*.cy.js",
    supportFile: false,
    defaultCommandTimeout: 10000,
  },
});
