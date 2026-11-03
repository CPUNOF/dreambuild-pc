import { Link } from "react-router";
import { Pencil, Check } from "lucide-react";
import { AddressText } from "./AddressBook.jsx";
import CheckoutItems from "./CheckoutItems.jsx";
export default function CheckoutFinalReview({
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
}) {
  return (
    <div className="checkout-final-review">
      <section>
        <header>
          <h3>Endereço de entrega</h3>
          <button
            type="button"
            disabled={locked}
            className="text-button"
            onClick={() => go(0)}
          >
            <Pencil size={14} />
            Editar
          </button>
        </header>
        {address && (
          <div className="address-copy">
            <div>
              <AddressText address={address} />
            </div>
          </div>
        )}
        <p>
          {delivery.name} · {delivery.days} · simulação
        </p>
      </section>
      <section>
        <header>
          <h3>Pagamento com DreamCard</h3>
          <button
            type="button"
            disabled={locked}
            className="text-button"
            onClick={() => go(1)}
          >
            <Pencil size={14} />
            Editar
          </button>
        </header>
        <p>
          0000 •••• •••• {checkout.card?.number.slice(-4)} ·{" "}
          {checkout.card?.holderName}
        </p>
        <small>Cartão de demonstração. Nenhuma cobrança.</small>
      </section>
      <section>
        <header>
          <h3>Suas peças</h3>
          <Link
            to={buildId ? `/montar?build=${buildId}` : "/carrinho"}
            className="text-button"
          >
            Editar produtos
          </Link>
        </header>
        <CheckoutItems items={summary.items} />
      </section>
      <button
        type="button"
        className="checkout-sound-toggle"
        aria-pressed={journey.sound}
        onClick={journey.toggleSound}
      >
        Som de confirmação: {journey.sound ? "ligado" : "desligado"}
      </button>
      <label className="simulation-consent">
        <input
          type="checkbox"
          checked={accepted}
          disabled={busy || submitted}
          onChange={(e) => setAccepted(e.target.checked)}
        />
        <span>
          Entendi que este pedido, o frete e o pagamento são simulados.
        </span>
      </label>
      <button
        type="button"
        className="primary-button checkout-confirm"
        disabled={
          busy ||
          !accepted ||
          !address ||
          !checkout.validCard ||
          summary.hasUnavailableProducts
        }
        onClick={() => checkout.confirm({ address, method })}
      >
        {busy
          ? "Conferindo seu pedido..."
          : submitted
            ? "Repetir mesma tentativa"
            : "Confirmar compra simulada"}
        <Check size={18} />
      </button>
    </div>
  );
}
