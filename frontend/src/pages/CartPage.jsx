import { Link } from "react-router";
import { useEffect } from "react";
import { ShoppingCart, Trash2, ArrowRight, Minus, Plus } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { money } from "../data/offers.js";
import ComponentFacts from "../components/ComponentFacts.jsx";
export default function CartPage() {
  const { cart, busy, error, update, refresh, clear } = useCart();
  useEffect(() => {
    refresh().catch(() => {});
  }, []);
  return (
    <section className="cart-page">
      <nav className="checkout-steps" aria-label="Etapas do pedido">
        <strong>01 Carrinho</strong>
        <span>02 Revisão</span>
        <span>03 Confirmação</span>
      </nav>
      <div className="page-heading">
        <div>
          <p>SEU PRÓXIMO UPGRADE</p>
          <h1>
            Meu carrinho <small>({cart?.itemCount || 0})</small>
          </h1>
          <p>Uma peça, um upgrade ou o PC inteiro. Você escolhe.</p>
        </div>
        <div className="cart-heading-actions">
          {!!cart?.items.length && (
            <button
              type="button"
              className="secondary-button"
              disabled={busy}
              onClick={() => clear().catch(() => {})}
            >
              <Trash2 size={16} />
              Limpar carrinho
            </button>
          )}
          <Link className="text-button" to="/#produtos">
            Continuar comprando
          </Link>
        </div>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
          <button
            className="text-button"
            onClick={() => refresh().catch(() => {})}
          >
            Tentar novamente
          </button>
        </p>
      )}
      {!cart ? (
        <p role="status">Abrindo seu carrinho...</p>
      ) : !cart.items.length ? (
        <div className="cart-empty">
          <ShoppingCart size={48} strokeWidth={1.2} />
          <h2>Seu próximo upgrade começa aqui.</h2>
          <p>Adicione uma peça da loja para começar.</p>
          <Link className="primary-button" to="/#produtos">
            Explorar produtos <ArrowRight size={17} />
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.items.map((item) => (
              <article className="cart-item" key={item.componentId}>
                <Link
                  to={item.component ? `/produto/${item.component.slug}` : "#"}
                >
                  <img
                    src={item.component?.image}
                    alt={item.component?.name || "Produto removido"}
                    width="130"
                    height="110"
                  />
                </Link>
                <div className="cart-item-info">
                  <span>{item.component?.brand}</span>
                  <h2>
                    {item.component ? (
                      <Link to={`/produto/${item.component.slug}`}>
                        {item.component.name}
                      </Link>
                    ) : (
                      "Produto removido do catálogo"
                    )}
                  </h2>
                  <p>{item.component?.model}</p>
                  {item.component && (
                    <ComponentFacts product={item.component} />
                  )}
                  {item.unavailable && (
                    <span className="stock-status out-stock">
                      Indisponível para compra. Remova este item para continuar.
                    </span>
                  )}
                  {item.unavailableReason === "insufficient" &&
                    item.stockQuantity > 0 && (
                      <button
                        className="text-button"
                        disabled={busy}
                        onClick={() =>
                          update(
                            item.componentId,
                            Math.min(10, item.stockQuantity),
                          ).catch(() => {})
                        }
                      >
                        Ajustar para {Math.min(10, item.stockQuantity)}{" "}
                        unidade(s) disponíveis
                      </button>
                    )}
                  <button
                    className="cart-remove"
                    disabled={busy}
                    onClick={() => update(item.componentId, 0).catch(() => {})}
                  >
                    <Trash2 size={14} />
                    Remover
                  </button>
                </div>
                <div className="cart-item-purchase">
                  <strong>
                    {item.lineTotalCents === null
                      ? "Preço em consulta"
                      : money(item.lineTotalCents)}
                  </strong>
                  {item.unitPriceCents !== null && (
                    <small>
                      {money(item.unitPriceCents)} / unidade · DreamBuild
                    </small>
                  )}
                  <div
                    className="quantity-control"
                    aria-label={`Quantidade de ${item.component?.name}`}
                  >
                    <button
                      disabled={busy || item.unavailable || item.quantity === 1}
                      aria-label={`Diminuir quantidade de ${item.component?.name}`}
                      onClick={() =>
                        update(item.componentId, item.quantity - 1).catch(
                          () => {},
                        )
                      }
                    >
                      <Minus size={14} />
                    </button>
                    <output aria-label="Quantidade">{item.quantity}</output>
                    <button
                      disabled={
                        busy ||
                        item.unavailable ||
                        item.quantity === 10 ||
                        item.quantity >= item.stockQuantity
                      }
                      aria-label={`Aumentar quantidade de ${item.component?.name}`}
                      onClick={() =>
                        update(item.componentId, item.quantity + 1).catch(
                          () => {},
                        )
                      }
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <aside className="cart-summary">
            <h2>Resumo do pedido</h2>
            <dl>
              <div>
                <dt>Produtos</dt>
                <dd>{cart.itemCount} unidade(s)</dd>
              </div>
              <div>
                <dt>Subtotal com preço confirmado</dt>
                <dd>{money(cart.knownSubtotalCents)}</dd>
              </div>
              <div>
                <dt>Entrega</dt>
                <dd>Simulada</dd>
              </div>
            </dl>
            <div className="cart-total">
              <span>Total DreamBuild simulado</span>
              <strong>
                {cart.totalCents === null
                  ? "Cotação parcial"
                  : money(cart.totalCents)}
              </strong>
              <small>Estoque próprio · nenhuma cobrança real</small>
            </div>
            {cart.totalCents === null && (
              <p className="cart-price-note">
                Há peças sem oferta disponível. Remova os itens indisponíveis
                antes de continuar.
              </p>
            )}
            <Link
              className={`primary-button ${cart.hasUnavailableProducts ? "is-disabled" : ""}`}
              aria-disabled={cart.hasUnavailableProducts}
              to={cart.hasUnavailableProducts ? "#" : "/checkout"}
              onClick={(event) => {
                if (cart.hasUnavailableProducts) event.preventDefault();
              }}
            >
              Continuar para revisão <ArrowRight size={17} />
            </Link>
            <p className="checkout-disclosure">
              Projeto acadêmico. Sem cobrança ou entrega real.
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}
