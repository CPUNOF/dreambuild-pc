import { useEffect, useState } from "react";
import { Link } from "react-router";
import { apiRequest } from "../api/client.js";
import FpsStage from "../components/FpsStage.jsx";
import { fpsLabel } from "./RankingPage.jsx";
export default function BenchmarkReferencesPage() {
  const [data, setData] = useState(null),
    [error, setError] = useState(null),
    [attempt, setAttempt] = useState(0),
    [gpu, setGpu] = useState("RTX 5060"),
    [opponent, setOpponent] = useState(""),
    [resolution, setResolution] = useState("1080p"),
    [selected, setSelected] = useState("");
  useEffect(() => {
    const c = new AbortController();
    setError(null);
    apiRequest("/benchmarks", { signal: c.signal })
      .then(setData)
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [attempt]);
  if (error)
    return (
      <div className="form-error" role="alert">
        {error}
        <button onClick={() => setAttempt((n) => n + 1)}>
          Tentar novamente
        </button>
      </div>
    );
  if (!data)
    return (
      <p className="catalog-load-state" role="status">
        Carregando referências dos jogos...
      </p>
    );
  const profiles = Object.keys(data.gpuProfiles).sort(),
    current = data.games.find((g) => g.id === selected) || data.games[0],
    game = { ...current, results: current.results[gpu] },
    other = opponent
      ? { ...current, results: current.results[opponent] }
      : null;
  return (
    <section className="community-page">
      <header className="battle-section-heading">
        <div>
          <p className="section-kicker">DREAMBUILD / LABORATÓRIO</p>
          <h1>Hardware em jogo.</h1>
          <p>
            {profiles.length} GPUs · {data.games.length} jogos ·{" "}
            {profiles.length * data.games.length * 2} resultados publicados em
            1080p e 1440p.
          </p>
        </div>
        <Link className="secondary-button" to="/ranking">
          Ver PCs da comunidade →
        </Link>
      </header>
      {data.dataOrigin === "curated-local" && (
        <p className="catalog-update-notice">
          Exibindo referências verificadas da cópia local versionada. A leitura
          desta versão no banco não está disponível neste momento.
        </p>
      )}
      <p className="battle-method-note">
        Estes são FPS publicados da{" "}
        <strong>GPU no computador de teste da fonte</strong>. Não são medições
        de qualquer montagem feita no site. VRAM, qualidade gráfica e resolução
        são preservadas. A oscilação animada é ilustrativa.
      </p>
      <div className="benchmark-controls">
        <label className="field-label">
          GPU A
          <select
            aria-label="GPU A"
            value={gpu}
            onChange={(e) => {
              setGpu(e.target.value);
              if (opponent === e.target.value) setOpponent("");
            }}
          >
            {profiles.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Comparar com GPU B
          <select
            aria-label="Comparar com GPU B"
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
          >
            <option value="">Sem adversário</option>
            {profiles
              .filter((p) => p !== gpu)
              .map((p) => (
                <option key={p}>{p}</option>
              ))}
          </select>
        </label>
        <div
          className="battle-resolution"
          role="group"
          aria-label="Resolução das referências"
        >
          {["1080p", "1440p"].map((r) => (
            <button
              key={r}
              aria-pressed={r === resolution}
              onClick={() => setResolution(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="reference-setup">
        <span>
          GPU A{" "}
          <b>
            {gpu} · {data.gpuProfiles[gpu].vramGb} GB
          </b>
        </span>
        <span>
          CPU de teste <b>{data.testSetup.cpu}</b>
        </span>
        <span>
          GPU B <b>{opponent || "Não selecionada"}</b>
        </span>
      </div>
      <h2 className="battle-game-title">{current.name}</h2>
      <FpsStage game={game} opponentGame={other} resolution={resolution} />
      <div className="benchmark-game-grid">
        {data.games.map((g) => (
          <button
            key={g.id}
            className={current.id === g.id ? "is-active" : ""}
            aria-pressed={current.id === g.id}
            onClick={() => setSelected(g.id)}
          >
            <span>{g.name}</span>
            <strong>{fpsLabel(g.results[gpu][resolution])}</strong>
            <small>
              {g.preset} · {resolution}
            </small>
            {opponent && <b>B: {fpsLabel(g.results[opponent][resolution])}</b>}
          </button>
        ))}
      </div>
      <details className="community-details">
        <summary>Condições e fontes dos testes</summary>
        <p>{data.methodology}</p>
        <p>
          PC de teste: {data.testSetup.cpu} · {data.testSetup.ram}.{" "}
          {data.gpuProfiles[gpu].testNotes}
        </p>
        <a href={data.gpuProfiles[gpu].source} target="_blank" rel="noreferrer">
          Resultados originais da GPU A ↗
        </a>{" "}
        ·{" "}
        <a
          href={data.gpuProfiles[gpu].setupSource}
          target="_blank"
          rel="noreferrer"
        >
          Computador de teste ↗
        </a>
        {opponent && (
          <>
            {" "}
            ·{" "}
            <a
              href={data.gpuProfiles[opponent].source}
              target="_blank"
              rel="noreferrer"
            >
              Resultados da GPU B ↗
            </a>
          </>
        )}
      </details>
    </section>
  );
}
