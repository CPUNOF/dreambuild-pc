import { expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import RankingPage from "../src/pages/RankingPage.jsx";
import { apiRequest } from "../src/api/client.js";
vi.mock("../src/api/client.js", () => ({ apiRequest: vi.fn() }));
const row = {
  id: "a",
  title: "PC teste",
  nickname: "Teste",
  configuration: { cpu: "CPU", gpu: "GPU" },
  averageFps: 100,
  gameCount: 10,
};

test("trocar classificação por galeria não usa a linha de ranking como relatório completo", async () => {
  let resolveGallery;
  apiRequest.mockImplementation((url) =>
    url.includes("gallery")
      ? new Promise((resolve) => {
          resolveGallery = resolve;
        })
      : Promise.resolve([row]),
  );
  render(
    <MemoryRouter>
      <RankingPage />
    </MemoryRouter>,
  );
  await screen.findByText("100 FPS");
  await userEvent.click(screen.getByRole("button", { name: "Galeria de PCs" }));
  await waitFor(() => expect(resolveGallery).toBeTypeOf("function"));
  resolveGallery([
    { ...row, performance: { "1080p": { rankAverageFps: 110 } } },
  ]);
  expect(await screen.findByText("110 FPS")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /Explorar montagem/ }),
  ).toHaveAttribute("href", "/ranking/a");
});

test("publicação sem cobertura não deixa a galeria em branco", async () => {
  apiRequest.mockResolvedValue([row]);
  render(
    <MemoryRouter initialEntries={["/ranking?ver=galeria"]}>
      <RankingPage />
    </MemoryRouter>,
  );
  expect(await screen.findByText("Sem estimativa")).toBeInTheDocument();
  expect(screen.getByText("PC teste")).toBeInTheDocument();
});
