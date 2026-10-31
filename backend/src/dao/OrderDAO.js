import { createHash } from "node:crypto";
import { FieldPath } from "firebase-admin/firestore";
import { getDatabase } from "../config/firebaseConfig.js";
import { AppError } from "../errors/AppError.js";
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
      const data = { ...document, userId, createdAt: new Date().toISOString() };
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
