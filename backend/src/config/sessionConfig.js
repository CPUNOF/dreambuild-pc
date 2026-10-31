import session from "express-session";
import { randomBytes } from "node:crypto";
import { SessionDAO } from "../dao/SessionDAO.js";
const developmentSecret = randomBytes(48).toString("hex");
export const sessionCookieName = "dreambuild.sid";
export const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
});

export class FirestoreSessionStore extends session.Store {
  constructor(dao = new SessionDAO()) {
    super();
    this.dao = dao;
  }
  get(id, callback) {
    this.dao.get(id).then((value) => callback(null, value), callback);
  }
  set(id, value, callback = () => {}) {
    this.dao.set(id, value).then(() => callback(null), callback);
  }
  destroy(id, callback = () => {}) {
    this.dao.destroy(id).then(() => callback(null), callback);
  }
  touch(id, value, callback = () => {}) {
    // rolling:false mantém prazo fixo. Leituras não precisam regravar a mesma sessão.
    // Mudanças reais passam por set(), que persiste o prazo do cookie enviado.
    callback(null);
  }
}

export function createSessionConfig(
  store,
  secret = process.env.SESSION_SECRET,
) {
  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32))
    throw new Error("Configure um SESSION_SECRET seguro antes de publicar.");
  return {
    name: sessionCookieName,
    secret: secret || developmentSecret,
    store: store || new FirestoreSessionStore(),
    resave: false,
    saveUninitialized: false,
    rolling: false,
    cookie: { ...cookieOptions(), maxAge: 8 * 60 * 60 * 1000 },
  };
}
