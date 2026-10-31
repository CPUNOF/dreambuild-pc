import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { AppError } from "../errors/AppError.js";
const derive = promisify(scrypt);

export class User {
  static registration(input) {
    const name = typeof input?.name === "string" ? input.name.trim() : "";
    const email =
      typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
    if (name.length < 2 || name.length > 80)
      throw new AppError(400, "Informe um nome entre 2 e 80 caracteres.");
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new AppError(400, "Informe um e-mail válido.");
    if (
      typeof input.password !== "string" ||
      input.password.length < 8 ||
      input.password.length > 128
    )
      throw new AppError(400, "Use uma senha entre 8 e 128 caracteres.");
    return { name, email, password: input.password };
  }
  static async hash(password) {
    const salt = randomBytes(16).toString("hex");
    const key = await derive(password, salt, 64);
    return `scrypt:${salt}:${key.toString("hex")}`;
  }
  static async verify(password, hash) {
    const [, salt, encoded] = typeof hash === "string" ? hash.split(":") : [];
    const validHash =
      /^[a-f0-9]{32}$/.test(salt || "") &&
      /^[a-f0-9]{128}$/.test(encoded || "");
    const key = await derive(
      password,
      validHash ? salt : "00000000000000000000000000000000",
      64,
    );
    const expected = Buffer.from(validHash ? encoded : "0".repeat(128), "hex");
    return timingSafeEqual(key, expected) && validHash;
  }
  static public(user) {
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferences: user.preferences || {},
      googleLinked: Boolean(user.googleUid),
    };
  }
}
