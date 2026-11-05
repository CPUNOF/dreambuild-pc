import { expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { CartProvider } from "../src/context/CartContext.jsx";
import CartPage from "../src/pages/CartPage.jsx";
import { apiRequest } from "../src/api/client.js";
vi.mock("../src/api/client.js", () => ({ apiRequest: vi.fn() }));
vi.mock("../src/context/AuthContext.jsx", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

test("limpar carrinho exige confirmação, faz uma única exclusão e atualiza o estado vazio", async () => {
  let cart = {
    itemCount: 2,
    knownSubtotalCents: 20000,
    totalCents: 20000,
    items: [
      {
        componentId: "cpu",
        quantity: 2,
        unitPriceCents: 10000,
        lineTotalCents: 20000,
        stockQuantity: 50,
        component: { id: "cpu", slug: "cpu", name: "CPU teste", hardware: {} },
      },
    ],
  };
  apiRequest.mockImplementation(async (_path, options) => {
    if (options?.method === "DELETE")
      cart = {
        ...cart,
        items: [],
        itemCount: 0,
        totalCents: 0,
        knownSubtotalCents: 0,
      };
    return cart;
  });
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  render(
    <MemoryRouter>
      <CartProvider>
        <CartPage />
      </CartProvider>
    </MemoryRouter>,
  );
  const button = await screen.findByRole("button", { name: "Limpar carrinho" });
  await userEvent.click(button);
  expect(
    apiRequest.mock.calls.some(([, options]) => options?.method === "DELETE"),
  ).toBe(false);
  confirm.mockReturnValue(true);
  await userEvent.click(button);
  expect(
    await screen.findByText("Seu próximo upgrade começa aqui."),
  ).toBeInTheDocument();
  await waitFor(() =>
    expect(
      apiRequest.mock.calls.filter(
        ([path, options]) => path === "/cart" && options?.method === "DELETE",
      ),
    ).toHaveLength(1),
  );
  expect(
    screen.queryByRole("button", { name: "Limpar carrinho" }),
  ).not.toBeInTheDocument();
});
