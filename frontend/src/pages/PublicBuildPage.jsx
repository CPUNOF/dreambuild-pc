import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { apiRequest } from "../api/client.js";
import { money, consultationDate } from "../data/offers.js";
import { categoryNames } from "../data/hardwareFields.js";
import { fpsLabel } from "./RankingPage.jsx";
import FpsStage from "../components/FpsStage.jsx";
import ShareBuildCard from "../components/ShareBuildCard.jsx";
import { publicBuildUrl } from "../data/publicLinks.js";
export default function PublicBuildPage() {
  const { id } = useParams(),
    [item, setItem] = useState(null),
    [error, setError] = useState(null),
    [attempt, setAttempt] = useState(0),
    [resolution, setResolution] = useState("1080p"),
    [selected, setSelected] = useState(""),
    [copied, setCopied] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    setItem(null);
    setError(null);
    apiRequest(`/community/builds/${id}`, { signal: c.signal })
      .then(setItem)
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [id, attempt]);
  if (error)
    return (
      <section className="records-page">
        <p className="form-error" role="alert">
          {error}
        </p>
        <button
          className="secondary-button"
          onClick={() => setAttempt((n) => n + 1)}
        >
          Tentar novamente
        </button>
        <Link to="/ranking">Voltar à comunidade</Link>
      </section>
    );
  if (!item)
    return (
      <p className="catalog-load-state" role="status">
        Abrindo PC público...
      </p>
    );
  const report = item.performance[resolution],
    game = report.games.find((g) => g.id === selected) || report.games[0];
  return (
    <section className="community-page">
      <Link className="section-link" to="/ranking">
        ← Voltar ao ranking
      </Link>
      <header className="public-build-heading">
        <img src={item.image} alt="" width={220} height={200} />
        <div>
          <p className="section-kicker">MONTADO POR {item.nickname}</p>
          <h1>{item.title}</h1>
          <p>
            Publicado em {consultationDate(item.publishedAt)} · {item.version}
          </p>
          <strong>
            {item.priceCents ? money(item.priceCents) : "Cotação incompleta"}
          </strong>
          <small>
            Snapshot de cotações PIX · frete não incluído · não é oferta de
            venda deste PC.
          </small>
          <div className="community-actions">
            <ShareBuildCard item={item} resolution={resolution} />
            <Link
              className="primary-button"
              to={`/combate?publico=${item.id}&a=public-${item.id}`}
            >
              Colocar em combate
            </Link>
            <button
              className="secondary-button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(publicBuildUrl(item.id));
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? "Link copiado!" : "Copiar link do PC"}
            </button>
            <Link
              className="secondary-button"
              to={`/montar?publicacao=${item.id}`}
            >
              Montar uma versão minha
            </Link>
          </div>
        </div>
      </header>
      <div className="public-build-score">
        <div>
          <small>MÉDIA ESTIMADA DO RANKING</small>
          <strong>{fpsLabel(report.rankAverageFps)}</strong>
          <span>
            {resolution} · {item.gameCount} jogos fixos
          </span>
        </div>
        <p>
          {report.rankEligible
            ? "Classificado na versão indicada. Valores experimentais calculados pelo servidor a partir das referências."
            : "Sem classificação: a base ainda não cobre esta CPU/GPU. A publicação permanece na galeria."}{" "}
          {!item.priceCents &&
            " Faltam cotações para classificar por custo-benefício."}
        </p>
        <div
          className="battle-resolution"
          role="group"
          aria-label="Resolução do PC público"
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
      </div>
      <h2 className="community-section-title">As peças deste projeto</h2>
      <div className="public-parts">
        {item.parts.map((p) => (
          <article key={p.id}>
            <img src={p.image} alt="" width={110} height={90} />
            <small>{categoryNames[p.category]}</small>
            <strong>
              {p.name} × {p.quantity ?? 1}
            </strong>
            <span>{p.model}</span>
          </article>
        ))}
      </div>
      <h2 className="community-section-title">O PC nos jogos</h2>
      <p className="battle-method-note">
        Estimativas do conjunto. A oscilação de FPS e os trailers são
        ilustrativos; não são capturas nem medições desta montagem.
      </p>
      <div className="battle-game-nav">
        {report.games.map((g) => (
          <button
            key={g.id}
            aria-pressed={g.id === game.id}
            onClick={() => setSelected(g.id)}
          >
            {g.name} · {fpsLabel(g.results[resolution])}
          </button>
        ))}
      </div>
      <h3>{game.name}</h3>
      <FpsStage game={game} resolution={resolution} />
      <details className="community-details">
        <summary>Metodologia, PC de teste e fontes</summary>
        {report.notes.map((note) => (
          <p key={note}>{note}</p>
        ))}
        <p>
          Bancada gráfica da fonte: {report.testSetup.cpu} ·{" "}
          {report.testSetup.ram}. {report.testSetup.notes}
        </p>
        <a href={report.source} target="_blank" rel="noreferrer">
          Análise da GPU ↗
        </a>{" "}
        ·{" "}
        <a href={report.cpuSource} target="_blank" rel="noreferrer">
          Índice de CPU ↗
        </a>
      </details>
      <details className="community-details">
        <summary>Cotações por peça e datas da consulta</summary>
        <p>
          Preços registrados na publicação. Podem mudar; não garantem estoque ou
          compra futura.
        </p>
        <ul>
          {item.quotes.map((q) => (
            <li key={q.componentId}>
              <strong>
                {item.parts.find((p) => p.id === q.componentId)?.name}
              </strong>{" "}
              ·{" "}
              {q.quantity > 1
                ? `${q.quantity} × ${money(q.unitPriceCents)} = `
                : ""}
              {money(q.priceCents)} · {q.store} ·{" "}
              {consultationDate(q.checkedAt)} ·{" "}
              <a href={q.sourceUrl} target="_blank" rel="noreferrer">
                Ver fonte ↗
              </a>
            </li>
          ))}
        </ul>
        {item.quotes.length < item.parts.length && (
          <p>
            Há peças sem cotação válida; nenhum preço foi preenchido por
            estimativa.
          </p>
        )}
      </details>
    </section>
  );
}
