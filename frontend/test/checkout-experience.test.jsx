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
  test("pagamento não renderiza campos que o Chrome possa preencher com cartões salvos", async () => {
    const user = userEvent.setup(),
      onValid = vi.fn();
    const { container, rerender } = render(
      <DreamCardForm card={card} onGenerate={vi.fn()} onValid={onValid} />,
    );
    expect(
      container.querySelectorAll(
        "input,textarea,select,[contenteditable=true]",
      ),
    ).toHaveLength(0);
    await user.click(
      screen.getByRole("button", { name: "Usar este DreamCard" }),
    );
    expect(onValid).toHaveBeenLastCalledWith(
      expect.objectContaining({ number: card.number, token: card.token }),
    );
    rerender(
      <DreamCardForm
        card={{ ...card, token: "other-issued-card" }}
        onGenerate={vi.fn()}
        onValid={onValid}
      />,
    );
    await waitFor(() => expect(onValid).toHaveBeenLastCalledWith(null));
  });
  test("DreamCard expirado não pode ser selecionado", () => {
    const onValid = vi.fn();
    render(
      <DreamCardForm
        card={{ ...card, validUntil: Date.now() - 5000 }}
        onGenerate={vi.fn()}
        onValid={onValid}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Usar este DreamCard" }),
    ).toBeDisabled();
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
