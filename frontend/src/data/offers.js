export const storeNames = {
  kabum: "KaBuM!",
  pichau: "Pichau",
  terabyte: "Terabyte",
};
export const paymentNames = {
  pix: "PIX",
  cash: "Boleto / à vista",
  card: "Cartão, valor total",
};
export const money = (cents) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
export const consultationDate = (value) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
export function bestOffer(product, payment = "pix") {
  return (
    (product.offers || [])
      .filter(
        (offer) =>
          offer.paymentMethod === payment &&
          offer.availability === "in_stock" &&
          Number.isSafeInteger(offer.priceCents) &&
          offer.priceCents > 0,
      )
      .sort((a, b) => a.priceCents - b.priceCents)[0] || null
  );
}
export function availabilityLabel(product) {
  if (bestOffer(product)) return "Disponível na consulta";
  return product.offers?.some((offer) => offer.availability === "out_of_stock")
    ? "Sem estoque na consulta"
    : "Disponibilidade não confirmada";
}
