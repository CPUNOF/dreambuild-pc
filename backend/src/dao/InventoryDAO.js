import { createHash } from "node:crypto";
import { FieldPath } from "firebase-admin/firestore";
import { getDatabase } from "../config/firebaseConfig.js";
import { Inventory } from "../models/Inventory.js";
import { AppError } from "../errors/AppError.js";
export class InventoryDAO {
  constructor(database = getDatabase) {
    this.database = database;
  }
  async list({ limit, cursor }, privateView = false) {
    let query = this.database()
      .collection("inventory")
      .orderBy(FieldPath.documentId());
    if (cursor) query = query.startAfter(cursor);
    const page = await query.limit(limit + 1).get();
    const docs = page.docs.slice(0, limit);
    return {
      items: docs.map((doc) => Inventory.view(doc.id, doc.data(), privateView)),
      nextCursor: page.docs.length > limit ? docs.at(-1).id : null,
    };
  }
  async detail(id) {
    const ref = this.database().collection("inventory").doc(id);
    const [doc, history] = await Promise.all([
      ref.get(),
      ref.collection("movements").orderBy("createdAt", "desc").limit(20).get(),
    ]);
    return {
      inventory: Inventory.view(id, doc.exists ? doc.data() : null, true),
      movements: history.docs.map((d) => ({ id: d.id, ...d.data() })),
    };
  }
  async adjust(id, input, actor) {
    const data = Inventory.adjustment(input);
    const database = this.database(),
      ref = database.collection("inventory").doc(id);
    const movementId = createHash("sha256")
      .update(actor.id + ":" + data.idempotencyKey)
      .digest("hex");
    const movementRef = ref.collection("movements").doc(movementId);
    const requestHash = createHash("sha256")
      .update(JSON.stringify(data))
      .digest("hex");
    return database.runTransaction(async (tx) => {
      const [component, stock, previous] = await Promise.all([
        tx.get(database.collection("components").doc(id)),
        tx.get(ref),
        tx.get(movementRef),
      ]);
      if (!component.exists) throw new AppError(404, "Produto não encontrado.");
      const current = stock.exists ? stock.data() : null;
      if (previous.exists) {
        if (previous.data().requestHash !== requestHash)
          throw new AppError(
            409,
            "Esta tentativa já foi usada com outros dados.",
          );
        return {
          inventory: Inventory.view(id, current, true),
          movement: { id: previous.id, ...previous.data() },
          replayed: true,
        };
      }
      const next = Inventory.next(current, data);
      const movement = {
        type: data.type,
        quantity: Math.abs(next.quantity - (current?.quantity || 0)),
        delta: next.quantity - (current?.quantity || 0),
        before: current?.quantity || 0,
        after: next.quantity,
        previousPriceCents: current?.unitPriceCents ?? null,
        unitPriceCents: next.unitPriceCents,
        reason: data.reason,
        actorId: actor.id,
        actorName: actor.name,
        createdAt: next.updatedAt,
        requestHash,
      };
      tx.set(ref, next);
      tx.create(movementRef, movement);
      return {
        inventory: Inventory.view(id, next, true),
        movement: { id: movementId, ...movement },
        replayed: false,
      };
    });
  }
}
