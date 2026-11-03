import { describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DreamCardForm from "../src/components/DreamCardForm.jsx";
import AddressBook from "../src/components/AddressBook.jsx";
import { apiRequest } from "../src/api/client.js";
vi.mock("../src/api/client.js", () => ({ apiRequest: vi.fn() }));
const card = {
  number: "0000001234567890",
  holderName: "Cliente Teste",
  cvv: "123",
  validUntil: Date.now() + 600000,
  token: "test-only",
};
describe("Revisão da compra", () => {
  test("aceita apenas dados do DreamCard emitido e invalida quando um campo é alterado", async () => {
    const user = userEvent.setup(),
      onValid = vi.fn();
    render(
      <DreamCardForm card={card} onGenerate={vi.fn()} onValid={onValid} />,
    );
    expect(
      screen.getByText("Preencha os quatro campos para continuar."),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Preencher com meu DreamCard" }),
    );
    expect(onValid).toHaveBeenLastCalledWith(
      expect.objectContaining({ number: card.number, token: card.token }),
    );
    await user.clear(screen.getByLabelText("Código de demonstração"));
    await user.type(screen.getByLabelText("Código de demonstração"), "999");
    expect(onValid).toHaveBeenLastCalledWith(null);
  });
  test("cartão expirado não autoriza avançar mesmo com os campos preenchidos", async () => {
    const onValid = vi.fn(),
      user = userEvent.setup();
    render(
      <DreamCardForm
        card={{ ...card, validUntil: Date.now() - 5000 }}
        onGenerate={vi.fn()}
        onValid={onValid}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Preencher com meu DreamCard" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("expirou");
    expect(onValid).toHaveBeenLastCalledWith(null);
  });
  test("endereço não salvo é escolhido sem gravar no servidor", async () => {
    apiRequest.mockResolvedValue([]);
    const onChoose = vi.fn(),
      user = userEvent.setup();
    render(<AddressBook onChoose={onChoose} />);
    await user.click(
      await screen.findByRole("button", { name: "Adicionar endereço" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Preencher exemplo fictício" }),
    );
    await user.click(
      screen.getByLabelText("Salvar este endereço na minha conta"),
    );
    await user.click(
      screen.getByRole("button", { name: "Usar este endereço" }),
    );
    await waitFor(() =>
      expect(onChoose).toHaveBeenLastCalledWith(
        expect.objectContaining({ city: "São Paulo", postalCode: "01001000" }),
      ),
    );
    expect(
      apiRequest.mock.calls.every(
        (call) => !call[1] || call[1].method !== "POST",
      ),
    ).toBe(true);
  });
});
