import { useEffect, useState } from "react";
import { Play, Pause, Activity } from "lucide-react";
import GamePreview from "./GamePreview.jsx";
export default function FpsStage({ game, opponentGame, resolution }) {
  const [reduced, setReduced] = useState(
    () =>
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  );
  const [paused, setPaused] = useState(null),
    [tick, setTick] = useState(0);
  const playing = paused === null ? !reduced : !paused;
  useEffect(() => {
    const preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    preference?.addEventListener("change", update);
    return () => preference?.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    setTick(0);
  }, [game?.id, resolution]);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      if (!document.hidden) setTick((t) => t + 1);
    }, 450);
    return () => clearInterval(timer);
  }, [playing]);
  const a = game?.results?.[resolution],
    b = opponentGame?.results?.[resolution];
  const display = (n, phase) =>
    Number.isFinite(n)
      ? Math.round(
          n *
            (playing && !reduced
              ? 1 +
                0.035 * Math.sin(tick * 0.83 + phase) +
                0.012 * Math.sin(tick * 2.3)
              : 1),
        )
      : "—";
  return (
    <section className="fps-stage" aria-label="Visualização ilustrativa de FPS">
      <GamePreview preview={game?.preview} playing={playing} />
      <div className="fps-osd">
        <span>
          <Activity size={13} /> DREAMBUILD / REFERÊNCIA
        </span>
        <strong>
          {display(a, 0)} <small>FPS · A</small>
        </strong>
        {opponentGame && (
          <strong className="osd-b">
            {display(b, 1)} <small>FPS · B</small>
          </strong>
        )}
        <p>
          {resolution} · {game?.preset}
        </p>
        <svg viewBox="0 0 240 32" aria-hidden="true">
          <polyline
            points={Array.from(
              { length: 40 },
              (_, i) =>
                `${i * 6},${17 + (playing && !reduced ? 7 * Math.sin((tick + i) * 0.8) + 3 * Math.sin(i * 2.3) : 0)}`,
            ).join(" ")}
          />
        </svg>
      </div>
      <div className="fps-stage-controls">
        <button className="secondary-button" onClick={() => setPaused(playing)}>
          {playing ? <Pause size={15} /> : <Play size={15} />}{" "}
          {playing ? "Pausar prévia" : "Ver prévia animada"}
        </button>
        <p>
          Oscilação ilustrativa em torno da referência. O navegador não está
          executando nem medindo o jogo.
        </p>
      </div>
    </section>
  );
}
