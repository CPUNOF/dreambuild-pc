import { AppError } from "../errors/AppError.js";
export const stores = {
  kabum: { name: "KaBuM!", host: "kabum.com.br" },
  pichau: { name: "Pichau", host: "pichau.com.br" },
  terabyte: { name: "Terabyte", host: "terabyteshop.com.br" },
};

export class Offer {
  static parseMany(input = []) {
    if (!Array.isArray(input) || input.length > 9)
      throw new AppError(400, "Informe no máximo nove ofertas por produto.");
    const keys = new Set();
    return input.map((offer) => {
      if (
        !offer ||
        !Object.hasOwn(stores, offer.store) ||
        !["pix", "cash", "card"].includes(offer.paymentMethod) ||
        !["in_stock", "out_of_stock", "unknown"].includes(offer.availability)
      )
        throw new AppError(
          400,
          "Loja, pagamento ou disponibilidade inválidos.",
        );
      const key = `${offer.store}:${offer.paymentMethod}`;
      if (keys.has(key))
        throw new AppError(
          400,
          "Há duas ofertas da mesma loja para a mesma forma de pagamento.",
        );
      keys.add(key);
      let url;
      try {
        url = new URL(offer.sourceUrl);
      } catch {
        throw new AppError(400, "Informe a URL do produto na loja.");
      }
      const host = stores[offer.store].host;
      if (
        url.protocol !== "https:" ||
        (url.hostname !== host && !url.hostname.endsWith(`.${host}`)) ||
        url.username ||
        url.password ||
        (url.port && url.port !== "443") ||
        url.href.length > 2000
      )
        throw new AppError(
          400,
          "A fonte precisa ser uma URL HTTPS da loja indicada.",
        );
      const time =
        typeof offer.checkedAt === "string" ? Date.parse(offer.checkedAt) : NaN;
      if (
        !Number.isFinite(time) ||
        time < Date.UTC(2000, 0, 1) ||
        time > Date.now() + 300000
      )
        throw new AppError(
          400,
          "Informe uma data de consulta válida, sem data futura.",
        );
      const price = offer.priceCents ?? null;
      if (
        (price !== null &&
          (!Number.isSafeInteger(price) || price < 1 || price > 1000000000)) ||
        (offer.availability === "in_stock" && price === null)
      )
        throw new AppError(
          400,
          "Informe um preço positivo em centavos para uma oferta disponível.",
        );
      return {
        store: offer.store,
        paymentMethod: offer.paymentMethod,
        availability: offer.availability,
        priceCents: price,
        sourceUrl: url.href,
        checkedAt: new Date(time).toISOString(),
      };
    });
  }
  static eligible(offer, paymentMethod = "pix") {
    return (
      offer?.availability === "in_stock" &&
      offer.paymentMethod === paymentMethod &&
      Number.isSafeInteger(offer.priceCents) &&
      offer.priceCents > 0
    );
  }
}
