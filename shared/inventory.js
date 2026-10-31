export function inventoryState(value) {
  const validPrice =
    Number.isSafeInteger(value?.unitPriceCents) && value.unitPriceCents > 0;
  const validQuantity =
    Number.isSafeInteger(value?.quantity) && value.quantity >= 0;
  return {
    configured: validPrice && validQuantity,
    quantity: validQuantity ? value.quantity : 0,
    unitPriceCents: validPrice ? value.unitPriceCents : null,
    updatedAt: typeof value?.updatedAt === "string" ? value.updatedAt : null,
  };
}

export function inventoryQuote(lines, parts) {
  const byId = new Map(parts.filter(Boolean).map((p) => [p.id, p]));
  const items = lines.map((line) => {
    const component = byId.get(line.componentId) || null;
    const stock = inventoryState(component?.inventory);
    const reason = !component
      ? "missing"
      : !stock.configured
        ? "unconfigured"
        : stock.quantity < line.quantity
          ? "insufficient"
          : null;
    return {
      ...line,
      component,
      stockQuantity: stock.quantity,
      unavailable: Boolean(reason),
      unavailableReason: reason,
      unitPriceCents: stock.unitPriceCents,
      lineTotalCents:
        stock.unitPriceCents === null
          ? null
          : stock.unitPriceCents * line.quantity,
    };
  });
  const knownSubtotalCents = items.reduce(
    (sum, item) => sum + (item.lineTotalCents || 0),
    0,
  );
  return {
    items,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    knownSubtotalCents,
    totalCents: items.some((item) => item.unavailable)
      ? null
      : knownSubtotalCents,
    hasMissingProducts: items.some((item) => !item.component),
    hasUnavailableProducts: items.some((item) => item.unavailable),
  };
}

export function saleOffer(product) {
  const stock = inventoryState(product?.inventory);
  return stock.configured && stock.quantity > 0
    ? { priceCents: stock.unitPriceCents, quantity: stock.quantity }
    : null;
}
