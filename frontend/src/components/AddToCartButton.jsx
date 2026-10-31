import { ShoppingCart, PackageX } from "lucide-react";
import { bestOffer, availabilityLabel } from "../data/offers.js";
import { useCart } from "../context/CartContext.jsx";
export default function AddToCartButton({ product, compact = false }) {
  const cart = useCart();
  const available = Boolean(bestOffer(product));
  return (
    <>
      <span className={`stock-status ${available ? "in-stock" : "out-stock"}`}>
        {availabilityLabel(product)}
      </span>
      <button
        type="button"
        className={
          compact ? "cart-add-compact" : "primary-button cart-add-button"
        }
        disabled={cart.busy || !available}
        aria-label={`Adicionar ${product.name} ao carrinho`}
        onClick={() => cart.add(product).catch(() => {})}
      >
        {available ? (
          <ShoppingCart size={17} aria-hidden="true" />
        ) : (
          <PackageX size={17} aria-hidden="true" />
        )}
        {!available
          ? "Indisponível para compra"
          : cart.busy
            ? "Adicionando..."
            : "Adicionar ao carrinho"}
      </button>
    </>
  );
}
