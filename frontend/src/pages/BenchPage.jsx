import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Play, Square, Activity } from "lucide-react";
import { apiRequest, listRecords } from "../api/client.js";
import { useRealtime } from "../context/RealtimeContext.jsx";
import UpgradeSuggestion from "../components/UpgradeSuggestion.jsx";
import SetupCard from "../components/SetupCard.jsx";

export default function BenchPage() {
  const { buildId } = useParams();
  const { socket, connected, error: connectionError } = useRealtime();
  const [build, setBuild] = useState(null);
  const [games, setGames] = useState([]);
  const [gameId, setGameId] = useState("");
  const [resolution, setResolution] = useState("1440p");
  const [overclock, setOverclock] = useState(false);
  const [restrictedCooling, setRestrictedCooling] = useState(false);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [setup, setSetup] = useState(null);
  const [sample, setSample] = useState(null);
  const [history, setHistory] = useState([]);
  useEffect(() => {
    let active = true;
    Promise.all([apiRequest(`/builds/${buildId}`), listRecords("/games")])
      .then(([saved, scenarios]) => {
        if (active) {
          setBuild(saved);
          setGames(scenarios);
          setGameId(scenarios[0]?.id || "");
        }
      })
      .catch((failure) => {
        if (active) setError(failure.message);
      });
    return () => {
      active = false;
    };
  }, [buildId]);
  useEffect(() => {
    if (!socket) return;
    const onSample = (packet) => {
      if (packet.buildId !== buildId) return;
      setSample(packet);
      setHistory((current) => [...current, packet].slice(-60));
    };
    const onState = (state) => {
      setRunning(state.running);
      if (state.message) setMessage(state.message);
    };
    const onDisconnect = () => {
      setRunning(false);
      setBusy(false);
      setMessage("Conexão encerrada. O teste foi interrompido.");
    };
    socket.on("bench:sample", onSample);
    socket.on("bench:state", onState);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.emit("bench:stop");
      socket.off("bench:sample", onSample);
      socket.off("bench:state", onState);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket, buildId]);
  const game = games.find((item) => item.id === gameId);
  function start() {
    if (!socket || !connected) return;
    setBusy(true);
    setError(null);
    setSample(null);
    setHistory([]);
    socket
      .timeout(10000)
      .emit(
        "bench:start",
        { buildId, gameId, resolution, overclock, restrictedCooling },
        (failure, response) => {
          setBusy(false);
          if (failure || response?.status !== "success") {
            socket.emit("bench:stop");
            setError(
              response?.message || "Não foi possível iniciar a simulação.",
            );
            return;
          }
          setSetup(response.data);
          setRunning(true);
        },
      );
  }
  function stop() {
    socket?.emit("bench:stop");
    setRunning(false);
  }
  const ceiling = Math.max(60, ...history.map((point) => point.fps));
  const line = history
    .map(
      (point, index) =>
        `${history.length > 1 ? (index / (history.length - 1)) * 600 : 0},${110 - (point.fps / ceiling) * 100}`,
    )
    .join(" ");
  const metric = (label, value, unit = "") => (
    <div>
      <span>{label}</span>
      <strong>
        {value ?? "—"}
        <small>{value !== undefined ? unit : ""}</small>
      </strong>
    </div>
  );
  return (
    <section className="bench-page">
      <div className="page-heading">
        <div>
          <p>BANCADA DIDÁTICA</p>
          <h1>Veja o modelo em movimento.</h1>
          <p>
            {build?.name || "Carregando montagem..."} · dados sintéticos
            transmitidos em tempo real.
          </p>
        </div>
        <Link className="secondary-button" to={`/montar?build=${buildId}`}>
          Voltar à montagem
        </Link>
      </div>
      <div className="simulation-disclosure">
        <Activity size={20} aria-hidden="true" />
        <p>
          <strong>Simulação, sem benchmark medido.</strong> Os valores não medem
          seu computador nem estimam FPS real. Pesos e índices são
          demonstrativos; o jogo não está sendo executado.
        </p>
      </div>
      {(error || connectionError) && (
        <p className="form-error" role="alert">
          {error || connectionError}
        </p>
      )}
      <div className="bench-controls">
        <label className="field-label">
          Cenário
          <select
            value={gameId}
            onChange={(event) => setGameId(event.target.value)}
            disabled={running || busy}
          >
            {games.map((item) => (
              <option value={item.id} key={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Resolução do modelo
          <select
            value={resolution}
            onChange={(event) => setResolution(event.target.value)}
            disabled={running || busy}
          >
            <option>1080p</option>
            <option>1440p</option>
            <option>4K</option>
          </select>
        </label>
        <label className="bench-check">
          <input
            type="checkbox"
            checked={overclock}
            disabled={running || busy}
            onChange={(event) => setOverclock(event.target.checked)}
          />
          <span>Overclock fictício +15% de clock</span>
        </label>
        <label className="bench-check">
          <input
            type="checkbox"
            checked={restrictedCooling}
            disabled={running || busy}
            onChange={(event) => setRestrictedCooling(event.target.checked)}
          />
          <span>Simular fluxo de ar restrito</span>
        </label>
        <div className="bench-buttons">
          <button
            className="primary-button"
            disabled={!connected || !gameId || !build || busy || running}
            onClick={start}
          >
            <Play size={16} aria-hidden="true" />
            {busy ? "Iniciando..." : "Iniciar simulação"}
          </button>
          <button
            className="secondary-button"
            disabled={!running && !busy}
            onClick={stop}
          >
            <Square size={15} aria-hidden="true" />
            Parar
          </button>
        </div>
      </div>
      <p className="bench-connection" role="status">
        {connected
          ? "Conexão em tempo real disponível"
          : "Aguardando conexão em tempo real"}{" "}
        · {running ? "Em execução" : message || "Pronto para iniciar"} · limite
        de dois minutos
      </p>
      <div className="bench-stage">
        {game && (
          <img
            className="bench-scene"
            src={game.screenshotUrl}
            alt={`Imagem oficial ilustrativa de ${game.title}`}
          />
        )}
        <div className="bench-overlay">
          <div className="bench-overlay-title">
            DREAMBUILD · DADOS SIMULADOS
          </div>
          <p>
            {game?.title || "Escolha um cenário"} · {resolution}
          </p>
          <div className="bench-overlay-metrics">
            {metric("FPS do modelo", sample?.fps)}
            {metric("1% low fictício", sample?.onePercentLow)}
            {metric("CPU simulada", sample?.cpuTemperature, " °C")}
            {metric("GPU simulada", sample?.gpuTemperature, " °C")}
            {metric("Uso CPU fictício", sample?.cpuUsage, "%")}
            {metric("Uso GPU fictício", sample?.gpuUsage, "%")}
          </div>
          {sample?.throttling && (
            <p className="bench-thermal-alert" role="alert">
              Cenário acima de 95 °C: redução fictícia de desempenho. Este
              limiar não representa o limite oficial de cada componente.
            </p>
          )}
        </div>
        <span className="bench-image-label">
          Imagem ilustrativa da editora; não é captura de um jogo em execução.
        </span>
      </div>
      <div className="bench-bottom">
        <section className="bench-chart">
          <h2>FPS sintético ao longo do tempo</h2>
          <p>
            Últimas {history.length} amostras recebidas. Atualização nominal a
            cada 500 ms.
          </p>
          <svg
            viewBox="0 0 600 125"
            role="img"
            aria-label="Linha do FPS sintético recebido"
          >
            <line x1="0" y1="110" x2="600" y2="110" stroke="#c8d1da" />
            {history.length > 1 && (
              <polyline
                points={line}
                fill="none"
                stroke="#bf4b20"
                strokeWidth="2.5"
              />
            )}
          </svg>
        </section>
        <section className="bench-details">
          <h2>Parâmetros do cenário</h2>
          <dl>
            <div>
              <dt>Índices CPU / GPU / RAM</dt>
              <dd>
                {setup
                  ? `${setup.cpuScore} / ${setup.gpuScore} / ${setup.ramScore}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Peso do cenário / fator da resolução</dt>
              <dd>
                {setup
                  ? `${setup.gameWeight} / ${setup.resolutionFactor}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>FPS-base da fórmula didática</dt>
              <dd>{setup ? setup.baseFps.toFixed(2) : "—"}</dd>
            </div>
            <div>
              <dt>Ventoinha fictícia</dt>
              <dd>{sample ? `${sample.fanRpm} RPM` : "—"}</dd>
            </div>
            <div>
              <dt>Clock CPU fictício</dt>
              <dd>{sample ? `${sample.cpuClockMHz} MHz` : "—"}</dd>
            </div>
            <div>
              <dt>Clock GPU fictício</dt>
              <dd>{sample ? `${sample.gpuClockMHz} MHz` : "—"}</dd>
            </div>
            <div>
              <dt>Potência do modelo</dt>
              <dd>{sample ? `${sample.powerWatts} W` : "—"}</dd>
            </div>
            <div>
              <dt>Diferença dos índices didáticos CPU/GPU</dt>
              <dd>{setup ? `${setup.balancePercent}%` : "—"}</dd>
            </div>
          </dl>
        </section>
      </div>
      {build && (
        <>
          <UpgradeSuggestion build={build} />
          <SetupCard build={build} id={build.id} />
        </>
      )}
      <details className="simulation-method">
        <summary>Como os números são produzidos</summary>
        <p>
          FPS-base = (índice GPU × 0,65 + CPU × 0,25 + RAM × 0,10) ÷ (fator de
          resolução × peso didático do cenário). Fatores: 1080p = 1; 1440p =
          1,35; 4K = 1,85. As três peças de referência começam com índice 100.
          Esses índices não são resultados medidos e não devem orientar uma
          compra.
        </p>
        <p>
          Temperaturas, carga, rotação, clocks e variações seguem curvas
          matemáticas ilustrativas. Overclock e resfriamento restrito alteram
          somente o modelo. Nenhum comando de overclock é executado no
          computador.
        </p>
      </details>
    </section>
  );
}
