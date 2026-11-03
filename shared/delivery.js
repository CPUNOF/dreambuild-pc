export const deliveryOptions = [
  {
    id: "economy",
    name: "Entrega econômica",
    days: "5 a 8 dias úteis",
    priceCents: 0,
  },
  {
    id: "express",
    name: "Entrega expressa",
    days: "2 a 3 dias úteis",
    priceCents: 2490,
  },
];
export const demoExpiry = (card) => {
  const date = new Date(card.validUntil);
  return `${String(date.getUTCMonth() + 1).padStart(2, "0")}/${String(date.getUTCFullYear()).slice(-2)}`;
};
