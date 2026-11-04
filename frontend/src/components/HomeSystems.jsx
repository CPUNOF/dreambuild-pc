import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowUpRight, Monitor, Laptop } from "lucide-react";
import { apiRequest } from "../api/client.js";
import { money, consultationDate } from "../data/offers.js";
let cached = null,
  pending = null,
  loadedAt = 0;
function systems() {
  if (cached && Date.now() - loadedAt < 300000) return Promise.resolve(cached);
  if (!pending)
    pending = apiRequest("/systems")
      .then((data) => {
        cached = data;
        loadedAt = Date.now();
        return data;
      })
      .finally(() => {
        pending = null;
      });
  return pending;
}
export default function HomeSystems() {
  const [items, setItems] = useState([]),
    [error, setError] = useState(null),
    [loading, setLoading] = useState(true),
    [retry, setRetry] = useState(0),
    [budget, setBudget] = useState("all"),
    [purpose, setPurpose] = useState("all");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    systems()
      .then((data) => {
        if (active) setItems(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  const shown = items.filter(
    (item) =>
      (budget === "all" || item.priceCents <= Number(budget)) &&
      (purpose === "all" ||
        (purpose === "portable" && item.type === "laptop") ||
        (purpose === "1440p" &&
          item.games.some((g) => g.results?.["1440p"] != null))),
  );
  return (
    <section
      className="home-systems"
      aria-labelledby="home-systems-title"
      data-reveal
    >
      <header className="home-section-heading">
        <div>
          <p>CONFIGURAÇÕES PARA COMPARAR</p>
          <h2 id="home-systems-title">Escolha seu próximo PC.</h2>
          <span>
            PCs prontos e notebooks gamers, com peças e referências de FPS para
            explorar.
          </span>
        </div>
        <Link className="text-button" to="/combate">
          Abrir combate <ArrowUpRight size={16} />
        </Link>
      </header>
      <div className="system-discovery-filters">
        <label>
          Seu orçamento
          <select value={budget} onChange={(e) => setBudget(e.target.value)}>
            <option value="all">Todos os valores</option>
            <option value="800000">Até R$ 8.000</option>
            <option value="1500000">Até R$ 15.000</option>
            <option value="3000000">Até R$ 30.000</option>
          </select>
        </label>
        <label>
          O que você procura?
          <select value={purpose} onChange={(e) => setPurpose(e.target.value)}>
            <option value="all">Todas as configurações</option>
            <option value="portable">Portabilidade · notebooks</option>
            <option value="1440p">Explorar jogos em 1440p</option>
          </select>
        </label>
        <Link className="secondary-button" to="/montar">
          Prefiro montar meu PC
        </Link>
      </div>
      {loading ? (
        <p role="status">Carregando configurações...</p>
      ) : error ? (
        <p className="field-help">
          Não foi possível carregar os PCs de referência.{" "}
          <button
            className="text-button"
            onClick={() => setRetry((n) => n + 1)}
          >
            Tentar novamente
          </button>
        </p>
      ) : shown.length ? (
        <div className="home-system-grid">
          {shown.map((item) => (
            <article key={item.id}>
              <Link
                className="home-system-photo"
                to={`/combate?a=${item.id}&res=${purpose === "1440p" ? "1440p" : "1080p"}`}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  width="400"
                  height="300"
                />
              </Link>
              <div className="home-system-info">
                <small>
                  {item.type === "laptop" ? (
                    <Laptop size={14} />
                  ) : (
                    <Monitor size={14} />
                  )}{" "}
                  {item.type === "laptop" ? "Notebook gamer" : "PC pronto"} ·
                  referência
                </small>
                <h3>{item.name}</h3>
                <p>
                  {item.cpu}
                  <br />
                  {item.gpu}
                  <br />
                  {item.ram} · {item.storage}
                </p>
                <strong>
                  {Number.isSafeInteger(item.priceCents)
                    ? money(item.priceCents)
                    : "Preço não informado"}
                </strong>
                <small>
                  {item.priceKind === "academic"
                    ? "Preço acadêmico simulado · "
                    : "Preço consultado "}
                  {item.priceCheckedAt
                    ? consultationDate(item.priceCheckedAt)
                    : "sem data"}
                  {item.priceKind === "academic"
                    ? ". Não é oferta de loja."
                    : ". Pode mudar na loja."}
                </small>
                <Link
                  className="secondary-button"
                  to={`/combate?a=${item.id}&res=${purpose === "1440p" ? "1440p" : "1080p"}`}
                >
                  Ver configuração e FPS <ArrowUpRight size={15} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>Nenhuma referência nesse filtro.</h3>
          <p>
            Amplie o orçamento ou monte uma configuração com as peças da loja.
          </p>
          <Link to="/montar" className="secondary-button">
            Montar meu PC
          </Link>
        </div>
      )}
      <p className="field-help">
        Configurações de referência de lojas e bancadas de teste. Valores
        simulados identificados. FPS com fontes e condições na página de
        combate; não são medições executadas neste site.
      </p>
    </section>
  );
}
