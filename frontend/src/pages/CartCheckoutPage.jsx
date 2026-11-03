import { useRef, useState, useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, ShieldCheck, CreditCard, CheckCircle2 } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { apiRequest } from "../api/client.js";
import { money } from "../data/offers.js";
import { usePurchaseJourney } from "../components/PurchaseJourney.jsx";
import DreamCard from "../components/DreamCard.jsx";
export default function CartCheckoutPage() {
  const cart = useCart(),
    journey = usePurchaseJourney();
  const [card, setCard] = useState(null),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    [accepted, setAccepted] = useState(false),
    [submitted, setSubmitted] = useState(false);
  const key = useRef(crypto.randomUUID()),
    attempt = useRef(null);
  const [reviewing, setReviewing] = useState(true);
  const [completedOrder, setCompletedOrder] = useState(null);
  useEffect(() => {
    let active = true;
    cart
      .refresh()
      .catch((failure) => {
        if (active) setError(failure.message);
      })
      .finally(() => {
        if (active) setReviewing(false);
      });
    return () => {
      active = false;
    };
  }, []);
  async function generate() {
    setBusy(true);
    setError(null);
    try {
      setCard(await apiRequest("/orders/card", { method: "POST" }));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  async function confirm() {
    if (busy) return;
    setBusy(true);
    setSubmitted(true);
    setError(null);
    attempt.current ??= {
      items: cart.cart.items.map(({ componentId, quantity }) => ({
        componentId,
        quantity,
      })),
      idempotencyKey: key.current,
      quoteVersion: cart.cart.quoteVersion,
      card,
    };
    try {
      const completed = await journey.run(async () => {
        const order = await apiRequest("/orders/checkout-cart", {
          method: "POST",
          body: attempt.current,
        });
        cart.refresh().catch(() => {});
        return order;
      });
      if (completed) setCompletedOrder(completed);
    } catch (failure) {
      if (failure.status === 400) {
        setSubmitted(false);
        setCard(null);
        attempt.current = null;
        key.current = crypto.randomUUID();
      }
      setError(
        failure.message +
          " Se a conexão foi interrompida, consulte seus pedidos ou repita esta mesma tentativa.",
      );
    } finally {
      setBusy(false);
    }
  }
  const summary = cart.cart;
  if (completedOrder)
    return (
      <section className="cart-checkout">
        <div className="empty-state order-finished">
          <CheckCircle2 size={48} />
          <h1>Seu pedido foi confirmado.</h1>
          <p>O recibo e os detalhes estão guardados na sua conta.</p>
          <Link className="primary-button" to={`/pedidos/${completedOrder.id}`}>
            Ver meu pedido
          </Link>
          <Link className="text-button" to="/#produtos">
            Continuar comprando
          </Link>
        </div>
        {journey.feedback}
      </section>
    );
  return (
    <section className="cart-checkout">
      <nav className="checkout-steps" aria-label="Etapas do pedido">
        <Link to="/carrinho">01 Carrinho</Link>
        <strong>02 Revisão</strong>
        <span>03 Confirmação</span>
      </nav>
      <div className="page-heading">
        <div>
          <p>FALTA POUCO</p>
          <h1>Seu próximo upgrade está aqui.</h1>
          <p>Confira as peças e finalize sua compra simulada.</p>
        </div>
        <Link className="text-button" to="/carrinho">
          <ArrowLeft size={15} />
          Editar carrinho
        </Link>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!summary ? (
        <p role="status">Conferindo os itens...</p>
      ) : !summary.items.length && !submitted ? (
        <div className="empty-state">
          <h2>Seu carrinho está vazio.</h2>
          <Link className="primary-button" to="/#produtos">
            Escolher produtos
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="checkout-review cart-checkout-review">
            <ol
              className="purchase-checklist"
              aria-label="Preparação do pedido"
            >
              <li className={!summary.hasUnavailableProducts ? "is-ready" : ""}>
                <span>1</span>
                <div>
                  <strong>Confira suas peças</strong>
                  <small>{summary.itemCount} unidade(s) no pedido</small>
                </div>
              </li>
              <li className={card ? "is-ready" : ""}>
                <span>2</span>
                <div>
                  <strong>Prepare o DreamCard</strong>
                  <small>
                    {card
                      ? "Cartão fictício pronto"
                      : "Gere seu cartão no resumo ao lado"}
                  </small>
                </div>
              </li>
              <li className={accepted ? "is-ready" : ""}>
                <span>3</span>
                <div>
                  <strong>Confirme a simulação</strong>
                  <small>
                    {accepted
                      ? "Consentimento confirmado"
                      : "Revise e marque a confirmação"}
                  </small>
                </div>
              </li>
            </ol>
            <h2>Itens do seu pedido</h2>
            {summary.items.map((item) => (
              <article className="checkout-cart-line" key={item.componentId}>
                <img
                  src={item.component?.image}
                  alt=""
                  width="70"
                  height="60"
                />
                <div>
                  <strong>{item.component?.name || "Produto removido"}</strong>
                  <small>
                    {item.quantity} unidade(s) · {item.component?.model}
                  </small>
                </div>
                <span>
                  {item.lineTotalCents === null
                    ? "Em consulta"
                    : money(item.lineTotalCents)}
                </span>
              </article>
            ))}
            <div className="delivery-demo">
              <ShieldCheck size={23} />
              <div>
                <strong>Uma experiência completa, sem cobrança.</strong>
                <p>
                  Entrega e pagamento são simulados. Não informe endereço ou
                  cartão bancário real.
                </p>
              </div>
            </div>
          </div>
          <aside className="cart-summary">
            <h2>
              <CreditCard size={20} />
              Finalizar pedido
            </h2>
            <p className="field-help">
              Use um DreamCard fictício para esta demonstração.
            </p>
            {card ? (
              <DreamCard card={card} />
            ) : (
              <button
                className="secondary-button"
                disabled={busy || submitted}
                onClick={generate}
              >
                Gerar cartão fictício
              </button>
            )}
            <div className="cart-total">
              <span>Total simulado DreamBuild</span>
              <strong>
                {summary.totalCents === null
                  ? "Cotação parcial"
                  : money(summary.totalCents)}
              </strong>
            </div>
            {summary.totalCents === null && (
              <p className="cart-price-note">
                Há produtos indisponíveis. Volte ao carrinho para removê-los ou
                escolher outras peças.
              </p>
            )}
            <button
              className="checkout-sound-toggle"
              type="button"
              aria-pressed={journey.sound}
              onClick={journey.toggleSound}
            >
              Som de confirmação: {journey.sound ? "ligado" : "desligado"}
            </button>
            <label className="simulation-consent">
              <input
                type="checkbox"
                checked={accepted}
                disabled={busy}
                onChange={(event) => setAccepted(event.target.checked)}
              />
              <span>Entendi que esta compra é uma simulação acadêmica.</span>
            </label>
            <button
              className="primary-button"
              disabled={
                busy ||
                reviewing ||
                !card ||
                !accepted ||
                summary.hasUnavailableProducts
              }
              onClick={confirm}
            >
              {busy
                ? "Confirmando..."
                : submitted
                  ? "Repetir mesma tentativa"
                  : "Confirmar compra simulada"}
            </button>
            <p className="checkout-disclosure">
              Confirmação emitida pelo servidor. Nenhuma transação bancária.
            </p>
          </aside>
        </div>
      )}
      {journey.feedback}
    </section>
  );
}
