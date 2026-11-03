import { useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import StoreSearch from "../src/components/StoreSearch.jsx";
const products = [
  {
    id: "ram",
    slug: "memoria-ddr5",
    name: "Memória DDR5 32 GB",
    fullName: "Memória Corsair DDR5 32 GB",
    category: "ram",
    categoryName: "Memória RAM",
    brand: "Corsair",
    image: "/ram.jpg",
    inventory: { quantity: 50, unitPriceCents: 49990 },
  },
  {
    id: "ssd",
    slug: "ssd-nvme",
    name: "SSD NVMe 1 TB",
    fullName: "SSD Samsung NVMe 1 TB",
    category: "storage",
    categoryName: "Armazenamento",
    brand: "Samsung",
    image: "/ssd.jpg",
    inventory: { quantity: 50, unitPriceCents: 59990 },
  },
];
function Harness({ submit }) {
  const [value, setValue] = useState("");
  return (
    <StoreSearch
      products={products}
      value={value}
      onChange={setValue}
      onSubmit={submit}
    />
  );
}
function mount(submit = vi.fn()) {
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<Harness submit={submit} />} />
        <Route
          path="/produto/memoria-ddr5"
          element={<h1>Produto selecionado</h1>}
        />
      </Routes>
    </MemoryRouter>,
  );
  return submit;
}
describe("Busca com sugestões locais", () => {
  test("mostra preço sem diferenciar acentos e Enter abre a opção ativa", async () => {
    mount();
    const input = screen.getByRole("combobox", { name: "Buscar produtos" });
    await userEvent.type(input, "memoria");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option")).toHaveTextContent("499,90");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(
      screen.getByRole("heading", { name: "Produto selecionado" }),
    ).toBeInTheDocument();
  });
  test("Enter sem opção ativa abre todos os resultados", async () => {
    const submit = mount();
    await userEvent.type(screen.getByRole("combobox"), "ssd{Enter}");
    expect(submit).toHaveBeenCalledOnce();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
  test("Escape fecha as opções e preserva o texto digitado", async () => {
    mount();
    const input = screen.getByRole("combobox");
    await userEvent.type(input, "ssd");
    await userEvent.keyboard("{Escape}");
    expect(input).toHaveValue("ssd");
    expect(input).toHaveAttribute("aria-expanded", "false");
  });
  test("sem correspondência não lista todos os produtos nem consulta a rede", async () => {
    const request = vi.spyOn(globalThis, "fetch");
    mount();
    await userEvent.type(screen.getByRole("combobox"), "!!!");
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Nenhum modelo encontrado",
    );
    expect(request).not.toHaveBeenCalled();
    request.mockRestore();
  });
});
