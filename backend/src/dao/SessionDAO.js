import { getDatabase } from "../config/firebaseConfig.js";
const lifetime = 8 * 60 * 60 * 1000;

export class SessionDAO {
  constructor(database = getDatabase) {
    this.database = database;
  }
  async get(id) {
    const reference = this.database().collection("sessions").doc(id);
    const snapshot = await reference.get();
    if (!snapshot.exists) return null;
    const document = snapshot.data();
    if (document.revoked) return null;
    if (document.expiresAt <= Date.now()) {
      await reference.delete();
      return null;
    }
    return document.data;
  }
  async set(id, session) {
    const data = JSON.parse(JSON.stringify(session));
    const database = this.database(),
      reference = database.collection("sessions").doc(id);
    await database.runTransaction(async (transaction) => {
      const previous = await transaction.get(reference);
      if (previous.exists && previous.data().revoked) return;
      transaction.set(reference, {
        data,
        expiresAt: session.cookie?.expires
          ? new Date(session.cookie.expires).getTime()
          : Date.now() + lifetime,
      });
    });
  }
  async destroy(id) {
    // Uma gravação atrasada de carrinho não pode ressuscitar uma sessão após logout.
    await this.database()
      .collection("sessions")
      .doc(id)
      .set({ revoked: true, data: null, expiresAt: Date.now() + lifetime });
  }
  async touch(id, session) {
    await this.database()
      .collection("sessions")
      .doc(id)
      .update({
        expiresAt: session.cookie?.expires
          ? new Date(session.cookie.expires).getTime()
          : Date.now() + lifetime,
      });
  }
}
