import { Link } from "react-router";
import {
  ArrowUpRight,
  ShieldCheck,
  Package,
  Layers,
  ArrowRight,
} from "lucide-react";
import { bestOffer } from "../data/offers.js";
import { saleOffer } from "../../../shared/inventory.js";
import { categoryNames } from "../data/hardwareFields.js";
import ProductTile from "./ProductTile.jsx";
const categories = [
  "cpu",
  "gpu",
  "mobo",
  "ram",
  "storage",
  "psu",
  "case",
  "cooler",
];
export default function StoreSelections({ products, onCategoryChange }) {
  const available = products.filter((p) => saleOffer(p));
  const picks = categories
    .map((category) => available.find((p) => p.category === category))
    .filter(Boolean);
  const selection = [
    ...picks,
    ...available.filter((p) => !picks.includes(p)),
  ].slice(0, 8);
  return (
    <>
      <div className="store-promises" aria-label="Como funciona a loja">
        <span>
          <ShieldCheck size={23} />
          <span>
            <strong>Escolha com informação</strong>
            <small>Fonte e data em cada oferta</small>
          </span>
        </span>
        <span>
          <Package size={23} />
          <span>
            <strong>Uma peça ou seu próximo PC</strong>
            <small>Carrinho com quantidades e revisão</small>
          </span>
        </span>
        <span>
          <Layers size={23} />
          <span>
            <strong>Monte antes de comprar</strong>
            <small>Confira os critérios de compatibilidade</small>
          </span>
        </span>
      </div>
      {selection.length > 0 && (
        <section id="ofertas" className="store-offers-section" data-reveal>
          <div className="retail-section-heading">
            <div>
              <p className="section-kicker">SELEÇÃO DA VITRINE</p>
              <h2>Ofertas para o próximo upgrade</h2>
              <p>Preços cadastrados no PIX, com disponibilidade na consulta.</p>
            </div>
            <a href="#produtos" className="section-link">
              Explorar os {available.length} modelos disponíveis{" "}
              <ArrowUpRight size={19} />
            </a>
          </div>
          <div className="offer-shelf">
            {selection.map((product) => (
              <ProductTile key={product.id} product={product} />
            ))}
          </div>
          <p className="shelf-note">
            Valores de referência, sem frete. Veja a data e as condições na
            página de cada produto.
          </p>
        </section>
      )}
      <section
        className="department-explorer"
        data-reveal
        aria-labelledby="department-heading"
      >
        <div className="retail-section-heading">
          <div>
            <p className="section-kicker">DIRETO AO QUE VOCÊ PROCURA</p>
            <h2 id="department-heading">Cada peça tem seu lugar</h2>
          </div>
        </div>
        <div className="department-tiles">
          {categories.map((category) => {
            const product =
              available.find((p) => p.category === category) ||
              products.find((p) => p.category === category);
            return (
              product && (
                <button
                  key={category}
                  onClick={() => onCategoryChange(category)}
                >
                  <span className="department-photo">
                    <img
                      src={product.image}
                      alt=""
                      loading="lazy"
                      width="180"
                      height="150"
                    />
                  </span>
                  <strong>{categoryNames[category]}</strong>
                  <small>
                    {products.filter((p) => p.category === category).length}{" "}
                    modelos <ArrowUpRight size={13} />
                  </small>
                </button>
              )
            );
          })}
        </div>
      </section>
      <section className="workbench-invite" data-reveal>
        <div>
          <p className="section-kicker">DA IDEIA À MONTAGEM</p>
          <h2>
            Abra espaço para
            <br />o seu próximo PC.
          </h2>
          <p>
            Uma bancada para explorar as peças, aproximar os detalhes e conferir
            seu conjunto.
          </p>
          <Link className="primary-button" to="/montar">
            Abrir minha bancada <ArrowRight size={18} />
          </Link>
          <small>
            Fotos reais · oito categorias · análise de compatibilidade
          </small>
        </div>
        <div className="invite-parts" aria-hidden="true">
          {["gpu", "cpu", "ram"].map((category) => {
            const p =
              available.find((p) => p.category === category) ||
              products.find((p) => p.category === category);
            return (
              p && (
                <img
                  key={category}
                  src={p.image}
                  alt=""
                  loading="lazy"
                  width="260"
                  height="220"
                />
              )
            );
          })}
          <span>YOUR NEXT BUILD.</span>
        </div>
      </section>
    </>
  );
}
