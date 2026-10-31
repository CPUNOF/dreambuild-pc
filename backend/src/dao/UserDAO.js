import { createHash, randomUUID } from "node:crypto";
import { getDatabase } from "../config/firebaseConfig.js";
import { AppError } from "../errors/AppError.js";
const emailKey = (email) => createHash("sha256").update(email).digest("hex");

export class UserDAO {
  constructor(database = getDatabase) {
    this.database = database;
  }
  async getById(id) {
    const snapshot = await this.database().collection("users").doc(id).get();
    return snapshot.exists ? { ...snapshot.data(), id: snapshot.id } : null;
  }
  async findByEmail(email) {
    const index = await this.database()
      .collection("user_emails")
      .doc(emailKey(email))
      .get();
    return index.exists ? this.getById(index.data().userId) : null;
  }
  async create(data) {
    const database = this.database();
    const id = randomUUID();
    const index = database.collection("user_emails").doc(emailKey(data.email));
    const user = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      preferences: { defaultResolution: "1440p", rgbColor: "#f17b43" },
    };
    await database.runTransaction(async (transaction) => {
      if ((await transaction.get(index)).exists)
        throw new AppError(
          409,
          "Este e-mail já possui cadastro. Entre na sua conta.",
        );
      transaction.create(index, { userId: id });
      transaction.create(database.collection("users").doc(id), user);
    });
    return user;
  }
  async googleIdentity(identity, linkUserId = null) {
    const database = this.database(),
      index = database
        .collection("google_identities")
        .doc(emailKey(identity.uid)),
      emailIndex = database
        .collection("user_emails")
        .doc(emailKey(identity.email));
    return database.runTransaction(async (tx) => {
      const [linked, email] = await Promise.all([
        tx.get(index),
        tx.get(emailIndex),
      ]);
      if (linked.exists) {
        if (linkUserId && linked.data().userId !== linkUserId)
          throw new AppError(
            409,
            "Esta conta Google já está vinculada a outra conta.",
          );
        const user = await tx.get(
          database.collection("users").doc(linked.data().userId),
        );
        if (!user.exists) throw new AppError(401, "Vínculo Google inválido.");
        return { ...user.data(), id: user.id };
      }
      if (email.exists) {
        if (!linkUserId || email.data().userId !== linkUserId)
          throw new AppError(
            409,
            "Este e-mail já tem cadastro. Entre com sua senha e use Vincular Google em Minha conta.",
          );
        const ref = database.collection("users").doc(linkUserId),
          snap = await tx.get(ref);
        if (!snap.exists || snap.data().disabled)
          throw new AppError(403, "Conta indisponível.");
        const user = {
          ...snap.data(),
          id: linkUserId,
          googleUid: identity.uid,
        };
        tx.update(ref, { googleUid: identity.uid });
        tx.create(index, { userId: linkUserId });
        return user;
      }
      if (linkUserId)
        throw new AppError(409, "Não foi possível vincular este e-mail.");
      const id = randomUUID(),
        user = {
          id,
          name:
            identity.name.length >= 2 ? identity.name : "Cliente DreamBuild",
          email: identity.email,
          googleUid: identity.uid,
          role: "CLIENT",
          createdAt: new Date().toISOString(),
          preferences: { defaultResolution: "1080p" },
        };
      tx.create(emailIndex, { userId: id });
      tx.create(index, { userId: id });
      tx.create(database.collection("users").doc(id), user);
      return user;
    });
  }
}
