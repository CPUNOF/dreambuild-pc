import {
  bestOffer,
  money,
  storeNames,
  consultationDate,
  paymentNames,
} from "../data/offers.js";
import { inventoryState } from "../../../shared/inventory.js";
export function CardPrice({ product }) {
  const stock = inventoryState(product.inventory);
  if (stock.configured)
    return (
      <div className="card-price">
        <small>DreamBuild · compra simulada</small>
        <strong>{money(stock.unitPriceCents)}</strong>
        <span>Preço próprio · sem cobrança real</span>
      </div>
    );
  const offer = bestOffer(product);
  return offer ? (
    <div className="card-price">
      <small>Referência externa a partir de</small>
      <strong>{money(offer.priceCents)}</strong>
      <span>no PIX · {storeNames[offer.store]}</span>
    </div>
  ) : (
    <p className="price-pending">
      {product.offers?.length
        ? "Sem oferta disponível no PIX"
        : "Preço ainda não cadastrado"}
    </p>
  );
}
export function ProductPriceSummary({ product }) {
  const offer = bestOffer(product);
  return offer ? (
    <>
      <strong className="actual-product-price">
        {money(offer.priceCents)}
      </strong>
      <p>
        no PIX em {storeNames[offer.store]}. Consulta em{" "}
        {consultationDate(offer.checkedAt)}. Frete não incluído.
      </p>
    </>
  ) : (
    <>
      <strong>
        {product.offers?.length
          ? "Sem oferta disponível no PIX"
          : "Preço ainda não cadastrado"}
      </strong>
      <p>
        {product.offers?.length
          ? "Confira abaixo as consultas registradas, suas condições e disponibilidade."
          : "Os preços serão exibidos após a consulta às lojas, com a data de atualização."}
      </p>
    </>
  );
}
export function StoreOffers({ product }) {
  return (
    <div className="store-offer-list">
      {Object.entries(storeNames).map(([key, name]) => {
        const offers = (product.offers || []).filter(
          (offer) => offer.store === key,
        );
        return (
          <div key={key}>
            <strong>{name}</strong>
            {offers.length ? (
              <ul className="store-offer-options">
                {offers.map((offer) => (
                  <li key={offer.paymentMethod}>
                    <strong>
                      {offer.priceCents === null
                        ? "Sem cotação"
                        : money(offer.priceCents)}
                    </strong>
                    <span>
                      {paymentNames[offer.paymentMethod]} ·{" "}
                      {offer.availability === "in_stock"
                        ? "Disponível na consulta"
                        : offer.availability === "out_of_stock"
                          ? "Sem estoque"
                          : "Disponibilidade não confirmada"}
                    </span>
                    <small>
                      Consulta: {consultationDate(offer.checkedAt)} · sem frete
                    </small>
                    <a href={offer.sourceUrl} target="_blank" rel="noreferrer">
                      Ver produto na loja
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <span>Sem oferta cadastrada</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
