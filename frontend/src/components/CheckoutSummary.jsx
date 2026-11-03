import { ShieldCheck } from "lucide-react";
import { money } from "../data/offers.js";
import CheckoutItems from "./CheckoutItems.jsx";
export default function CheckoutSummary({ summary, delivery, total }) {
  return (
    <aside className="checkout-order-summary">
      <h2>
        Seu pedido <small>{summary.itemCount} unidade(s)</small>
      </h2>
      <details open className="checkout-summary-items">
        <summary>Ver produtos</summary>
        <CheckoutItems items={summary.items} />
      </details>
      <dl>
        <div>
          <dt>Subtotal das peças</dt>
          <dd>
            {summary.totalCents == null
              ? "Indisponível"
              : money(summary.totalCents)}
          </dd>
        </div>
        <div>
          <dt>Frete simulado</dt>
          <dd>{delivery.priceCents ? money(delivery.priceCents) : "Grátis"}</dd>
        </div>
        <div className="checkout-grand-total">
          <dt>Total simulado</dt>
          <dd>{total == null ? "Indisponível" : money(total)}</dd>
        </div>
      </dl>
      {summary.hasUnavailableProducts && (
        <p className="form-error" role="alert">
          Há peças indisponíveis ou pendências na montagem. Revise antes de
          comprar.
        </p>
      )}
      <p className="field-help">
        <ShieldCheck size={16} />
        Preço e estoque conferidos novamente ao confirmar. Nenhum pagamento ou
        envio real.
      </p>
    </aside>
  );
}
