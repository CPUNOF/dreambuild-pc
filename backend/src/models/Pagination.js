import { AppError } from "../errors/AppError.js";
export function pagination(query) {
  const { limit = "20", cursor } = query;
  if (
    typeof limit !== "string" ||
    !/^\d{1,3}$/.test(limit) ||
    Number(limit) < 1 ||
    Number(limit) > 100 ||
    (cursor !== undefined &&
      (typeof cursor !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(cursor)))
  )
    throw new AppError(400, "Limite ou cursor inválido.");
  return { limit: Number(limit), cursor };
}
