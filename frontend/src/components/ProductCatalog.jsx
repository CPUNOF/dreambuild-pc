import { useState, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";
import { departments } from "../data/products.js";
import ProductTile from "./ProductTile.jsx";
import { bestOffer } from "../data/offers.js";
const normalize = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export default function ProductCatalog({
  products,
  category,
  onCategoryChange,
  query,
  onClear,
}) {
  const [sort, setSort] = useState("featured");
  const [shown, setShown] = useState(24);
  const [availableOnly, setAvailableOnly] = useState(false);
  useEffect(() => setShown(24), [category, query, sort]);
  const filtered = products.filter(
    (product) =>
      (category === "all" || product.category === category) &&
      (!availableOnly || Boolean(bestOffer(product))) &&
      normalize(
        `${product.brand} ${product.name} ${product.fullName} ${product.categoryName} ${product.model} ${product.category === "gpu" ? (/geforce|rtx|gtx/i.test(product.fullName) ? "NVIDIA" : /radeon/i.test(product.fullName) ? "AMD" : "") : ""}`,
      ).includes(normalize(query.trim())),
  );
  if (sort === "name")
    filtered.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  else if (sort === "featured")
    filtered.sort(
      (a, b) => Number(Boolean(bestOffer(b))) - Number(Boolean(bestOffer(a))),
    );
  else
    filtered.sort((a, b) => {
      const x = bestOffer(a)?.priceCents,
        y = bestOffer(b)?.priceCents;
      if (x === undefined) return y === undefined ? 0 : 1;
      if (y === undefined) return -1;
      return (sort === "price-desc" ? -1 : 1) * (x - y);
    });
  return (
    <section
      id="produtos"
      className="catalog-section"
      aria-labelledby="products-title"
    >
      <div className="catalog-heading">
        <div>
          <p className="section-kicker">ENCONTRE SUA PRÓXIMA PEÇA</p>
          <h2 id="products-title">Explore o catálogo</h2>
          <p>Compare modelos, detalhes e disponibilidade antes de escolher.</p>
        </div>
        <label className="stock-filter">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(event) => {
              setAvailableOnly(event.target.checked);
              setShown(24);
            }}
          />{" "}
          Somente disponíveis para compra
        </label>
      </div>
      <div className="catalog-toolbar">
        <div
          className="product-filters"
          role="group"
          aria-label="Filtrar por departamento"
        >
          {departments.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={category === item.id}
              onClick={() => onCategoryChange(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>
        <label className="sort-control">
          <SlidersHorizontal size={15} aria-hidden="true" />
          <span className="sr-only">Ordenar produtos</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="featured">Em destaque</option>
            <option value="name">Nome: A–Z</option>
            <option value="price-asc">Menor preço no PIX</option>
            <option value="price-desc">Maior preço no PIX</option>
          </select>
        </label>
      </div>
      <p className="results-count" role="status">
        {filtered.length}{" "}
        {filtered.length === 1 ? "modelo encontrado" : "modelos encontrados"}
        {query.trim() && ` para “${query.trim()}”`}
      </p>
      {filtered.length > 0 ? (
        <div className="product-grid">
          {filtered.slice(0, shown).map((product) => (
            <ProductTile key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="catalog-empty">
          <h3>Nenhum modelo encontrado</h3>
          <p>Tente outra busca ou consulte todos os departamentos.</p>
          <button type="button" onClick={onClear}>
            Limpar filtros
          </button>
        </div>
      )}
      <p className="catalog-disclaimer">
        Ofertas serão exibidas com fonte, data de consulta e condições de
        pagamento.
      </p>
      {shown < filtered.length && (
        <div className="catalog-load-more">
          <button
            className="secondary-button"
            onClick={() => setShown((value) => value + 24)}
          >
            Mostrar mais produtos
          </button>
          <span>
            {Math.min(shown, filtered.length)} de {filtered.length} modelos
          </span>
        </div>
      )}
    </section>
  );
}
