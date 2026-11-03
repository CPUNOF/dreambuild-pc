import { createHash } from "node:crypto";
import { FieldPath } from "firebase-admin/firestore";
import { getDatabase } from "../config/firebaseConfig.js";
import { AppError } from "../errors/AppError.js";
import { inventoryState } from "../../../shared/inventory.js";
import { deliveryOptions } from "../../../shared/delivery.js";
const keyId = (userId, key) =>
  createHash("sha256")
    .update(userId + ":" + key)
    .digest("hex");
export class OrderDAO {
  constructor(database = getDatabase) {
    this.database = database;
  }
  async getById(id) {
    const doc = await this.database()
      .collection("simulated_orders")
      .doc(id)
      .get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }
  async replay(userId, key, requestHash) {
    const doc = await this.database()
      .collection("checkout_keys")
      .doc(keyId(userId, key))
      .get();
    if (!doc.exists) return null;
    if (doc.data().requestHash !== requestHash)
      throw new AppError(
        409,
        "Esta tentativa já foi usada com outros dados. Consulte seus pedidos.",
      );
    const order = await this.getById(doc.data().orderId);
    if (!order)
      throw new AppError(
        409,
        "Não foi possível recuperar a tentativa anterior. Consulte seus pedidos.",
      );
    return order;
  }
  async createIdempotent(userId, key, requestHash, document) {
    const database = this.database();
    const index = database.collection("checkout_keys").doc(keyId(userId, key));
    const reference = database.collection("simulated_orders").doc();
    return database.runTransaction(async (transaction) => {
      const existing = await transaction.get(index);
      if (existing.exists) {
        if (existing.data().requestHash !== requestHash)
          throw new AppError(
            409,
            "Esta tentativa já foi usada com outros dados.",
          );
        const order = await transaction.get(
          database.collection("simulated_orders").doc(existing.data().orderId),
        );
        if (!order.exists)
          throw new AppError(
            409,
            "A tentativa anterior não pode ser repetida.",
          );
        return { id: order.id, ...order.data() };
      }
      const lines = document.lines;
      if (
        !Array.isArray(lines) ||
        !lines.length ||
        lines.length > 40 ||
        new Set(lines.map((l) => l.componentId)).size !== lines.length ||
        lines.some(
          (l) =>
            !Number.isSafeInteger(l.quantity) ||
            l.quantity < 1 ||
            l.quantity > 1000 ||
            !Number.isSafeInteger(l.unitPriceCents) ||
            l.unitPriceCents < 1,
        ) ||
        !Number.isSafeInteger(document.totalCents) ||
        (document.delivery &&
          !deliveryOptions.some(
            (option) =>
              option.id === document.delivery.method &&
              option.priceCents === document.delivery.priceCents,
          )) ||
        document.totalCents !==
          lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0) +
            (document.delivery?.priceCents || 0)
      )
        throw new AppError(400, "Itens ou total do pedido inválidos.");
      const stockRefs = lines.map((l) =>
        database.collection("inventory").doc(l.componentId),
      );
      const stocks = await Promise.all(
        stockRefs.map((ref) => transaction.get(ref)),
      );
      const components = await Promise.all(
        lines.map((l) =>
          transaction.get(database.collection("components").doc(l.componentId)),
        ),
      );
      for (let i = 0; i < lines.length; i++) {
        const stock = inventoryState(
            stocks[i].exists ? stocks[i].data() : null,
          ),
          line = lines[i];
        if (
          !components[i].exists ||
          !stock.configured ||
          stock.quantity < line.quantity
        )
          throw new AppError(
            409,
            "O estoque mudou e não há saldo suficiente para concluir o pedido. Revise o carrinho ou a montagem.",
          );
        if (stock.unitPriceCents !== line.unitPriceCents)
          throw new AppError(
            409,
            "O preço da DreamBuild mudou durante a confirmação. Revise o pedido.",
          );
      }
      const data = {
        ...document,
        userId,
        stockCommitted: true,
        createdAt: new Date().toISOString(),
      };
      for (let i = 0; i < lines.length; i++) {
        const current = stocks[i].data(),
          line = lines[i],
          quantity = current.quantity - line.quantity;
        transaction.update(stockRefs[i], {
          quantity,
          version: (current.version || 0) + 1,
          updatedAt: data.createdAt,
        });
        transaction.create(
          stockRefs[i].collection("movements").doc("order_" + reference.id),
          {
            type: "sale",
            quantity: line.quantity,
            delta: -line.quantity,
            before: current.quantity,
            after: quantity,
            unitPriceCents: current.unitPriceCents,
            orderId: reference.id,
            actorId: userId,
            reason: "Compra acadêmica simulada aprovada",
            createdAt: data.createdAt,
          },
        );
      }
      transaction.create(reference, data);
      transaction.create(index, {
        userId,
        orderId: reference.id,
        requestHash,
        createdAt: data.createdAt,
      });
      return { id: reference.id, ...data };
    });
  }
  async listByUser(userId, { limit, cursor }) {
    let query = this.database()
      .collection("simulated_orders")
      .where("userId", "==", userId)
      .orderBy(FieldPath.documentId());
    if (cursor) query = query.startAfter(cursor);
    const result = await query.limit(limit + 1).get();
    const docs = result.docs.slice(0, limit);
    return {
      items: docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      nextCursor: result.docs.length > limit ? docs.at(-1).id : null,
    };
  }
}
