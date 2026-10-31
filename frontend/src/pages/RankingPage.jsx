import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Trophy, ArrowUpRight, Monitor, Swords } from "lucide-react";
import { apiRequest } from "../api/client.js";
import { money, consultationDate } from "../data/offers.js";
export const fpsLabel = (n) =>
  Number.isFinite(n)
    ? `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} FPS`
    : "Sem estimativa";
export default function RankingPage() {
  const [params, setParams] = useSearchParams(),
    resolution = params.get("res") === "1440p" ? "1440p" : "1080p",
    sort = params.get("ordem") === "value" ? "value" : "performance",
    view = params.get("ver") === "galeria" ? "galeria" : "ranking";
  const [rows, setRows] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(null),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    setRows([]);
    apiRequest(
      view === "ranking"
        ? `/community/ranking?resolution=${resolution}&sort=${sort}`
        : "/community/gallery",
      { signal: c.signal },
    )
      .then(setRows)
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [view, resolution, sort, attempt]);
  function filter(key, value) {
    setParams(
      (old) => {
        const next = new URLSearchParams(old);
        next.set(key, value);
        return next;
      },
      { replace: true },
    );
  }
  return (
    <section className="community-page">
      <header className="community-hero">
        <div>
          <p className="section-kicker">
            <Trophy size={17} /> DREAMBUILD / COMUNIDADE
          </p>
          <h1>Quem montou melhor?</h1>
          <p>
            Compare os projetos da comunidade. Encontre mais desempenho por real
            e compartilhe a sua montagem.
          </p>
          <div className="community-actions">
            <Link className="primary-button" to="/minhas-montagens">
              Publicar meu PC <ArrowUpRight size={16} />
            </Link>
            <Link className="secondary-button" to="/minhas-publicacoes">
              Minhas publicações
            </Link>
          </div>
        </div>
        <div className="community-method">
          <Trophy size={30} />
          <strong>
            Mesmo cenário. <br />
            Uma disputa mais justa.
          </strong>
          <span>1080p ou 1440p · mesmos 10 jogos · mesma versão da base.</span>
          <Link to="/referencias-fps">Explorar os testes de 19 GPUs →</Link>
        </div>
      </header>
      <p className="battle-method-note">
        Ranking de <strong>estimativas experimentais</strong>, não de medições
        dos PCs. A média usa 10 jogos fixos; a ficha mostra 12. Custo-benefício
        exige cotação PIX de todas as peças, sem frete. Datas e fontes ficam
        públicas. Não usamos votos ou FPS enviados pelo participante.
      </p>
      <div className="community-controls">
        <div
          className="battle-resolution"
          role="group"
          aria-label="Visualização da comunidade"
        >
          {["ranking", "galeria"].map((v) => (
            <button
              key={v}
              aria-pressed={view === v}
              onClick={() => filter("ver", v)}
            >
              {v === "ranking" ? "Classificação" : "Galeria de PCs"}
            </button>
          ))}
        </div>
        <div
          className="battle-resolution"
          role="group"
          aria-label="Resolução do ranking"
        >
          {["1080p", "1440p"].map((r) => (
            <button
              key={r}
              aria-pressed={resolution === r}
              onClick={() => filter("res", r)}
            >
              {r}
            </button>
          ))}
        </div>
        {view === "ranking" && (
          <label className="field-label">
            Ordenar por
            <select
              value={sort}
              onChange={(e) => filter("ordem", e.target.value)}
            >
              <option value="performance">Maior FPS estimado</option>
              <option value="value">Mais FPS por real</option>
            </select>
          </label>
        )}
      </div>
      {loading ? (
        <p role="status">Consultando a comunidade...</p>
      ) : error ? (
        <div className="form-error" role="alert">
          {error}
          <button
            className="text-button"
            onClick={() => setAttempt((n) => n + 1)}
          >
            Tentar novamente
          </button>
        </div>
      ) : !rows.length ? (
        <div className="community-empty">
          <Monitor size={38} />
          <h2>
            {view === "ranking"
              ? "A primeira posição pode ser sua."
              : "A comunidade começa na sua bancada."}
          </h2>
          <p>
            {sort === "value"
              ? "Ainda não há publicações com FPS cobertos e cotação completa nesta categoria."
              : "Nenhum PC foi publicado nesta categoria. Montagens privadas não aparecem automaticamente."}
          </p>
          <Link className="primary-button" to="/minhas-montagens">
            Escolher uma montagem para publicar
          </Link>
          {view === "ranking" && (
            <button
              className="text-button"
              onClick={() => filter("ver", "galeria")}
            >
              Ver também os projetos sem classificação
            </button>
          )}
        </div>
      ) : view === "ranking" ? (
        <div
          className="leaderboard"
          role="list"
          aria-label="Classificação de PCs"
        >
          {rows.map((row, i) => (
            <article
              key={row.id}
              role="listitem"
              className={
                i === 0 ? "leaderboard-row is-first" : "leaderboard-row"
              }
            >
              <span className="ranking-position">
                {i === 0 ? (
                  <Trophy size={25} />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              <img src={row.image} alt="" width={96} height={96} />
              <div className="ranking-build">
                <span>{row.nickname}</span>
                <h2>
                  <Link to={`/ranking/${row.id}`}>{row.title}</Link>
                </h2>
                <p>
                  {row.configuration.cpu}
                  <br />
                  {row.configuration.gpu}
                </p>
              </div>
              <div className="ranking-result">
                <strong>{fpsLabel(row.averageFps)}</strong>
                <small>Média estimada · {row.gameCount} jogos</small>
                {sort === "value" && (
                  <b>{(row.valueScore * 1000).toFixed(1)} FPS / R$ 1.000</b>
                )}
              </div>
              <div className="ranking-cost">
                <strong>
                  {row.priceCents
                    ? money(row.priceCents)
                    : "Cotação incompleta"}
                </strong>
                <small>
                  {row.quotedAt
                    ? `Consulta mais antiga: ${consultationDate(row.quotedAt)}`
                    : "Sem cotação completa"}
                </small>
                <Link to={`/ranking/${row.id}`}>
                  Ver peças e resultados <ArrowUpRight size={15} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="community-gallery">
          {rows.map((row) => (
            <article key={row.id}>
              <img src={row.image} alt="" width={240} height={190} />
              <small>POR {row.nickname}</small>
              <h2>
                <Link to={`/ranking/${row.id}`}>{row.title}</Link>
              </h2>
              <p>
                {row.configuration.cpu}
                <br />
                {row.configuration.gpu}
              </p>
              <strong>
                {fpsLabel(row.performance[resolution].rankAverageFps)}
              </strong>
              <span>
                {row.priceCents ? money(row.priceCents) : "Cotação incompleta"}
              </span>
              <Link className="secondary-button" to={`/ranking/${row.id}`}>
                Explorar montagem <ArrowUpRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      )}
      <footer className="community-bottom">
        <Swords size={22} />
        <p>
          Abra um PC para conferir as peças e colocá-lo em combate com os
          modelos da vitrine.
        </p>
        <Link to="/combate">Conhecer o combate →</Link>
      </footer>
    </section>
  );
}
