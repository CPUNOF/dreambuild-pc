import { expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import BuilderPage from "../src/pages/BuilderPage.jsx";
import {
  assemblyDraftKey,
  writeAssemblyDraft,
} from "../src/data/assemblyDraft.js";
vi.mock("../src/context/AuthContext.jsx", () => ({
  useAuth: () => ({ user: { id: "client-a" } }),
}));
vi.mock("../src/context/CartContext.jsx", () => ({ useCart: () => ({}) }));
vi.mock("../src/api/client.js", () => ({
  apiRequest: vi.fn().mockResolvedValue({ partIds: {} }),
}));
vi.mock("../src/components/AssemblyWorkspace.jsx", () => ({
  default: ({ partIds, activeCategory }) => (
    <output data-testid="selection">
      {partIds.cpu || "vazio"}:{activeCategory}
    </output>
  ),
}));
const cpu = {
  id: "cpu",
  name: "CPU teste",
  category: "cpu",
  hardware: { socket: "AM4", tdpWatts: 65, coolerPackage: "included" },
  inventory: { quantity: 50, unitPriceCents: 10000 },
};
const mount = () =>
  render(
    <MemoryRouter>
      <BuilderPage products={[cpu]} />
    </MemoryRouter>,
  );

test("bancada mantém seleção ao sair e voltar e só zera quando solicitada", async () => {
  writeAssemblyDraft(sessionStorage, assemblyDraftKey("client-a"), {
    partIds: { cpu: "cpu" },
    quantities: {},
    storageIds: [],
    activeCategory: "ram",
    name: "Meu PC salvo na sessão",
  });
  const first = mount();
  await waitFor(() =>
    expect(screen.getByTestId("selection")).toHaveTextContent("cpu:ram"),
  );
  first.unmount();
  const second = mount();
  await waitFor(() =>
    expect(screen.getByTestId("selection")).toHaveTextContent("cpu:ram"),
  );
  await userEvent.click(screen.getByRole("button", { name: "Limpar bancada" }));
  await waitFor(() =>
    expect(screen.getByTestId("selection")).toHaveTextContent("vazio:cpu"),
  );
  second.unmount();
  mount();
  await waitFor(() =>
    expect(screen.getByTestId("selection")).toHaveTextContent("vazio:cpu"),
  );
});
