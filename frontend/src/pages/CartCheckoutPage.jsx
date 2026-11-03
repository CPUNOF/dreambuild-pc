import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  CreditCard,
  PackageCheck,
} from "lucide-react";
import { money } from "../data/offers.js";
import { deliveryOptions } from "../../../shared/delivery.js";
import AddressBook from "../components/AddressBook.jsx";
import DreamCardForm from "../components/DreamCardForm.jsx";
import CheckoutSummary from "../components/CheckoutSummary.jsx";
import CheckoutFinalReview from "../components/CheckoutFinalReview.jsx";
import useCheckoutReview from "../hooks/useCheckoutReview.js";
import "../checkout.css";
const steps = ["Entrega", "Pagamento", "Conferir pedido"];
export default function CartCheckoutPage({ buildId }) {
  const checkout = useCheckoutReview(buildId),
    { summary, busy, submitted, completedOrder, journey } = checkout;
  const [step, setStep] = useState(0),
    [address, setAddress] = useState(null),
    [method, setMethod] = useState("economy"),
    [accepted, setAccepted] = useState(false);
  const heading = useRef(null),
    firstRender = useRef(true);
  const delivery = deliveryOptions.find((option) => option.id === method),
    locked = busy || submitted;
  const total =
    summary?.totalCents == null
      ? null
      : summary.totalCents + delivery.priceCents;
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [step]);
  function go(next) {
    if (locked) return;
    setStep(next);
  }
  if (completedOrder)
    return (
      <section className="cart-checkout">
        <div className="empty-state order-finished">
          <PackageCheck size={48} />
          <h1>Seu pedido está confirmado.</h1>
          <p>O resumo, a entrega simulada e o recibo estão na sua conta.</p>
          <Link className="primary-button" to={`/pedidos/${completedOrder.id}`}>
            Acompanhar meu pedido
          </Link>
          <Link className="text-button" to="/#produtos">
            Continuar comprando
          </Link>
        </div>
        {journey.feedback}
      </section>
    );
  return (
    <section className="cart-checkout checkout-v2">
      <div className="page-heading">
        <div>
          <p>SEU PRÓXIMO UPGRADE</p>
          <h1>Vamos preparar seu pedido.</h1>
          <p>Experiência acadêmica: pagamento e entrega são simulados.</p>
        </div>
        <Link
          className="text-button"
          to={buildId ? `/montar?build=${buildId}` : "/carrinho"}
        >
          <ArrowLeft size={16} />
          Editar {buildId ? "montagem" : "carrinho"}
        </Link>
      </div>
      {checkout.error && (
        <p className="form-error" role="alert">
          {checkout.error}
        </p>
      )}
      {checkout.reviewing ? (
        <p role="status">Conferindo peças, preços e disponibilidade...</p>
      ) : !summary ? (
        <p role="alert">
          Não foi possível carregar a revisão. Volte ao carrinho e tente
          novamente.
        </p>
      ) : !summary.items.length ? (
        <div className="empty-state">
          <h2>Seu carrinho está vazio.</h2>
          <Link to="/#produtos" className="primary-button">
            Escolher produtos
          </Link>
        </div>
      ) : (
        <>
          <nav className="review-stepper" aria-label="Etapas da revisão">
            {steps.map((label, index) => (
              <button
                type="button"
                key={label}
                aria-current={step === index ? "step" : undefined}
                disabled={
                  locked ||
                  (index >= 1 && !address) ||
                  (index === 2 && !checkout.validCard)
                }
                onClick={() => go(index)}
              >
                <span>{index < step ? <Check size={16} /> : index + 1}</span>
                {label}
              </button>
            ))}
          </nav>
          <div className="checkout-workspace">
            <div className="checkout-main-panel">
              <h2 ref={heading} tabIndex={-1}>
                {step === 0 ? (
                  <MapPin size={21} />
                ) : step === 1 ? (
                  <CreditCard size={21} />
                ) : (
                  <PackageCheck size={21} />
                )}{" "}
                {steps[step]}
              </h2>
              <div hidden={step !== 0}>
                <AddressBook
                  selected={address}
                  onChoose={setAddress}
                  disabled={locked}
                />
                <fieldset className="shipping-options" disabled={locked}>
                  <legend>Como seu upgrade chega até você?</legend>
                  {deliveryOptions.map((option) => (
                    <label
                      key={option.id}
                      className={method === option.id ? "is-selected" : ""}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        value={option.id}
                        checked={method === option.id}
                        onChange={() => setMethod(option.id)}
                      />
                      <span>
                        <strong>{option.name}</strong>
                        <small>{option.days} · prazo fictício</small>
                      </span>
                      <b>
                        {option.priceCents
                          ? money(option.priceCents)
                          : "Grátis"}
                      </b>
                    </label>
                  ))}
                </fieldset>
                <button
                  type="button"
                  className="primary-button checkout-next"
                  disabled={!address || locked}
                  onClick={() => go(1)}
                >
                  Continuar para pagamento <ArrowRight size={16} />
                </button>
              </div>
              <div hidden={step !== 1}>
                <DreamCardForm
                  card={checkout.card}
                  onGenerate={checkout.generate}
                  onValid={checkout.setValidCard}
                  disabled={locked}
                />
                <div className="checkout-actions">
                  <button
                    type="button"
                    className="text-button"
                    disabled={locked}
                    onClick={() => go(0)}
                  >
                    <ArrowLeft size={15} />
                    Voltar à entrega
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    disabled={!checkout.validCard || locked}
                    onClick={() => go(2)}
                  >
                    Revisar pedido <ArrowRight size={16} />
                  </button>
                </div>
              </div>
              {step === 2 && (
                <CheckoutFinalReview
                  {...{
                    address,
                    delivery,
                    locked,
                    go,
                    checkout,
                    buildId,
                    summary,
                    journey,
                    accepted,
                    busy,
                    submitted,
                    setAccepted,
                    method,
                  }}
                />
              )}
            </div>
            <CheckoutSummary
              summary={summary}
              delivery={delivery}
              total={total}
            />
          </div>
          <div className="checkout-mobile-total">
            <span>
              Total simulado
              <strong>{total == null ? "Indisponível" : money(total)}</strong>
            </span>
            <button
              type="button"
              className="text-button"
              onClick={() =>
                document
                  .querySelector(".checkout-order-summary")
                  ?.scrollIntoView({
                    block: "center",
                    behavior: matchMedia("(prefers-reduced-motion: reduce)")
                      .matches
                      ? "instant"
                      : "smooth",
                  })
              }
            >
              Ver resumo
            </button>
          </div>
        </>
      )}
      {journey.feedback}
    </section>
  );
}
