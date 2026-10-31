import { FieldPath } from "firebase-admin/firestore";
import { getDatabase } from "../config/firebaseConfig.js";
export class BuildDAO {
  constructor(database = getDatabase) {
    this.database = database;
  }
  async create(userId, document) {
    const ref = this.database().collection("builds").doc();
    const data = { ...document, userId, createdAt: new Date().toISOString() };
    await ref.create(data);
    return { id: ref.id, ...data };
  }
  async getById(id) {
    const doc = await this.database().collection("builds").doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }
  async listByUser(userId, { limit, cursor }) {
    let query = this.database()
      .collection("builds")
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
  async delete(id) {
    await this.database().collection("builds").doc(id).delete();
  }
}
