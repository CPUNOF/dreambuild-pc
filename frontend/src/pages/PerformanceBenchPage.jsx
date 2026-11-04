import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { apiRequest } from "../api/client.js";
import FpsStage from "../components/FpsStage.jsx";
import BenchPage from "./BenchPage.jsx";
export default function PerformanceBenchPage() {
  const { buildId } = useParams(),
    [mode, setMode] = useState("reference"),
    [resolution, setResolution] = useState("1080p"),
    [report, setReport] = useState(null),
    [error, setError] = useState(null),
    [loading, setLoading] = useState(true),
    [attempt, setAttempt] = useState(0),
    [selected, setSelected] = useState("");
  useEffect(() => {
    if (mode !== "reference") return;
    const c = new AbortController();
    setLoading(true);
    setError(null);
    apiRequest(`/builds/${buildId}/performance?resolution=${resolution}`, {
      signal: c.signal,
    })
      .then(setReport)
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [buildId, resolution, attempt, mode]);
  const covered =
    report?.games.filter((g) => Number.isFinite(g.results?.[resolution])) || [];
  const game =
    covered.find((g) => g.id === selected) || covered[0] || report?.games[0];
  return (
    <section className="performance-bench-page">
      <div
        className="bench-mode-tabs"
        role="group"
        aria-label="Tipo de bancada"
      >
        <button
          aria-pressed={mode === "reference"}
          onClick={() => setMode("reference")}
        >
          Referências de jogos
        </button>
        <button
          aria-pressed={mode === "synthetic"}
          onClick={() => setMode("synthetic")}
        >
          Simulação didática via WebSocket
        </button>
      </div>
      {mode === "synthetic" ? (
        <BenchPage />
      ) : (
        <>
          <header className="battle-section-heading">
            <div>
              <p className="section-kicker">BANCADA DO SEU PROJETO</p>
              <h1>{report?.name || "Seu PC nos jogos"}</h1>
            </div>
            <Link to="/combate">Comparar com PCs prontos e notebooks →</Link>
          </header>
          <p className="battle-method-note">
            {report?.kind === "gpu-reference"
              ? "Referência da GPU na bancada da fonte; sua CPU não tem índice comparável. "
              : "Estimativa experimental baseada em testes publicados e índice médio da CPU. "}{" "}
            Não é uma medição do seu computador. A animação de FPS é
            ilustrativa.
          </p>
          <p>
            <Link to="/referencias-fps">
              Explorar os testes publicados de todas as GPUs →
            </Link>{" "}
            · <Link to="/minhas-montagens">Publicar meu PC no ranking →</Link>
          </p>
          {error && (
            <div className="form-error" role="alert">
              {error}
              <button
                onClick={() => setAttempt((v) => v + 1)}
                className="text-button"
              >
                Tentar novamente
              </button>
            </div>
          )}
          {loading ? (
            <p role="status">Consultando a montagem e as referências...</p>
          ) : (
            report && (
              <>
                <div className="reference-setup">
                  <span>
                    CPU <b>{report.configuration.cpu}</b>
                  </span>
                  <span>
                    GPU <b>{report.configuration.gpu}</b>
                  </span>
                  <span>
                    RAM <b>{report.configuration.ram}</b>
                  </span>
                </div>
                <div
                  className="battle-resolution"
                  role="group"
                  aria-label="Resolução da bancada"
                >
                  {["1080p", "1440p"].map((r) => (
                    <button
                      key={r}
                      aria-pressed={resolution === r}
                      onClick={() => setResolution(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div className="battle-game-nav">
                  {(covered.length ? covered : report.games).map((g) => (
                    <button
                      key={g.id}
                      aria-pressed={game?.id === g.id}
                      onClick={() => setSelected(g.id)}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
                {game && (
                  <>
                    <h2 className="battle-game-title">{game.name}</h2>
                    <FpsStage game={game} resolution={resolution} />
                  </>
                )}
                <div className="battle-summary">
                  <h2>Como chegamos à referência</h2>
                  {report.notes.map((note) => (
                    <p key={note}>{note}</p>
                  ))}
                  <p>
                    CPU e GPU reconhecidas: {report.cpuProfile || "sem dados"} ·{" "}
                    {report.gpuProfile || "sem dados"}. Cobertura:{" "}
                    {report.coveredGames} jogos.
                  </p>
                  <p>
                    Bancada da fonte:{" "}
                    {(game?.testSetup || report.testSetup).cpu} ·{" "}
                    {(game?.testSetup || report.testSetup).ram}.
                  </p>
                  <a
                    href={game?.source || report.source}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Testes gráficos originais ↗
                  </a>{" "}
                  ·{" "}
                  <a href={report.cpuSource} target="_blank" rel="noreferrer">
                    Índice publicado de CPU ↗
                  </a>
                </div>
              </>
            )
          )}
        </>
      )}
    </section>
  );
}
