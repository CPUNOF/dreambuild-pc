import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BattleGamesChart from "../src/components/BattleGamesChart.jsx";
import BattleAdvantages from "../src/components/BattleAdvantages.jsx";
import { publicBattleUrl } from "../src/data/publicLinks.js";
const game = (id, name, value) => ({
  id,
  name,
  preset: "Ultra, RT off",
  results: { "1080p": value },
});
const common = [
  { a: game("one", "Jogo Alpha", 120), b: game("one", "Jogo Alpha", 80) },
  { a: game("two", "Jogo Beta", 60), b: game("two", "Jogo Beta", 90) },
];
describe("Combate: gráficos, prioridade e compartilhamento", () => {
  test("busca e seleção usam o jogo escolhido nas referências", async () => {
    const select = vi.fn();
    render(
      <BattleGamesChart
        common={common}
        resolution="1080p"
        selected="one"
        onSelect={select}
      />,
    );
    await userEvent.type(
      screen.getByRole("searchbox", { name: "Buscar jogo no gráfico" }),
      "Beta",
    );
    expect(
      screen.queryByRole("button", { name: /Jogo Alpha/ }),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Jogo Beta/ }));
    expect(select).toHaveBeenCalledWith("two");
  });
  test("sem jogos equivalentes não inventa barras nem vencedor", () => {
    render(
      <BattleGamesChart common={[]} resolution="1440p" onSelect={vi.fn()} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Não há testes");
    expect(
      screen.queryByRole("button", { name: /à frente/ }),
    ).not.toBeInTheDocument();
  });
  test("prioridade muda o resultado entre maior FPS e menor preço", async () => {
    render(
      <BattleAdvantages
        a={{ id: "a", name: "Setup rápido", priceCents: 600000 }}
        b={{ id: "b", name: "Setup econômico", priceCents: 400000 }}
        averages={[120, 90]}
        gameCount={2}
        resolution="1080p"
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Lado A · Setup rápido",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Menor preço", exact: true }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Lado B · Setup econômico",
    );
  });
  test("link compartilha somente seleções públicas e mantém resolução, jogo e prioridade", () => {
    const url = new URL(
      publicBattleUrl(
        new URLSearchParams(
          "res=1440p&jogo=one&prioridade=cost&token=nao-compartilhar",
        ),
        "a",
        "b",
      ),
    );
    expect(url.origin).toBe("https://dreambuild-pc.vercel.app");
    expect(url.searchParams.get("res")).toBe("1440p");
    expect(url.searchParams.get("prioridade")).toBe("cost");
    expect(url.searchParams.has("token")).toBe(false);
  });
});
