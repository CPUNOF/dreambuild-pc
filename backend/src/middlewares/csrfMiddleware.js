import { timingSafeEqual } from "node:crypto";
import { AppError } from "../errors/AppError.js";

export function csrfProtection(req, _res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const token = req.get("X-CSRF-Token");
  const expected = req.session?.csrfToken;
  if (
    typeof token !== "string" ||
    typeof expected !== "string" ||
    token.length > 128 ||
    Buffer.byteLength(token) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  ) {
    return next(
      new AppError(403, "Atualize a sessão e tente novamente.", [
        { code: "CSRF_INVALID" },
      ]),
    );
  }
  next();
}
