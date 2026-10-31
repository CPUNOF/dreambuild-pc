import { Offer, stores } from "./Offer.js";
export class Comparison {
  static calculate(parts, paymentMethod = "pix", quantities = {}) {
    const items = parts.map((part) => {
      const selected = {};
      for (const store of Object.keys(stores))
        selected[store] =
          (part.offers || [])
            .filter(
              (offer) =>
                offer.store === store && Offer.eligible(offer, paymentMethod),
            )
            .sort((a, b) => a.priceCents - b.priceCents)[0] || null;
      const quantity = quantities[part.id] ?? 1;
      if (quantities[part.id] !== undefined)
        for (const store of Object.keys(selected)) {
          const offer = selected[store];
          if (offer)
            selected[store] = {
              ...offer,
              unitPriceCents: offer.priceCents,
              quantity,
              priceCents: offer.priceCents * quantity,
            };
        }
      return {
        componentId: part.id,
        name: quantity > 1 ? `${part.name} × ${quantity}` : part.name,
        model: part.model,
        stores: selected,
      };
    });
    const singleStores = Object.keys(stores).map((store) => {
      const missingComponentIds = items
        .filter((item) => !item.stores[store])
        .map((item) => item.componentId);
      const knownSubtotalCents = items.reduce(
        (sum, item) => sum + (item.stores[store]?.priceCents || 0),
        0,
      );
      const complete = items.length > 0 && missingComponentIds.length === 0;
      return {
        store,
        complete,
        totalCents: complete ? knownSubtotalCents : null,
        knownSubtotalCents,
        missingComponentIds,
      };
    });
    const eligibleStores = singleStores
      .filter((store) => store.complete)
      .sort((a, b) => a.totalCents - b.totalCents);
    const choices = items.map((item) => ({
      componentId: item.componentId,
      name: item.name,
      offer:
        Object.values(item.stores)
          .filter(Boolean)
          .sort((a, b) => a.priceCents - b.priceCents)[0] || null,
    }));
    const missingComponentIds = choices
      .filter((choice) => !choice.offer)
      .map((choice) => choice.componentId);
    const knownSubtotalCents = choices.reduce(
      (sum, choice) => sum + (choice.offer?.priceCents || 0),
      0,
    );
    const complete = choices.length > 0 && missingComponentIds.length === 0;
    return {
      paymentMethod,
      currency: "BRL",
      shippingIncluded: false,
      items,
      singleStores,
      cheapestSingleStore: eligibleStores[0] || null,
      optimized: {
        complete,
        totalCents: complete ? knownSubtotalCents : null,
        knownSubtotalCents,
        choices,
        missingComponentIds,
      },
    };
  }
}
