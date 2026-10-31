import { AppError } from "../errors/AppError.js";
import { inventoryState } from "../../../shared/inventory.js";
export class Inventory {
  static adjustment(input) {
    const {
      type,
      quantity,
      unitPriceCents,
      reorderPoint,
      expectedVersion,
      reason,
      idempotencyKey,
    } = input || {};
    if (
      !["entry", "exit", "count", "settings"].includes(type) ||
      !Number.isSafeInteger(quantity) ||
      quantity < 0 ||
      quantity > 1000000 ||
      (["entry", "exit"].includes(type) && quantity < 1) ||
      (type === "settings" && quantity !== 0) ||
      !Number.isSafeInteger(unitPriceCents) ||
      unitPriceCents < 1 ||
      unitPriceCents > 1000000000 ||
      !Number.isSafeInteger(reorderPoint) ||
      reorderPoint < 0 ||
      reorderPoint > 1000000 ||
      !Number.isSafeInteger(expectedVersion) ||
      expectedVersion < 0 ||
      typeof reason !== "string" ||
      reason.trim().length < 3 ||
      reason.trim().length > 200 ||
      typeof idempotencyKey !== "string" ||
      !/^[a-zA-Z0-9_-]{16,128}$/.test(idempotencyKey)
    )
      throw new AppError(
        400,
        "Revise a quantidade, o preço, o limite de alerta e o motivo da movimentação.",
      );
    return {
      type,
      quantity,
      unitPriceCents,
      reorderPoint,
      expectedVersion,
      reason: reason.trim(),
      idempotencyKey,
    };
  }
  static view(componentId, data, privateView = false) {
    return {
      componentId,
      ...inventoryState(data),
      ...(privateView
        ? { version: data?.version || 0, reorderPoint: data?.reorderPoint ?? 3 }
        : {}),
    };
  }
  static next(current, input) {
    if ((current?.version || 0) !== input.expectedVersion)
      throw new AppError(
        409,
        "O estoque mudou enquanto você editava. Atualize os dados e revise a movimentação.",
      );
    const before = current?.quantity || 0;
    const quantity =
      input.type === "count"
        ? input.quantity
        : input.type === "entry"
          ? before + input.quantity
          : input.type === "exit"
            ? before - input.quantity
            : before;
    if (quantity < 0 || quantity > 1000000)
      throw new AppError(
        409,
        "A movimentação excede o saldo disponível ou o limite de estoque.",
      );
    return {
      quantity,
      unitPriceCents: input.unitPriceCents,
      reorderPoint: input.reorderPoint,
      version: (current?.version || 0) + 1,
      updatedAt: new Date().toISOString(),
    };
  }
}
