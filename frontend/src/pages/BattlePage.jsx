import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Swords,
  Monitor,
  Laptop,
  ExternalLink,
  ArrowRight,
  Check,
} from "lucide-react";
import { apiRequest, listRecords } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { money, consultationDate } from "../data/offers.js";
import FpsStage from "../components/FpsStage.jsx";
import BattleAdvantages from "../components/BattleAdvantages.jsx";
import BattleSetupPicker from "../components/BattleSetupPicker.jsx";
import BattleGamesChart from "../components/BattleGamesChart.jsx";
import "../combat.css";
import {
  commonBenchmarks,
  sameBenchmark,
} from "../../../shared/benchmarkComparison.js";
const fpsLabel = (n) =>
  Number.isFinite(n)
    ? `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} FPS`
    : "Sem medição";
export function SystemPrice({ system }) {
  return (
    <div className="system-price">
      <small>
        {system.priceKind === "academic"
          ? "Preço acadêmico simulado"
          : system.available === false
            ? "Preço exibido pela loja · sem estoque"
            : "Valor consultado à vista"}
      </small>
      <strong>
        {Number.isSafeInteger(system.priceCents)
          ? money(system.priceCents)
          : "Cotação incompleta"}
      </strong>
      {system.priceCheckedAt && (
        <span>
          {consultationDate(system.priceCheckedAt)} · frete não incluído
        </span>
      )}
    </div>
  );
}
export default function BattlePage({ showQuotaNotice = true }) {
  const auth = useAuth(),
    [params, setParams] = useSearchParams();
  const [systems, setSystems] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(null),
    [attempt, setAttempt] = useState(0),
    [custom, setCustom] = useState(null),
    [myBuilds, setMyBuilds] = useState([]),
    [customBusy, setCustomBusy] = useState(false);
  const [publicItem, setPublicItem] = useState(null),
    publicId = params.get("publico");
  useEffect(() => {
    setPublicItem(null);
    if (!publicId) return;
    const c = new AbortController();
    apiRequest(`/community/builds/${publicId}`, { signal: c.signal })
      .then(setPublicItem)
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [publicId]);
  const resolution = params.get("res") === "1440p" ? "1440p" : "1080p";
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    apiRequest("/systems", { signal: c.signal })
      .then(setSystems)
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [attempt]);
  useEffect(() => {
    if (!auth.user) {
      setMyBuilds([]);
      setCustom(null);
      return;
    }
    const c = new AbortController();
    listRecords("/builds/my", c.signal)
      .then(setMyBuilds)
      .catch(() => {});
    return () => c.abort();
  }, [auth.user?.id]);
  useEffect(() => {
    if (!custom) return;
    let active = true;
    setCustomBusy(true);
    apiRequest(`/builds/${custom.id}/performance?resolution=${resolution}`)
      .then((r) => {
        if (active) setCustom(r);
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setCustom(null);
        }
      })
      .finally(() => {
        if (active) setCustomBusy(false);
      });
    return () => {
      active = false;
    };
  }, [resolution, custom?.id]);
  function choose(side, id) {
    setParams(
      (old) => {
        const next = new URLSearchParams(old);
        next.set(side, id);
        if (side === "a" || side === "b") next.delete("jogo");
        return next;
      },
      { replace: true },
    );
  }
  const available = [
    ...systems,
    ...(publicItem
      ? [
          {
            ...publicItem,
            publicCommunity: true,
            id: `public-${publicItem.id}`,
            name: publicItem.title,
            type: "custom",
            cpu: publicItem.configuration.cpu,
            gpu: publicItem.configuration.gpu,
            ram: publicItem.configuration.ram,
            subtitle: `${publicItem.nickname} · PC público · estimativa experimental`,
            priceCheckedAt: publicItem.quotedAt,
            source: publicItem.performance[resolution].source,
            notes: publicItem.performance[resolution].notes,
            games: publicItem.performance["1080p"].games.map((g) => ({
              ...g,
              kind: "estimate",
              results: {
                ...g.results,
                ...publicItem.performance["1440p"].games.find(
                  (t) => t.id === g.id,
                )?.results,
              },
            })),
          },
        ]
      : []),
    ...(custom
      ? [
          {
            ...custom,
            cpu: custom.configuration.cpu,
            gpu: custom.configuration.gpu,
            ram: custom.configuration.ram,
            subtitle:
              custom.kind === "gpu-reference"
                ? "Seu PC · referência da GPU na bancada da fonte"
                : "Seu PC · estimativa experimental",
          },
        ]
      : []),
  ];
  const a = available.find((s) => s.id === params.get("a")) || available[0];
  const suggestedOpponent = available
    .filter((s) => s.id !== a?.id)
    .sort(
      (left, right) =>
        commonBenchmarks(a?.games, right.games, resolution).length -
        commonBenchmarks(a?.games, left.games, resolution).length,
    )[0];
  const b =
    available.find((s) => s.id === params.get("b")) || suggestedOpponent;
  const common = commonBenchmarks(a?.games, b?.games, resolution);
  const gameId = params.get("jogo") || common[0]?.a.id || a?.games?.[0]?.id;
  const game = a?.games?.find((g) => g.id === gameId) || a?.games?.[0];
  const other = b?.games?.find((g) => sameBenchmark(game, g));
  const comparable =
    game &&
    other &&
    sameBenchmark(game, other) &&
    Number.isFinite(game.results[resolution]) &&
    Number.isFinite(other.results[resolution]);
  const averages = common.length
    ? [
        common.reduce((n, p) => n + p.a.results[resolution], 0) / common.length,
        common.reduce((n, p) => n + p.b.results[resolution], 0) / common.length,
      ]
    : null;
  const swap = () =>
    setParams(
      (old) => {
        const next = new URLSearchParams(old);
        next.set("a", b.id);
        next.set("b", a.id);
        return next;
      },
      { replace: true },
    );
  return (
    <section className="battle-page">
      <header className="battle-hero">
        <div>
          <p className="section-kicker">DREAMBUILD / COMBATE DE SETUPS</p>
          <h1>
            Dois setups.
            <br />
            Uma boa escolha.
          </h1>
          <p>
            PC pronto, notebook gamer ou o seu projeto. Coloque lado a lado e
            compare peças, preços e referências nos jogos.
          </p>
          <a href="#escolher-setup" className="primary-button">
            Escolher os competidores <ArrowRight size={17} />
          </a>
        </div>
        <div className="battle-emblem" aria-hidden="true">
          <Monitor />
          <b>VS</b>
          <Laptop />
          <span>HARDWARE EM JOGO</span>
        </div>
      </header>
      {showQuotaNotice &&
        systems.some((s) => s.dataOrigin === "curated-local") && (
          <p className="battle-method-note">
            Referências salvas para consulta. Confira a data dos preços e as
            condições de cada teste antes de comparar.
          </p>
        )}
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
        <p role="status">Carregando configurações e cotações verificadas...</p>
      ) : (
        <>
          {a && b && (
            <BattleSetupPicker
              systems={available}
              a={a}
              b={b}
              onChoose={choose}
              onSwap={swap}
              params={params}
            />
          )}
          <section id="catalogo-setups" className="battle-selection">
            <div className="battle-section-heading">
              <div>
                <p className="section-kicker">ESCOLHA SEU LADO</p>
                <h2>PCs prontos e notebooks gamer</h2>
              </div>
              <Link to="/montar">
                Prefere montar o seu? <ArrowRight size={15} />
              </Link>
            </div>
            <details className="battle-catalog-details">
              <summary>
                Ver as fichas completas dos {available.length} setups
                disponíveis
              </summary>
              <div className="ready-system-grid">
                {available.map((s) => (
                  <article
                    className="ready-system-card"
                    key={s.id}
                    data-selected={
                      a?.id === s.id ? "a" : b?.id === s.id ? "b" : undefined
                    }
                  >
                    <div className="system-card-photo">
                      <span>
                        {s.type === "laptop" ? (
                          <Laptop size={15} />
                        ) : (
                          <Monitor size={15} />
                        )}{" "}
                        {s.type === "laptop"
                          ? "NOTEBOOK GAMER"
                          : s.type === "custom"
                            ? s.publicCommunity
                              ? "PC PÚBLICO"
                              : "MEU PC"
                            : "PC MONTADO"}
                      </span>
                      <img
                        src={s.image}
                        alt={s.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.style.visibility = "hidden";
                        }}
                      />
                    </div>
                    <div className="system-card-body">
                      <h3>{s.name}</h3>
                      <p className="system-sku">{s.subtitle}</p>
                      <dl>
                        <div>
                          <dt>CPU</dt>
                          <dd>{s.cpu}</dd>
                        </div>
                        <div>
                          <dt>GPU</dt>
                          <dd>{s.gpu}</dd>
                        </div>
                        <div>
                          <dt>RAM</dt>
                          <dd>{s.ram}</dd>
                        </div>
                        <div>
                          <dt>SSD</dt>
                          <dd>{s.storage || "Conforme montagem"}</dd>
                        </div>
                      </dl>
                      <SystemPrice system={s} />
                      <span
                        className={
                          s.available === false
                            ? "system-stock unavailable"
                            : "system-stock"
                        }
                      >
                        {s.priceKind === "academic"
                          ? "Configuração de referência · valor simulado"
                          : s.available === false
                            ? "Sem estoque na consulta"
                            : s.type === "custom"
                              ? "Cotação das peças selecionadas"
                              : "Disponível na consulta"}
                      </span>
                      {s.offerUrl && (
                        <a
                          className="system-source-link"
                          href={s.offerUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {s.storeName} · {s.sellerName}{" "}
                          <ExternalLink size={12} />
                        </a>
                      )}
                      <div className="system-team-buttons">
                        {["a", "b"].map((side) => (
                          <button
                            key={side}
                            aria-pressed={(side === "a" ? a : b)?.id === s.id}
                            onClick={() => choose(side, s.id)}
                          >
                            {(side === "a" ? a : b)?.id === s.id ? (
                              <Check size={14} />
                            ) : (
                              <Swords size={14} />
                            )}{" "}
                            Lado {side.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </details>
            {auth.user && myBuilds.length > 0 && (
              <div className="custom-battle-picker">
                <label>
                  Trazer uma montagem da sua conta
                  <select
                    value={custom?.id || ""}
                    disabled={customBusy}
                    onChange={async (e) => {
                      if (!e.target.value) {
                        setCustom(null);
                        return;
                      }
                      setCustomBusy(true);
                      setError(null);
                      try {
                        const r = await apiRequest(
                          `/builds/${e.target.value}/performance?resolution=${resolution}`,
                        );
                        setCustom(r);
                        choose("a", r.id);
                      } catch (e) {
                        setError(e.message);
                      } finally {
                        setCustomBusy(false);
                      }
                    }}
                  >
                    <option value="">Escolha uma montagem salva</option>
                    {myBuilds.map((build) => (
                      <option key={build.id} value={build.id}>
                        {build.name}
                      </option>
                    ))}
                  </select>
                </label>
                {customBusy && (
                  <p role="status">Consultando as peças no servidor...</p>
                )}
              </div>
            )}
          </section>
          {a && b && (
            <section className="battle-arena" id="arena">
              <div className="battle-test-conditions">
                <span>
                  <strong>Resolução</strong> {resolution}
                </span>
                <span>
                  <strong>Preset A</strong> {game?.preset || "Não informado"}
                </span>
                <span>
                  <strong>Preset B</strong>{" "}
                  {other?.preset || "Sem teste equivalente"}
                </span>
                <span>
                  <strong>Origem</strong> Referências / estimativas
                </span>
              </div>
              <BattleAdvantages
                priority={
                  ["fps", "price", "cost"].includes(params.get("prioridade"))
                    ? params.get("prioridade")
                    : "fps"
                }
                onPriority={(value) => choose("prioridade", value)}
                a={a}
                b={b}
                averages={averages}
                gameCount={common.length}
                resolution={resolution}
                onSwap={() =>
                  setParams(
                    (old) => {
                      const next = new URLSearchParams(old);
                      next.set("a", b.id);
                      next.set("b", a.id);
                      return next;
                    },
                    { replace: true },
                  )
                }
              />
              <div className="battle-section-heading">
                <div>
                  <p className="section-kicker">FRENTE A FRENTE</p>
                  <h2>Hora do confronto.</h2>
                </div>
                <div
                  className="battle-resolution"
                  role="group"
                  aria-label="Resolução do combate"
                >
                  {["1080p", "1440p"].map((r) => (
                    <button
                      key={r}
                      aria-pressed={r === resolution}
                      onClick={() =>
                        setParams(
                          (old) => {
                            const n = new URLSearchParams(old);
                            n.set("res", r);
                            return n;
                          },
                          { replace: true },
                        )
                      }
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="battle-versus">
                <div>
                  <small>LADO A</small>
                  <h3>{a.name}</h3>
                  <SystemPrice system={a} />
                </div>
                <b>VS</b>
                <div>
                  <small>LADO B</small>
                  <h3>{b.name}</h3>
                  <SystemPrice system={b} />
                </div>
              </div>
              {a.id === b.id && (
                <p className="battle-method-note">
                  Você escolheu o mesmo equipamento nos dois lados. Selecione
                  outro competidor nos cartões acima.
                </p>
              )}
              <BattleGamesChart
                common={common}
                resolution={resolution}
                selected={game?.id}
                onSelect={(id) => choose("jogo", id)}
              />
              <details className="battle-unmatched-games">
                <summary>Consultar outros jogos e condições das fontes</summary>
                <div
                  className="battle-game-nav"
                  role="group"
                  aria-label="Escolher jogo"
                >
                  {a.games.map((g) => (
                    <button
                      key={g.id}
                      aria-pressed={game?.id === g.id}
                      onClick={() =>
                        setParams(
                          (old) => {
                            const n = new URLSearchParams(old);
                            n.set("jogo", g.id);
                            return n;
                          },
                          { replace: true },
                        )
                      }
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              </details>
              {game && (
                <>
                  <h3 className="battle-game-title">{game.name}</h3>
                  <FpsStage
                    key={`${a.id}-${b.id}`}
                    game={game}
                    opponentGame={other}
                    resolution={resolution}
                  />
                  <div className="battle-game-results">
                    <div>
                      <span>LADO A · {game.preset}</span>
                      <strong>{fpsLabel(game.results[resolution])}</strong>
                      <a href={game.source} target="_blank" rel="noreferrer">
                        Fonte do resultado <ExternalLink size={12} />
                      </a>
                    </div>
                    <div>
                      <span>
                        LADO B ·{" "}
                        {other?.preset || "Jogo não coberto nesta fonte"}
                      </span>
                      <strong>{fpsLabel(other?.results[resolution])}</strong>
                      {other && (
                        <a href={other.source} target="_blank" rel="noreferrer">
                          Fonte do resultado <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                  {!comparable && (
                    <p className="battle-method-note">
                      As duas fontes não têm uma medição com o mesmo jogo,
                      resolução e preset selecionados. Estes números não definem
                      um vencedor.
                    </p>
                  )}
                </>
              )}
              <div className="battle-summary">
                <h3>Somente jogos em comum</h3>
                {averages ? (
                  <>
                    <p>
                      {common.length} jogos com o mesmo preset em {resolution}.
                      Média aritmética das referências:{" "}
                      <b>{fpsLabel(averages[0])}</b> no lado A e{" "}
                      <b>{fpsLabel(averages[1])}</b> no lado B.
                    </p>
                    {a.id !== b.id &&
                      a.available &&
                      b.available &&
                      a.priceCents &&
                      b.priceCents && (
                        <p>
                          Custo por FPS de referência:{" "}
                          <b>{money(Math.round(a.priceCents / averages[0]))}</b>{" "}
                          ×{" "}
                          <b>{money(Math.round(b.priceCents / averages[1]))}</b>
                          . Não inclui frete.
                        </p>
                      )}
                  </>
                ) : (
                  <div>
                    <p>
                      Não há cobertura comum nesta resolução. Nenhuma média
                      entre grupos diferentes será exibida.
                    </p>
                    {resolution === "1440p" &&
                    commonBenchmarks(a.games, b.games, "1080p").length > 0 ? (
                      <button
                        className="secondary-button"
                        onClick={() => choose("res", "1080p")}
                      >
                        Comparar os testes em 1080p
                      </button>
                    ) : suggestedOpponent &&
                      commonBenchmarks(
                        a.games,
                        suggestedOpponent.games,
                        resolution,
                      ).length > 0 ? (
                      <button
                        className="secondary-button"
                        onClick={() => choose("b", suggestedOpponent.id)}
                      >
                        Escolher adversário com testes em comum
                      </button>
                    ) : null}
                  </div>
                )}
                <p>
                  {a.priceKind === "academic" || b.priceKind === "academic"
                    ? "O custo deste duelo inclui preço acadêmico simulado. Não representa uma oferta comercial. "
                    : ""}
                  Laboratórios, versões e cenas podem diferir. Uma referência ou
                  estimativa não comprova o desempenho do equipamento anunciado.
                </p>
              </div>
              <div className="battle-test-details">
                {[a, b].map((s, i) => (
                  <details key={i}>
                    <summary>
                      Lado {i ? "B" : "A"} · configuração e limites do teste
                    </summary>
                    <p>{s.benchmarkNote || s.notes?.join(" ")}</p>
                    {s.tgpWatts && (
                      <p>
                        Potência da GPU na unidade testada: {s.tgpWatts} W.
                        Modo: {s.mode}.
                      </p>
                    )}
                    <p>{s.imageNote}</p>
                    <a href={s.source} target="_blank" rel="noreferrer">
                      Ler teste original <ExternalLink size={12} />
                    </a>
                  </details>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </section>
  );
}
