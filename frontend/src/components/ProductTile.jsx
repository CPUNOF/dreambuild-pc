import { Link } from "react-router";
import { CardPrice } from "./ProductPrice.jsx";
import AddToCartButton from "./AddToCartButton.jsx";
export default function ProductTile({ product }) {
  return (
    <article className="product-card">
      <Link
        className={`product-image product-image-${product.id}`}
        to={`/produto/${product.slug}`}
        aria-label={`Ver detalhes de ${product.name}`}
      >
        <img
          src={product.image}
          alt={product.name}
          width="480"
          height="360"
          loading="lazy"
        />
      </Link>
      <div className="product-card-body">
        <p className="product-category">{product.categoryName}</p>
        <p className="product-brand">{product.brand}</p>
        <h3>
          <Link to={`/produto/${product.slug}`}>{product.name}</Link>
        </h3>
        <CardPrice product={product} />
        <p className="catalog-model-code">{product.model}</p>
        <AddToCartButton product={product} compact />
        <Link
          className="product-details-button"
          to={`/produto/${product.slug}`}
        >
          Ver detalhes
        </Link>
      </div>
    </article>
  );
}
