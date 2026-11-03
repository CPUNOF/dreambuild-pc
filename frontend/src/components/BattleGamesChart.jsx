import { useMemo, useState } from "react";
import { Search } from "lucide-react";
const fps = (n) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
export default function BattleGamesChart({
  common,
  resolution,
  selected,
  onSelect,
}) {
  const [query, setQuery] = useState(""),
    [order, setOrder] = useState("name");
  const rows = useMemo(() => {
    const term = query
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    return common
      .filter((p) =>
        p.a.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .includes(term),
      )
      .sort((x, y) =>
        order === "difference"
          ? Math.abs(y.a.results[resolution] - y.b.results[resolution]) -
            Math.abs(x.a.results[resolution] - x.b.results[resolution])
          : order === "a"
            ? y.a.results[resolution] - x.a.results[resolution]
            : order === "b"
              ? y.b.results[resolution] - x.b.results[resolution]
              : x.a.name.localeCompare(y.a.name, "pt-BR"),
      );
  }, [common, resolution, query, order]);
  const axisMax = Math.max(
    1,
    ...rows.flatMap((p) => [p.a.results[resolution], p.b.results[resolution]]),
  );
  return (
    <section
      className="battle-games-chart"
      aria-labelledby="battle-chart-title"
    >
      <header>
        <div>
          <p className="section-kicker">JOGO A JOGO</p>
          <h3 id="battle-chart-title">Veja a diferença em FPS.</h3>
          <p>
            {common.length} jogos com o mesmo preset e resolução. Resultados de
            fontes/estimativas cadastradas.
          </p>
        </div>
        <span className="battle-chart-legend">
          <i /> Lado A <i /> Lado B
        </span>
      </header>
      <div className="battle-chart-filters">
        <label>
          <Search size={16} />
          <input
            type="search"
            aria-label="Buscar jogo no gráfico"
            placeholder="Buscar jogo"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Ordenar por
          <select value={order} onChange={(e) => setOrder(e.target.value)}>
            <option value="name">Nome do jogo</option>
            <option value="difference">Maior diferença de FPS</option>
            <option value="a">Maior FPS do lado A</option>
            <option value="b">Maior FPS do lado B</option>
          </select>
        </label>
      </div>
      <div className="battle-chart-rows">
        {rows.map(({ a, b }) => {
          const av = a.results[resolution],
            bv = b.results[resolution],
            max = axisMax,
            min = Math.min(av, bv),
            percent =
              min > 0
                ? Math.round(((Math.max(av, bv) - min) / min) * 100)
                : null;
          return (
            <button
              type="button"
              className={`battle-chart-row ${selected === a.id ? "is-active" : ""}`}
              key={a.id}
              onClick={() => onSelect(a.id)}
              aria-pressed={selected === a.id}
            >
              <span className="battle-chart-game">
                <strong>{a.name}</strong>
                <small>
                  {resolution} · {a.preset}
                </small>
              </span>
              <span className="battle-chart-bars">
                <span className="chart-a">
                  <i style={{ width: `${(av / max) * 100}%` }} />
                  <b>A · {fps(av)} FPS</b>
                </span>
                <span className="chart-b">
                  <i style={{ width: `${(bv / max) * 100}%` }} />
                  <b>B · {fps(bv)} FPS</b>
                </span>
              </span>
              <span className="battle-chart-difference">
                {av === bv ? "Empate" : `${av > bv ? "A" : "B"} à frente`}
                <small>
                  {percent === null
                    ? "Sem diferença percentual"
                    : `${percent}% de diferença`}
                </small>
              </span>
            </button>
          );
        })}
      </div>
      {!rows.length && (
        <p className="shelf-empty" role="status">
          {common.length
            ? "Nenhum jogo corresponde à busca."
            : "Não há testes com jogo, preset e resolução em comum. Selecione outros competidores ou outra resolução."}
        </p>
      )}
      <p className="field-help">
        Selecione uma linha para abrir o jogo no painel de detalhes. Barras não
        representam execução do jogo no navegador.
      </p>
    </section>
  );
}
