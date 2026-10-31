import { useState } from "react";
import { Link } from "react-router";
import {
  Wrench,
  Scan,
  Plus,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Package,
  Trash2,
  X,
} from "lucide-react";
import { categoryNames } from "../data/hardwareFields.js";
import { bestOffer, money, availabilityLabel } from "../data/offers.js";
const categories = [
  "cpu",
  "mobo",
  "ram",
  "gpu",
  "storage",
  "psu",
  "case",
  "cooler",
];
export default function BuildWorkbench({
  products,
  partIds,
  disabled,
  onPick,
  powerAnalysis,
  onRemove,
  quantities = {},
  resources,
}) {
  const [active, setActive] = useState(null);
  const previews = categories.map((category) =>
    products.find((p) => p.id === partIds[category]),
  );
  const index = categories.indexOf(active);
  const coveredCount =
    Object.values(partIds).filter(Boolean).length +
    (!partIds.cooler && resources?.cooling.included ? 1 : 0);
  const product = index < 0 ? null : previews[index],
    offer = product && bestOffer(product);
  function focus(category) {
    setActive(category);
  }
  function reset() {
    setActive(null);
  }
  return (
    <section
      className="build-workbench bench-stable"
      aria-labelledby="workbench-title"
    >
      <header className="bench-heading">
        <div>
          <Wrench size={22} />
          <div>
            <p className="section-kicker">ESPAÇO DE MONTAGEM</p>
            <h2 id="workbench-title">Sua bancada, peça por peça.</h2>
          </div>
        </div>
        <button className="secondary-button" onClick={reset}>
          <Scan size={16} />
          Visão geral
        </button>
      </header>
      <nav
        className="bench-step-navigation"
        aria-label="Navegar entre as peças"
      >
        <button
          onClick={(event) => focus(categories[index - 1], event)}
          disabled={index <= 0}
          aria-label="Peça anterior"
        >
          <ChevronLeft size={18} />
          Voltar
        </button>
        <span>
          {index < 0
            ? "Escolha onde começar"
            : `${String(index + 1).padStart(2, "0")} / 08 · ${categoryNames[active]}`}
        </span>
        <button
          onClick={(event) =>
            focus(categories[index < 0 ? 0 : index + 1], event)
          }
          disabled={index === categories.length - 1}
          aria-label="Próxima peça"
        >
          Avançar
          <ChevronRight size={18} />
        </button>
      </nav>
      <div
        className="bench-category-rail"
        role="group"
        aria-label="Ir direto a uma peça"
      >
        {categories.map((category, i) => (
          <button
            key={category}
            aria-pressed={active === category}
            onClick={(event) => focus(category, event)}
          >
            <span>{partIds[category] ? <Check size={12} /> : i + 1}</span>
            {categoryNames[category]}
          </button>
        ))}
      </div>
      <div className="bench-layout">
        <div className="bench-view-area">
          <div
            className="bench-viewport"
            aria-label="Bancada visual com oito posições"
          >
            <div className="bench-scale-marker" aria-hidden="true">
              DREAMBUILD / WORKSPACE
              <br />
              <span>COMPONENTES EM EXPLORAÇÃO</span>
            </div>
            <div className="bench-surface">
              {categories.map((category, i) => (
                <div className="bench-slot-frame" key={category}>
                  <button
                    type="button"
                    disabled={disabled}
                    className={`bench-slot ${active === category ? "is-focused" : ""} ${partIds[category] ? "is-selected" : ""}`}
                    onClick={(event) => {
                      focus(category, event);
                      if (!partIds[category]) onPick(category);
                    }}
                    aria-label={`${partIds[category] ? "Editar" : "Escolher"} ${categoryNames[category]}`}
                    aria-pressed={active === category}
                  >
                    <span className="bench-slot-number">
                      {partIds[category] ? <Check size={11} /> : `0${i + 1}`}
                    </span>
                    <span className="bench-slot-photo">
                      {(previews[i] && (
                        <img
                          src={previews[i].image}
                          alt={previews[i].name}
                          width="200"
                          height="160"
                          draggable="false"
                        />
                      )) || <Package size={30} className="bench-empty-icon" />}
                    </span>
                    <strong>{categoryNames[category]}</strong>
                    <small>
                      {category === "cooler" &&
                      !partIds.cooler &&
                      resources?.cooling.included
                        ? "Incluído na CPU"
                        : category === "storage" && resources?.storage.total
                          ? `${resources.storage.total} unidade(s)`
                          : partIds[category]
                            ? quantities[partIds[category]] > 1
                              ? `${quantities[partIds[category]]} unidades`
                              : "Selecionado"
                            : "Explorar peças"}
                    </small>
                  </button>
                  {partIds[category] && (
                    <button
                      type="button"
                      className="bench-remove-x"
                      disabled={disabled}
                      aria-label={`Remover ${categoryNames[category]} da bancada`}
                      title={`Remover ${categoryNames[category]}`}
                      onClick={(event) => {
                        event.currentTarget.parentElement
                          .querySelector(".bench-slot")
                          ?.focus({ preventScroll: true });
                        setActive(category);
                        onRemove(category);
                      }}
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="bench-tools">
            <span>
              Selecione uma posição para editar a peça. O conjunto permanece
              fixo.
            </span>
            <b>{coveredCount} / 8 categorias atendidas</b>
          </div>
          <p className="bench-scale-note">
            Fotos reais de apresentação. Posições e tamanhos ilustrativos, sem
            escala física.
          </p>
        </div>
        <aside className="bench-inspector" aria-live="polite">
          {product ? (
            <>
              <p className="section-kicker">
                {categoryNames[active]} ·{" "}
                {partIds[active] ? "NA SUA MONTAGEM" : "PRÉVIA"}
              </p>
              <img
                className="bench-detail-photo"
                src={product.image}
                alt={product.name}
                width="240"
                height="160"
              />
              <h3>{product.name}</h3>
              <small className="bench-model">{product.model}</small>
              <button
                type="button"
                className="text-button bench-remove-part"
                disabled={disabled}
                onClick={() => onRemove(active)}
              >
                <Trash2 size={14} /> Remover {categoryNames[active]}
              </button>
              <button
                className="bench-open-picker secondary-button"
                disabled={disabled}
                onClick={() => onPick(active)}
              >
                {partIds[active] ? "Trocar modelo" : "Escolher modelo"}
                <ArrowUpRight size={16} />
              </button>
              <p className={`stock-status ${offer ? "in-stock" : "out-stock"}`}>
                {availabilityLabel(product)}
              </p>
              <strong className="bench-price">
                {offer ? money(offer.priceCents) : "Somente consulta"}
              </strong>
              <p className="bench-compatibility">{product.compatibilityNote}</p>
              {active === "psu" && (
                <p className="bench-psu-note">
                  {powerAnalysis?.recommendedPsuWatts
                    ? `Mínimo calculado para o conjunto: ${powerAnalysis.recommendedPsuWatts} W. Confira também conectores e dimensões.`
                    : "A fonte exige análise da CPU, GPU, conectores e gabinete. Watts sozinhos não confirmam compatibilidade."}
                </p>
              )}
              {!partIds[active] && (
                <button
                  className="primary-button"
                  disabled={disabled}
                  onClick={() => onPick(active)}
                >
                  Comparar modelos deste departamento <Plus size={16} />
                </button>
              )}
              <Link className="section-link" to={`/produto/${product.slug}`}>
                Abrir ficha completa <ArrowUpRight size={16} />
              </Link>
            </>
          ) : active ? (
            <>
              <span className="bench-overview-icon">
                <Package size={32} />
              </span>
              <p className="section-kicker">
                {categoryNames[active]} ·{" "}
                {active === "cooler" && resources?.cooling.included
                  ? "INCLUÍDO NA CPU"
                  : "POSIÇÃO VAZIA"}
              </p>
              <h3>
                {active === "cooler" && resources?.cooling.included
                  ? resources.cooling.name
                  : "Escolha sua peça."}
              </h3>
              <p>
                {active === "cooler" && resources?.cooling.included
                  ? "A versão escolhida do processador já inclui refrigeração. Um cooler separado é opcional; se escolher outro, ele precisa atender ao socket e ao gabinete."
                  : "Esta posição ainda não tem um modelo. Abra o catálogo deste departamento para comparar e selecionar."}
              </p>
              <button
                type="button"
                className="primary-button"
                disabled={disabled}
                onClick={() => onPick(active)}
              >
                Escolher {categoryNames[active]} <Plus size={16} />
              </button>
              {partIds[active] && (
                <button
                  className="text-button"
                  onClick={() => onRemove(active)}
                >
                  Remover seleção indisponível
                </button>
              )}
            </>
          ) : (
            <>
              <span className="bench-overview-icon">
                <Wrench size={32} />
              </span>
              <p className="section-kicker">O SEU PC COMEÇA AQUI</p>
              <h3>
                Explore.
                <br />
                Compare. Escolha.
              </h3>
              <p>
                Cada posição mostra os detalhes daquele departamento. Escolha um
                modelo e veja sua bancada tomar forma.
              </p>
              <div className="bench-count">
                <strong>
                  {coveredCount}
                  <small>/ 8</small>
                </strong>
                <span>
                  categorias
                  <br />
                  atendidas
                </span>
              </div>
              <button
                className="primary-button"
                disabled={disabled}
                onClick={() => {
                  focus("cpu");
                  onPick("cpu");
                }}
              >
                Começar pelo processador <ArrowUpRight size={17} />
              </button>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
