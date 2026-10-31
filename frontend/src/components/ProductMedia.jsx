import ProductGallery from "./ProductGallery.jsx";
export default function ProductMedia({ product }) {
  return (
    <div className="product-media">
      <ProductGallery product={product} />
    </div>
  );
}
