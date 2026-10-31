import { AppError } from "../errors/AppError.js";
import { Comparison } from "./Comparison.js";
import { createHash } from "node:crypto";
export class Cart {
  static lines(input) {
    if (!Array.isArray(input) || input.length > 30)
      throw new AppError(400, "O carrinho aceita até 30 modelos diferentes.");
    const seen = new Set();
    return input
      .map((line) => {
        if (
          !line ||
          typeof line.componentId !== "string" ||
          !/^[-a-zA-Z0-9_]{1,128}$/.test(line.componentId) ||
          !Number.isInteger(line.quantity) ||
          line.quantity < 1 ||
          line.quantity > 10 ||
          seen.has(line.componentId)
        )
          throw new AppError(
            400,
            "Informe uma quantidade de 1 a 10 para cada produto, sem repetições.",
          );
        seen.add(line.componentId);
        return { componentId: line.componentId, quantity: line.quantity };
      })
      .sort((a, b) => a.componentId.localeCompare(b.componentId));
  }
  static summarize(lines, parts) {
    const quantities = Object.fromEntries(
      lines.map((line) => [line.componentId, line.quantity]),
    );
    const available = parts.filter(Boolean);
    const comparison = Comparison.calculate(available, "pix", quantities);
    const items = lines.map((line) => {
      const component = available.find((part) => part.id === line.componentId);
      const offer = comparison.optimized.choices.find(
        (choice) => choice.componentId === line.componentId,
      )?.offer;
      return {
        ...line,
        component: component || null,
        unavailable: !component || !offer,
        unitPriceCents: offer?.unitPriceCents ?? null,
        lineTotalCents: offer?.priceCents ?? null,
      };
    });
    return {
      items,
      quoteVersion: createHash("sha256")
        .update(
          JSON.stringify(
            items.map(
              ({ componentId, quantity, unitPriceCents, unavailable }) => ({
                componentId,
                quantity,
                unitPriceCents,
                unavailable,
              }),
            ),
          ),
        )
        .digest("hex"),
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      comparison,
      totalCents: items.some((item) => item.unavailable)
        ? null
        : comparison.optimized.totalCents,
      knownSubtotalCents: comparison.optimized.knownSubtotalCents,
      hasMissingProducts: items.some((item) => !item.component),
      hasUnavailableProducts: items.some((item) => item.unavailable),
    };
  }
}
