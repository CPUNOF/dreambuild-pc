import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Testes unitários e de componente do front-end (Vitest + Testing Library).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.{js,jsx}"],
    setupFiles: ["test/setup.js"],
    restoreMocks: true,
    reporters: ["default"],
    coverage: {
      provider: "v8",
      include: [
        "src/api/**",
        "src/data/offers.js",
        "src/data/componentSelection.js",
        "src/components/ProductCatalog.jsx",
        "src/components/AddToCartButton.jsx",
        "src/components/ProductPrice.jsx",
      ],
      reporter: ["text", "html", "lcov", "json-summary"],
      reportsDirectory: "../reports/coverage/frontend",
    },
  },
});
