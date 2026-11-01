// CT-INT-05 — Integração de componentes React: ProductCatalog + ProductTile +
// CardPrice + AddToCartButton (com o contexto do carrinho simulado).
import { describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import ProductCatalog from "../src/components/ProductCatalog.jsx";
import catalog from "../cypress/fixtures/catalog.json";

const cart = { busy: false, add: vi.fn(() => Promise.resolve()), cart: null };
vi.mock("../src/context/CartContext.jsx", () => ({ useCart: () => cart }));

function renderCatalog(props = {}) {
  return render(
    <MemoryRouter>
      <ProductCatalog
        products={catalog}
        category="all"
        query=""
        onCategoryChange={() => {}}
        onClear={() => {}}
        {...props}
      />
    </MemoryRouter>,
  );
}
const titles = () =>
  screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);

describe("CT-INT-05 catálogo renderizado", () => {
  test("mostra todos os produtos com contagem e preço", () => {
    renderCatalog();
    expect(screen.getByRole("status")).toHaveTextContent(
      "5 modelos encontrados",
    );
    expect(screen.getAllByRole("article")).toHaveLength(5);
    expect(screen.getAllByText(/no PIX · KaBuM!/).length).toBeGreaterThan(0);
  });

  test("busca ignora acentos e caixa; texto da busca aparece na contagem", () => {
    renderCatalog({ query: "  RYZÉN " });
    expect(screen.getByRole("status")).toHaveTextContent(
      "2 modelos encontrados para “RYZÉN”",
    );
  });

  test("busca por fabricante da GPU inferido (NVIDIA)", () => {
    renderCatalog({ query: "nvidia" });
    expect(titles()).toEqual([expect.stringContaining("RTX 5060")]);
  });

  test("categoria filtra e o botão fica pressionado", () => {
    renderCatalog({ category: "ram" });
    expect(titles()).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Memórias" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  // Regressão do DEF-01: busca só com símbolos listava o catálogo inteiro.
  test.each(["!!!", "-", "  ?  "])(
    "DEF-01 busca só com símbolos (%j) não retorna todos os produtos",
    (query) => {
      renderCatalog({ query });
      expect(screen.queryAllByRole("article")).toHaveLength(0);
      expect(screen.getByText("Nenhum modelo encontrado")).toBeInTheDocument();
    },
  );

  test("estado vazio chama onClear", async () => {
    const onClear = vi.fn();
    renderCatalog({ query: "xyz-inexistente", onClear });
    expect(screen.getByText("Nenhum modelo encontrado")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Limpar filtros" }),
    );
    expect(onClear).toHaveBeenCalledOnce();
  });

  test("ordenação por nome e por preço; sem oferta vai para o fim", async () => {
    renderCatalog();
    const select = screen.getByRole("combobox");
    await userEvent.selectOptions(select, "name");
    const byName = titles();
    expect([...byName].sort((a, b) => a.localeCompare(b, "pt-BR"))).toEqual(
      byName,
    );
    await userEvent.selectOptions(select, "price-asc");
    expect(titles()[0]).toMatch(/SSD Adata/);
    expect(titles().at(-1)).toMatch(/9800X3D/);
  });

  test("somente disponíveis remove o produto sem oferta", async () => {
    renderCatalog();
    await userEvent.click(
      screen.getByRole("checkbox", { name: /Somente disponíveis/ }),
    );
    expect(titles()).toHaveLength(4);
    expect(titles().join()).not.toMatch(/9800X3D/);
  });

  test("botão do carrinho: habilitado chama add, indisponível fica desabilitado", async () => {
    renderCatalog();
    const [available] = screen.getAllByRole("button", {
      name: /Adicionar AMD Ryzen 3 3200G/,
    });
    await userEvent.click(available);
    expect(cart.add).toHaveBeenCalledWith(
      expect.objectContaining({ id: "kabum-102248" }),
    );
    const card = screen
      .getByRole("heading", { name: /9800X3D/ })
      .closest("article");
    expect(
      within(card).getByRole("button", { name: /Adicionar/ }),
    ).toBeDisabled();
  });

  test("mais de 24 produtos mostra paginação incremental", async () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      ...catalog[0],
      id: `p${i}`,
      slug: `p${i}`,
      name: `Produto ${i}`,
    }));
    renderCatalog({ products: many });
    expect(screen.getAllByRole("article")).toHaveLength(24);
    expect(screen.getByText("24 de 30 modelos")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Mostrar mais produtos" }),
    );
    expect(screen.getAllByRole("article")).toHaveLength(30);
  });
});
