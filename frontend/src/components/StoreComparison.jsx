import {
  money,
  storeNames,
  paymentNames,
  consultationDate,
} from "../data/offers.js";
export default function StoreComparison({ comparison }) {
  if (!comparison) return null;
  return (
    <section className="comparison-section" aria-labelledby="comparison-title">
      <div className="section-title-row">
        <div>
          <h2 id="comparison-title">Comparar nas lojas</h2>
          <p>
            Mesmas peças, pagamento em {paymentNames[comparison.paymentMethod]}.
            Frete não incluído.
          </p>
        </div>
      </div>
      <div className="comparison-options">
        <article>
          <p>Tudo em uma loja</p>
          <strong>
            {comparison.cheapestSingleStore
              ? money(comparison.cheapestSingleStore.totalCents)
              : "Cotação incompleta"}
          </strong>
          <span>
            {comparison.cheapestSingleStore
              ? storeNames[comparison.cheapestSingleStore.store]
              : "Nenhuma loja tem oferta elegível para todas as peças selecionadas."}
          </span>
        </article>
        <article>
          <p>Menor preço combinando lojas</p>
          <strong>
            {comparison.optimized.complete
              ? money(comparison.optimized.totalCents)
              : "Cotação incompleta"}
          </strong>
          <span>
            {comparison.optimized.complete
              ? "Soma das menores ofertas elegíveis, sem frete."
              : `${comparison.optimized.missingComponentIds.length} peça(s) sem oferta elegível.`}
          </span>
        </article>
      </div>
      <div
        className="comparison-scroll"
        tabIndex={0}
        role="region"
        aria-label="Tabela de preços por loja"
      >
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Produto</th>
              {Object.entries(storeNames).map(([key, name]) => (
                <th key={key}>{name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparison.items.map((item) => (
              <tr key={item.componentId}>
                <th scope="row">
                  {item.name}
                  <small>{item.model}</small>
                </th>
                {Object.keys(storeNames).map((store) => {
                  const offer = item.stores[store];
                  return (
                    <td key={store}>
                      {offer ? (
                        <>
                          <strong>{money(offer.priceCents)}</strong>
                          <small>{consultationDate(offer.checkedAt)}</small>
                          <a
                            href={offer.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Fonte
                          </a>
                        </>
                      ) : (
                        <span>Sem oferta elegível</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="comparison-explanation">
        Uma oferta só entra na conta quando tem preço positivo, disponibilidade
        registrada e a forma de pagamento selecionada. Valores ausentes não são
        tratados como zero. Condições e disponibilidade podem mudar após a
        consulta.
      </p>
    </section>
  );
}
