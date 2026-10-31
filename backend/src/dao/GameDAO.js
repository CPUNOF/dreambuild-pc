import { FieldPath } from "firebase-admin/firestore";
import { getDatabase } from "../config/firebaseConfig.js";
import { AppError } from "../errors/AppError.js";
export class GameDAO {
  constructor(database = getDatabase) {
    this.database = database;
  }
  async getById(id) {
    const doc = await this.database()
      .collection("games_benchmark")
      .doc(id)
      .get();
    return doc.exists ? { ...doc.data(), id: doc.id } : null;
  }
  async list({ limit, cursor }) {
    let query = this.database()
      .collection("games_benchmark")
      .orderBy(FieldPath.documentId());
    if (cursor) query = query.startAfter(cursor);
    const result = await query.limit(limit + 1).get();
    const docs = result.docs.slice(0, limit);
    return {
      items: docs.map((doc) => ({ ...doc.data(), id: doc.id })),
      nextCursor: result.docs.length > limit ? docs.at(-1).id : null,
    };
  }
  async create(game) {
    try {
      await this.database()
        .collection("games_benchmark")
        .doc(game.id)
        .create(game);
    } catch (error) {
      if (error.code === 6) throw new AppError(409, "Cenário já cadastrado.");
      throw error;
    }
    return game;
  }
  async update(id, game) {
    try {
      await this.database().collection("games_benchmark").doc(id).update(game);
    } catch (error) {
      if (error.code === 5) throw new AppError(404, "Cenário não encontrado.");
      throw error;
    }
    return game;
  }
  async delete(id) {
    await this.database().collection("games_benchmark").doc(id).delete();
  }
}
