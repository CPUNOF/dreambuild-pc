import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FpsStage from "../src/components/FpsStage.jsx";
let intersection;
const game = {
  id: "one",
  preset: "Ultra",
  results: { "1080p": 90 },
  preview: { poster: "/poster.jpg", video: "https://example.test/game.m3u8" },
};
beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback) {
        intersection = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLMediaElement.prototype, "canPlayType").mockReturnValue(
    "probably",
  );
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
test("inicia sem som quando visível, pausa fora da tela e respeita pausa ao trocar de jogo", async () => {
  const { container, rerender } = render(
    <FpsStage game={game} resolution="1080p" />,
  );
  expect(screen.getByRole("button", { name: "Pausar prévia" })).toBeEnabled();
  expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  act(() => intersection([{ isIntersecting: true }]));
  await waitFor(() =>
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled(),
  );
  const video = container.querySelector("video");
  expect(video.muted).toBe(true);
  expect(video.autoplay).toBe(true);
  act(() => intersection([{ isIntersecting: false }]));
  expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  expect(video).not.toHaveAttribute("src");
  await userEvent.click(screen.getByRole("button", { name: "Pausar prévia" }));
  rerender(<FpsStage game={{ ...game, id: "two" }} resolution="1080p" />);
  expect(
    screen.getByRole("button", { name: "Ver prévia animada" }),
  ).toBeEnabled();
});
test("movimento reduzido começa pausado e permite ativação voluntária", async () => {
  window.matchMedia.mockReturnValue({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  render(<FpsStage game={game} resolution="1080p" />);
  act(() => intersection([{ isIntersecting: true }]));
  expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  await userEvent.click(
    screen.getByRole("button", { name: "Ver prévia animada" }),
  );
  await waitFor(() =>
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled(),
  );
});
