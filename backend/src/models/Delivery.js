import { randomUUID } from "node:crypto";
import { AppError } from "../errors/AppError.js";
import { deliveryOptions } from "../../../shared/delivery.js";
const states = new Set(
  "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(
    " ",
  ),
);
export class Delivery {
  static address(input) {
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new AppError(400, "Informe o endereço de demonstração.");
    const result = {};
    for (const [key, min, max] of [
      ["label", 2, 30],
      ["recipient", 2, 80],
      ["street", 2, 100],
      ["number", 1, 12],
      ["complement", 0, 80],
      ["district", 2, 60],
      ["city", 2, 60],
    ]) {
      const value = typeof input[key] === "string" ? input[key].trim() : "";
      if (
        value.length < min ||
        value.length > max ||
        /[\u0000-\u001f]/.test(value)
      )
        throw new AppError(
          400,
          `Confira o campo ${{ label: "nome do endereço", recipient: "destinatário", street: "rua", number: "número", complement: "complemento", district: "bairro", city: "cidade" }[key]} do endereço.`,
        );
      result[key] = value;
    }
    result.postalCode =
      typeof input.postalCode === "string"
        ? input.postalCode.trim().replace(/-/g, "")
        : "";
    result.state =
      typeof input.state === "string" ? input.state.toUpperCase().trim() : "";
    if (!/^\d{8}$/.test(result.postalCode) || !states.has(result.state))
      throw new AppError(400, "Informe CEP com oito números e uma UF válida.");
    return result;
  }
  static checkout(input) {
    if (input === undefined) return null; // Compatibilidade com pedidos anteriores.
    const option = deliveryOptions.find((item) => item.id === input?.method);
    if (!option)
      throw new AppError(400, "Escolha uma modalidade de entrega simulada.");
    return {
      address: this.address(input.address),
      method: option.id,
      name: option.name,
      days: option.days,
      priceCents: option.priceCents,
      simulated: true,
    };
  }
  static updateBook(book = [], operation) {
    let result = structuredClone(book);
    const index = result.findIndex((item) => item.id === operation.id);
    if (operation.type !== "create" && index < 0)
      throw new AppError(404, "Endereço não encontrado nesta conta.");
    if (operation.type === "delete") result.splice(index, 1);
    else if (operation.type === "default")
      result = result.map((item) => ({
        ...item,
        isDefault: item.id === operation.id,
      }));
    else {
      const address = this.address(operation.address);
      if (operation.type === "create") {
        if (result.length >= 5)
          throw new AppError(400, "Você pode salvar até cinco endereços.");
        result.push({
          ...address,
          id: randomUUID(),
          isDefault: !result.length,
        });
      } else result[index] = { ...result[index], ...address };
    }
    if (result.length && !result.some((item) => item.isDefault))
      result[0].isDefault = true;
    return result;
  }
}
