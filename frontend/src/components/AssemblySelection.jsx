import { Link } from "react-router";
import { Check, Plus, Package, ArrowLeftRight } from "lucide-react";
import { categoryNames } from "../data/hardwareFields.js";
import { bestOffer, money } from "../data/offers.js";
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
export default function AssemblySelection({
  products,
  partIds,
  payment,
  disabled,
  onPick,
  quantities = {},
  resources,
}) {
  return (
    <div className="assembly-grid">
      {categories.map((category, index) => {
        const selected = products.find(
            (product) => product.id === partIds[category],
          ),
          offer = selected ? bestOffer(selected, payment) : null;
        return (
          <article
            className={`assembly-tile ${selected ? "has-part" : ""}`}
            key={category}
          >
            <header>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{categoryNames[category]}</h3>
              {selected && <Check size={17} />}
            </header>
            <button
              className="assembly-photo"
              disabled={disabled}
              onClick={() => onPick(category)}
              aria-label={`Escolher ${categoryNames[category]}`}
            >
              {selected ? (
                <img
                  src={selected.image}
                  alt={selected.name}
                  width="220"
                  height="150"
                  draggable="false"
                />
              ) : (
                <span>
                  <Package size={32} />
                  <small>Encontre sua peça</small>
                </span>
              )}
            </button>
            <div className="assembly-tile-body">
              {partIds[category] && (
                <button
                  className="assembly-remove text-button"
                  onClick={() => onPick(category, "remove")}
                  aria-label={`Remover ${categoryNames[category]} da montagem`}
                  disabled={disabled}
                >
                  Remover peça
                </button>
              )}
              <p className="assembly-name">
                {selected?.name ||
                  (category === "cooler" && resources?.cooling.included
                    ? resources.cooling.name
                    : null) ||
                  `Escolha seu modelo de ${categoryNames[category].toLowerCase()}`}
              </p>
              {selected && (
                <small className="assembly-sku">{selected.model}</small>
              )}
              <strong className={offer ? "assembly-price" : "assembly-pending"}>
                {offer
                  ? money(offer.priceCents * (quantities[selected.id] ?? 1))
                  : selected
                    ? "Disponibilidade não confirmada"
                    : category === "cooler" && resources?.cooling.included
                      ? "Já acompanha o processador"
                      : "Ainda não selecionado"}
              </strong>
              {selected && ["ram", "storage"].includes(category) && (
                <small>
                  {quantities[selected.id] ?? 1} unidade(s) deste modelo ·
                  ajuste em Slots e unidades acima
                </small>
              )}
              {category === "cooler" &&
                !selected &&
                resources?.cooling.included && (
                  <p className="assembly-power-help">
                    {resources.cooling.name} incluído na CPU. Cooler separado
                    opcional.
                  </p>
                )}
              {category === "psu" && selected && (
                <small className="assembly-power-help">
                  {selected.hardware?.wattage
                    ? `${selected.hardware.wattage} W nominais · confirme a análise do conjunto`
                    : "Potência técnica ainda precisa ser conferida"}
                </small>
              )}
              <button
                className={selected ? "secondary-button" : "primary-button"}
                disabled={disabled}
                onClick={() => onPick(category)}
              >
                {selected ? (
                  <>
                    <ArrowLeftRight size={15} />
                    Trocar peça
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    {category === "cooler" && resources?.cooling.included
                      ? "Cooler extra (opcional)"
                      : "Escolher peça"}
                  </>
                )}
              </button>
              {selected && (
                <Link className="section-link" to={`/produto/${selected.slug}`}>
                  Ver ficha completa
                </Link>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
