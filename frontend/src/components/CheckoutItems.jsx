import { money } from "../data/offers.js";
export default function CheckoutItems({ items }) {
  return (
    <div className="checkout-line-items">
      {items.map((item) => (
        <article key={item.componentId}>
          <img src={item.component?.image} alt="" width="64" height="64" />
          <div>
            <strong>{item.component?.name || "Produto removido"}</strong>
            <small>{item.quantity} unidade(s)</small>
          </div>
          <b>
            {item.lineTotalCents == null
              ? "Indisponível"
              : money(item.lineTotalCents)}
          </b>
        </article>
      ))}
    </div>
  );
}
