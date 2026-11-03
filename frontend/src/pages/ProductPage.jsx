import { Link, useParams } from "react-router";
import { Check, FileText, Info, ArrowLeft } from "lucide-react";
import ProductMedia from "../components/ProductMedia.jsx";
import AddToCartButton from "../components/AddToCartButton.jsx";
import ComponentFacts from "../components/ComponentFacts.jsx";
import { inventoryState } from "../../../shared/inventory.js";
import { money } from "../data/offers.js";
import {
  ProductPriceSummary,
  StoreOffers,
  CardPrice,
} from "../components/ProductPrice.jsx";

export function NotFoundPage({ product = false }) {
  return (
    <section className="not-found-page">
      <p className="not-found-code">404</p>
      <h1>{product ? "Produto não encontrado" : "Página não encontrada"}</h1>
      <p>
        {product
          ? "Esse endereço não corresponde a um produto do catálogo."
          : "Confira o endereço ou volte para a loja."}
      </p>
      <Link to="/" className="primary-button">
        Voltar para a loja
      </Link>
    </section>
  );
}

export default function ProductPage({ products, onBrowseCategory }) {
  const { slug } = useParams();
  const product = products.find((item) => item.slug === slug);
  if (!product) return <NotFoundPage product />;

  return (
    <>
      <nav
        className="store-breadcrumb product-breadcrumb"
        aria-label="Caminho do produto"
      >
        <Link to="/">Início</Link>
        <span>/</span>
        <button
          type="button"
          onClick={() => onBrowseCategory(product.category)}
        >
          {product.categoryName}
        </button>
        <span>/</span>
        <span>{product.name}</span>
      </nav>
      <section className="product-overview" aria-labelledby="product-title">
        <div className="product-title-block">
          <p className="product-brand-label">{product.brand}</p>
          <h1 id="product-title">{product.fullName}</h1>
          <p className="product-model-code">Modelo: {product.model}</p>
          <ComponentFacts product={product} />
        </div>
        <ProductMedia key={product.id} product={product} />
        <aside className="product-summary" aria-label="Resumo do produto">
          <ul className="product-highlights">
            {product.highlights.map((highlight) => (
              <li key={highlight}>
                <Check size={16} aria-hidden="true" />
                {highlight}
              </li>
            ))}
          </ul>
          <Link
            className="add-to-builder secondary-button"
            to={`/montar?adicionar=${product.id}`}
          >
            Adicionar ao montador
          </Link>
          <div className="product-price-panel">
            <CardPrice product={product} />
            <AddToCartButton product={product} />
            <p className="product-price-title">Referências de outras lojas</p>
            <ProductPriceSummary product={product} />
            <a className="primary-button" href="#ficha-tecnica">
              <FileText size={17} aria-hidden="true" />
              Ver ficha técnica
            </a>
            <a className="product-offers-link" href="#ofertas">
              Consultar lojas
            </a>
          </div>
          <div className="product-compatibility-note">
            <Info size={18} aria-hidden="true" />
            <p>{product.compatibilityNote}</p>
          </div>
        </aside>
      </section>
      <nav className="product-section-nav" aria-label="Informações do produto">
        <a href="#descricao">Descrição</a>
        <a href="#ficha-tecnica">Ficha técnica</a>
        <a href="#ofertas">Ofertas nas lojas</a>
      </nav>
      <section
        id="descricao"
        className="product-info-section"
        aria-labelledby="description-title"
      >
        <h2 id="description-title">Sobre o produto</h2>
        <p>{product.description}</p>
      </section>
      <section
        id="ficha-tecnica"
        className="product-info-section"
        aria-labelledby="specifications-title"
      >
        <div className="product-info-heading">
          <h2 id="specifications-title">Ficha técnica</h2>
          <a href={product.manufacturerUrl} target="_blank" rel="noreferrer">
            {product.sourceLabel || "Site do fabricante"}
          </a>
        </div>
        <dl className="specification-table">
          {product.specifications.map(([name, value]) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <p className="specification-note">
          As características se referem ao código de produto indicado. Confira a
          compatibilidade do conjunto antes de montar.
        </p>
      </section>
      <section
        id="ofertas"
        className="product-info-section"
        aria-labelledby="offers-title"
      >
        <h2 id="offers-title">Ofertas nas lojas</h2>
        <p>
          Compare a mesma versão do produto. Valores registrados na data
          indicada; frete não incluído.
        </p>
        <StoreOffers product={product} />
      </section>
      <Link className="back-to-store" to="/#produtos">
        <ArrowLeft size={17} aria-hidden="true" />
        Voltar para os produtos
      </Link>
      <aside
        className="mobile-purchase-bar"
        aria-label="Compra rápida do produto"
      >
        <div>
          <small>Preço acadêmico</small>
          <strong>
            {inventoryState(product.inventory).configured
              ? money(product.inventory.unitPriceCents)
              : "Preço pendente"}
          </strong>
        </div>
        <AddToCartButton product={product} compact quick />
      </aside>
    </>
  );
}
