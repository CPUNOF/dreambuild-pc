import { randomBytes } from "node:crypto";
import { promisify } from "node:util";
import { User } from "../models/User.js";
import { AppError } from "../errors/AppError.js";
import { ApiResponseView } from "../views/ApiResponseView.js";
import { cookieOptions, sessionCookieName } from "../config/sessionConfig.js";
import {
  verifyGoogleToken,
  googleWebConfiguration,
} from "../config/googleAuth.js";
const token = () => randomBytes(24).toString("hex");

export class AuthController {
  constructor(dao, onLogout = () => {}, googleVerifier = verifyGoogleToken) {
    this.dao = dao;
    this.onLogout = onLogout;
    this.googleVerifier = googleVerifier;
  }
  async session(req, res) {
    const user = req.session.userId
      ? await this.dao.getById(req.session.userId)
      : null;
    if (req.session.userId && (!user || user.disabled)) {
      this.onLogout(req.sessionID);
      delete req.session.userId;
      delete req.session.role;
    }
    if (!req.session.csrfToken) req.session.csrfToken = token();
    res.set("Cache-Control", "no-store");
    return ApiResponseView.send(res, {
      message: "Sessão consultada.",
      data: {
        user: user?.disabled ? null : User.public(user),
        csrfToken: req.session.csrfToken,
      },
    });
  }
  async establish(req, user) {
    const previousId = req.sessionID;
    const cart = req.session.cart;
    await promisify(req.session.regenerate).call(req.session);
    this.onLogout(previousId);
    req.session.userId = user.id;
    if (Array.isArray(cart)) req.session.cart = cart;
    req.session.role = user.role;
    req.session.csrfToken = token();
    await promisify(req.session.save).call(req.session);
    return { user: User.public(user), csrfToken: req.session.csrfToken };
  }
  async register(req, res) {
    const input = User.registration(req.body);
    const user = await this.dao.create({
      name: input.name,
      email: input.email,
      passwordHash: await User.hash(input.password),
      role: "CLIENT",
    });
    return ApiResponseView.send(res, {
      statusCode: 201,
      message: "Conta criada.",
      data: await this.establish(req, user),
    });
  }
  async login(req, res) {
    if (
      typeof req.body?.email !== "string" ||
      typeof req.body?.password !== "string" ||
      req.body.email.length > 254 ||
      req.body.password.length > 128 ||
      !req.body.password.length
    )
      throw new AppError(400, "Informe e-mail e senha.");
    const user = await this.dao.findByEmail(
      req.body.email.trim().toLowerCase(),
    );
    const matches = await User.verify(req.body.password, user?.passwordHash);
    if (!user || user.disabled || !matches)
      throw new AppError(401, "E-mail ou senha incorretos.");
    return ApiResponseView.send(res, {
      message: "Você entrou na sua conta.",
      data: await this.establish(req, user),
    });
  }
  async logout(req, res) {
    const id = req.sessionID;
    await promisify(req.session.destroy).call(req.session);
    this.onLogout(id);
    res.clearCookie(sessionCookieName, cookieOptions());
    return ApiResponseView.send(res, {
      message: "Sessão encerrada.",
      data: { user: null, csrfToken: null },
    });
  }
  providers(req, res) {
    return ApiResponseView.send(res, {
      message: "Provedores de autenticação.",
      data: { google: googleWebConfiguration() },
    });
  }
  async google(req, res) {
    const identity = await this.googleVerifier(req.body?.idToken);
    const user = await this.dao.googleIdentity(identity);
    if (user.disabled) throw new AppError(403, "Esta conta foi desativada.");
    return ApiResponseView.send(res, {
      message: "Você entrou com Google.",
      data: await this.establish(req, user),
    });
  }
  async linkGoogle(req, res) {
    const identity = await this.googleVerifier(req.body?.idToken);
    if (identity.email !== req.user.email)
      throw new AppError(
        409,
        "Para vincular, use o mesmo e-mail da conta em que você já entrou.",
      );
    const user = await this.dao.googleIdentity(identity, req.user.id);
    return ApiResponseView.send(res, {
      message: "Google vinculado à sua conta.",
      data: await this.establish(req, user),
    });
  }
}
