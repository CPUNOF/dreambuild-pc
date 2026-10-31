import { randomInt, createHmac, timingSafeEqual } from "node:crypto";
import { AppError } from "../errors/AppError.js";
export class DemoCard {
  static luhn(number) {
    if (typeof number !== "string" || !/^\d{16}$/.test(number)) return false;
    let sum = 0;
    for (let i = 0; i < number.length; i++) {
      let value = Number(number[number.length - 1 - i]);
      if (i % 2) {
        value *= 2;
        if (value > 9) value -= 9;
      }
      sum += value;
    }
    return sum % 10 === 0;
  }
  static signature(card, userId, secret) {
    return createHmac("sha256", secret)
      .update(
        JSON.stringify({
          userId,
          number: card.number,
          cvv: card.cvv,
          validUntil: card.validUntil,
        }),
      )
      .digest("hex");
  }
  static create(user, secret) {
    // Prefixo 000000: apenas demonstração, sem representar uma bandeira/emissor bancário.
    const base =
      "000000" + Array.from({ length: 9 }, () => randomInt(10)).join("");
    let number;
    for (let check = 0; check < 10; check++)
      if (this.luhn(base + check)) {
        number = base + check;
        break;
      }
    const card = {
      number,
      cvv: String(randomInt(1000)).padStart(3, "0"),
      holderName: user.name,
      validUntil: Date.now() + 10 * 60 * 1000,
      simulated: true,
    };
    return { ...card, token: this.signature(card, user.id, secret) };
  }
  static verify(card, userId, secret) {
    if (
      !card ||
      typeof card.number !== "string" ||
      !card.number.startsWith("000000") ||
      !this.luhn(card.number) ||
      typeof card.cvv !== "string" ||
      !/^\d{3}$/.test(card.cvv) ||
      !Number.isSafeInteger(card.validUntil) ||
      card.validUntil < Date.now() ||
      card.validUntil > Date.now() + 10 * 60 * 1000 + 5000 ||
      typeof card.token !== "string" ||
      !/^[a-f0-9]{64}$/.test(card.token)
    )
      throw new AppError(
        400,
        "Gere um cartão fictício válido para esta simulação. Não informe cartão bancário.",
      );
    const expected = this.signature(card, userId, secret);
    if (
      !timingSafeEqual(
        Buffer.from(card.token, "hex"),
        Buffer.from(expected, "hex"),
      )
    )
      throw new AppError(
        400,
        "O cartão fictício não pertence a esta conta ou foi alterado.",
      );
    return true;
  }
  static masked(number) {
    return "0000 **** **** " + number.slice(-4);
  }
}
