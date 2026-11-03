import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { Check, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { money } from "../data/offers.js";
import ComponentFacts from "./ComponentFacts.jsx";

export default function CartDrawer({
  open,
  onClose,
  cart,
  busy,
  error,
  notice,
  onUpdate,
}) {
  const dialog = useRef(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current.showModal();
    return () => {
      dialog.current?.close();
      document.body.style.overflow = previous;
    };
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className="cart-drawer"
      aria-labelledby="drawer-title"
      onCancel={onClose}
      onClick={(e) => {
        if (
          e.target === e.currentTarget &&
          e.clientX < e.currentTarget.getBoundingClientRect().left
        )
          onClose();
      }}
    >
      <header>
        <div>
          <p className="section-kicker">JÁ ESTÁ NO SEU CARRINHO</p>
          <h2 id="drawer-title">
            Seu próximo upgrade <small>({cart?.itemCount || 0})</small>
          </h2>
        </div>
        <button
          type="button"
          className="drawer-close"
          onClick={onClose}
          aria-label="Fechar carrinho lateral"
          autoFocus
        >
          <X size={22} />
        </button>
      </header>
      {notice && (
        <div className="cart-toast drawer-added" role="status">
          <Check size={18} />
          <span>
            <strong>Adicionado ao carrinho</strong>
            <small>{notice.name}</small>
          </span>
          <Link to="/carrinho" onClick={onClose}>
            Ver carrinho
          </Link>
        </div>
      )}
      <div className="drawer-items">
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {!cart?.items.length ? (
          <div className="drawer-empty">
            <ShoppingBag size={36} />
            <h3>Qual vai ser a primeira peça?</h3>
            <p>Explore a loja e monte seu próximo upgrade.</p>
          </div>
        ) : (
          cart.items.map((item) => (
            <article className="drawer-item" key={item.componentId}>
              <img src={item.component?.image} alt="" width={76} height={76} />
              <div>
                <Link
                  to={
                    item.component
                      ? `/produto/${item.component.slug}`
                      : "/carrinho"
                  }
                  onClick={onClose}
                >
                  <h3>{item.component?.name || "Produto removido"}</h3>
                </Link>
                {item.component && <ComponentFacts product={item.component} />}
                <strong>
                  {item.unavailable
                    ? "Revisar disponibilidade"
                    : money(item.lineTotalCents)}
                </strong>
                <small>
                  {item.unitPriceCents
                    ? `${money(item.unitPriceCents)} por unidade`
                    : "Preço pendente"}
                </small>
              </div>
              <div className="drawer-item-controls">
                <div
                  className="resource-quantity"
                  role="group"
                  aria-label={`Quantidade de ${item.component?.name}`}
                >
                  <button
                    type="button"
                    disabled={busy || item.quantity <= 1}
                    onClick={() =>
                      onUpdate(item.componentId, item.quantity - 1).catch(
                        () => {},
                      )
                    }
                    aria-label={`Diminuir ${item.component?.name}`}
                  >
                    <Minus size={14} />
                  </button>
                  <output>{item.quantity}</output>
                  <button
                    type="button"
                    disabled={
                      busy ||
                      item.quantity >= Math.min(10, item.stockQuantity ?? 10)
                    }
                    onClick={() =>
                      onUpdate(item.componentId, item.quantity + 1).catch(
                        () => {},
                      )
                    }
                    aria-label={`Aumentar ${item.component?.name}`}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  type="button"
                  className="drawer-remove"
                  disabled={busy}
                  onClick={() => onUpdate(item.componentId, 0).catch(() => {})}
                  aria-label={`Remover ${item.component?.name} do carrinho lateral`}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))
        )}
      </div>
      <footer>
        <div className="drawer-total">
          <span>Total simulado</span>
          <strong>
            {cart?.totalCents == null
              ? "Revisar itens"
              : money(cart.totalCents)}
          </strong>
        </div>
        <small>
          Compra acadêmica, sem cobrança. Saldo e preço são conferidos na
          confirmação.
        </small>
        <Link className="primary-button" to="/carrinho" onClick={onClose}>
          Ver carrinho e revisar
        </Link>
        <button type="button" className="secondary-button" onClick={onClose}>
          Continuar comprando
        </button>
      </footer>
    </dialog>
  );
}
