import { AppError } from "../errors/AppError.js";
import { User } from "../models/User.js";

export function requireAuth(userDAO) {
  return async (req, _res, next) => {
    try {
      if (!req.session?.userId)
        throw new AppError(401, "Entre na sua conta para continuar.");
      const user = await userDAO.getById(req.session.userId);
      if (!user || user.disabled)
        throw new AppError(401, "Sua sessão expirou. Entre novamente.");
      req.user = User.public(user);
      req.session.role = req.user.role;
      next();
    } catch (error) {
      next(error);
    }
  };
}
export function adminOnly(req, _res, next) {
  if (req.user?.role !== "ADMIN")
    return next(
      new AppError(403, "Acesso permitido somente a administradores."),
    );
  next();
}
