import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import { createCorsConfig } from "./config/corsConfig.js";
import { HealthController } from "./controllers/HealthController.js";
import { ApiResponseView } from "./views/ApiResponseView.js";
import { ComponentDAO } from "./dao/ComponentDAO.js";
import { ComponentController } from "./controllers/ComponentController.js";
import { AuthController } from "./controllers/AuthController.js";
import { UserDAO } from "./dao/UserDAO.js";
import { createSessionConfig } from "./config/sessionConfig.js";
import { csrfProtection } from "./middlewares/csrfMiddleware.js";
import { AppError } from "./errors/AppError.js";
import { AdminController } from "./controllers/AdminController.js";
import { requireAuth, adminOnly } from "./middlewares/authMiddleware.js";
import { BuildDAO } from "./dao/BuildDAO.js";
import { BuildController } from "./controllers/BuildController.js";
import { OrderDAO } from "./dao/OrderDAO.js";
import { OrderController } from "./controllers/OrderController.js";
import { EventEmitter } from "node:events";
import { GameDAO } from "./dao/GameDAO.js";
import { MetricsDAO } from "./dao/MetricsDAO.js";
import { GameController } from "./controllers/GameController.js";
import swaggerUi from "swagger-ui-express";
import { openapi } from "./config/openapi.js";
import { CartController } from "./controllers/CartController.js";
import { fileURLToPath } from "node:url";
import { ReferenceDAO } from "./dao/ReferenceDAO.js";
import { ReferenceController } from "./controllers/ReferenceController.js";
import { CommunityDAO } from "./dao/CommunityDAO.js";
import { CommunityController } from "./controllers/CommunityController.js";
import { InventoryDAO } from "./dao/InventoryDAO.js";
import { InventoryController } from "./controllers/InventoryController.js";
import { AddressController } from "./controllers/AddressController.js";

export function createApp({
  origins = process.env.FRONTEND_ORIGINS ||
    "http://localhost:5173,http://127.0.0.1:5173",
  componentDAO = new ComponentDAO(),
  userDAO = new UserDAO(),
  buildDAO = new BuildDAO(),
  orderDAO = new OrderDAO(),
  gameDAO = new GameDAO(),
  metricsDAO = new MetricsDAO(),
  referenceDAO = new ReferenceDAO(),
  communityDAO = new CommunityDAO(),
  inventoryDAO = new InventoryDAO(),
  sessionStore,
  sessionSecret,
  authLimit = 10,
} = {}) {
  const app = express();
  app.locals.events = new EventEmitter();
  app.locals.origins = new Set(
    origins
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
  app.locals.userDAO = userDAO;
  app.locals.buildDAO = buildDAO;
  app.locals.componentDAO = componentDAO;
  app.locals.gameDAO = gameDAO;
  app.disable("x-powered-by");
  if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
      contentSecurityPolicy: {
        directives: {
          "img-src": ["'self'", "data:", "https:"],
          "media-src": ["'self'", "blob:", "https://*.steamstatic.com"],
          "frame-src": ["'self'", "https://dreambuild-pc.firebaseapp.com"],
          "connect-src": [
            "'self'",
            "https://identitytoolkit.googleapis.com",
            "https://securetoken.googleapis.com",
            "https://dreambuild-pc.firebaseapp.com",
            "https://*.steamstatic.com",
          ],
          "upgrade-insecure-requests":
            process.env.NODE_ENV === "production" ? [] : null,
        },
      },
    }),
  );
  app.use(cors(createCorsConfig(origins)));
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.use(express.json({ limit: "100kb" }));
  if (process.env.SERVE_FRONTEND === "true") {
    const directory = fileURLToPath(
      new URL("../../frontend/dist/", import.meta.url),
    );
    app.use(
      express.static(directory, {
        index: false,
        dotfiles: "deny",
        maxAge: "1h",
      }),
    );
    app.get("/{*path}", (req, res, next) => {
      if (
        req.path === "/api" ||
        req.path.startsWith("/api/") ||
        req.path.startsWith("/api-docs") ||
        req.path === "/openapi.json" ||
        req.path.startsWith("/socket.io") ||
        /\.[a-zA-Z0-9]{1,8}$/.test(req.path) ||
        !req.accepts("html")
      )
        return next();
      res.set("Cache-Control", "no-cache");
      res.sendFile("index.html", { root: directory }, (error) => {
        if (error) next(error);
      });
    });
  }
  app.get("/api/health", HealthController.show);
  const inventory = new InventoryController(inventoryDAO, (id) =>
    app.locals.events.emit("catalog-update", {
      componentId: id,
      updatedAt: new Date().toISOString(),
    }),
  );
  app.get("/api/inventory", (req, res) => inventory.list(req, res));
  const components = new ComponentController(componentDAO);
  app.get("/api/components", (req, res) => components.list(req, res));
  app.get("/api/components/:id", (req, res) => components.show(req, res));
  const games = new GameController(gameDAO);
  app.get("/api/games", (req, res) => games.list(req, res));
  const references = new ReferenceController(
    referenceDAO,
    buildDAO,
    componentDAO,
  );
  app.get("/api/systems", (req, res) => references.systems(req, res));
  app.get("/api/benchmarks", async (_req, res) =>
    ApiResponseView.send(res, {
      message: "Referências publicadas de GPU; não são medições do seu PC.",
      data: await referenceDAO.dataset(),
    }),
  );
  const community = new CommunityController({
    community: communityDAO,
    builds: buildDAO,
    components: componentDAO,
    references: referenceDAO,
  });
  app.get("/api/community/ranking", (req, res) => community.list(req, res));
  app.get("/api/community/gallery", (req, res) => community.gallery(req, res));
  app.get("/api/community/builds/:id", (req, res) =>
    community.detail(req, res),
  );
  const auth = new AuthController(userDAO, (id) =>
    app.locals.events.emit("logout", id),
  );
  app.get("/api/auth/providers", (req, res) => auth.providers(req, res));
  const builds = new BuildController(componentDAO, buildDAO);

  const sessionConfig = createSessionConfig(sessionStore, sessionSecret);
  app.use(cookieParser(sessionConfig.secret));
  app.get("/api/builds/draft", (req, res) => builds.draft(req, res));
  const sessionMiddleware = session(sessionConfig);
  app.use(sessionMiddleware);
  app.locals.sessionMiddleware = sessionMiddleware;
  app.locals.sessionStore = sessionConfig.store;
  const cart = new CartController(componentDAO);
  app.post("/api/cart/build", csrfProtection, (req, res) =>
    cart.addBuild(req, res),
  );
  app.get("/api/cart", (req, res) => cart.show(req, res));
  app.put("/api/cart/items/:id", csrfProtection, (req, res) =>
    cart.update(req, res),
  );
  app.delete("/api/cart/items/:id", csrfProtection, (req, res) =>
    cart.remove(req, res),
  );
  app.delete("/api/cart", csrfProtection, (req, res) => cart.clear(req, res));
  app.get("/api/auth/session", (req, res) => auth.session(req, res));
  const addresses = new AddressController(userDAO);
  app.get("/api/account/addresses", requireAuth(userDAO), (req, res) =>
    addresses.list(req, res),
  );
  app.post(
    "/api/account/addresses",
    requireAuth(userDAO),
    csrfProtection,
    (req, res) => addresses.change(req, res, "create"),
  );
  app.put(
    "/api/account/addresses/:id",
    requireAuth(userDAO),
    csrfProtection,
    (req, res) => addresses.change(req, res, "edit"),
  );
  app.put(
    "/api/account/addresses/:id/default",
    requireAuth(userDAO),
    csrfProtection,
    (req, res) => addresses.change(req, res, "default"),
  );
  app.delete(
    "/api/account/addresses/:id",
    requireAuth(userDAO),
    csrfProtection,
    (req, res) => addresses.change(req, res, "delete"),
  );
  const communityLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 12,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) =>
      ApiResponseView.send(res, {
        statusCode: 429,
        message: "Aguarde antes de publicar novamente.",
      }),
  });
  app.get("/api/community/my", requireAuth(userDAO), (req, res) =>
    community.mine(req, res),
  );
  app.get("/api/community/preview/:id", requireAuth(userDAO), (req, res) =>
    community.preview(req, res),
  );
  app.post(
    "/api/community/builds",
    requireAuth(userDAO),
    csrfProtection,
    communityLimit,
    (req, res) => community.publish(req, res),
  );
  app.delete(
    "/api/community/builds/:id",
    requireAuth(userDAO),
    csrfProtection,
    (req, res) => community.remove(req, res),
  );
  app.get("/api/builds/:id/performance", requireAuth(userDAO), (req, res) =>
    references.report(req, res),
  );
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: authLimit,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) =>
      ApiResponseView.send(res, {
        statusCode: 429,
        message:
          "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
      }),
  });
  app.post("/api/auth/register", csrfProtection, limiter, (req, res) =>
    auth.register(req, res),
  );
  app.post("/api/auth/login", csrfProtection, limiter, (req, res) =>
    auth.login(req, res),
  );
  app.post("/api/auth/logout", csrfProtection, (req, res) =>
    auth.logout(req, res),
  );
  app.post("/api/auth/google", csrfProtection, limiter, (req, res) =>
    auth.google(req, res),
  );
  app.post(
    "/api/auth/google/link",
    requireAuth(userDAO),
    csrfProtection,
    limiter,
    (req, res) => auth.linkGoogle(req, res),
  );
  const admin = new AdminController(componentDAO, (id) =>
    app.locals.events.emit("catalog-update", {
      componentId: id,
      updatedAt: new Date().toISOString(),
    }),
  );
  app.param("id", (req, _res, next, id) =>
    /^[a-zA-Z0-9_-]{1,128}$/.test(id)
      ? next()
      : next(new AppError(400, "Identificador inválido.")),
  );
  app.use("/api/admin", requireAuth(userDAO), adminOnly, csrfProtection);
  app.get("/api/admin/inventory", (req, res) => inventory.list(req, res, true));
  app.get("/api/admin/inventory/:id", (req, res) => inventory.detail(req, res));
  app.post("/api/admin/inventory/:id/movements", (req, res) =>
    inventory.adjust(req, res),
  );
  app.post("/api/admin/components", (req, res) => admin.create(req, res));
  app.put("/api/admin/components/:id", (req, res) => admin.update(req, res));
  app.patch("/api/admin/components/:id", (req, res) => admin.update(req, res));
  app.delete("/api/admin/components/:id", (req, res) => admin.delete(req, res));
  app.post("/api/admin/games", (req, res) => games.create(req, res));
  app.put("/api/admin/games/:id", (req, res) => games.update(req, res));
  app.delete("/api/admin/games/:id", (req, res) => games.delete(req, res));
  app.get("/api/admin/metrics", async (_req, res) =>
    ApiResponseView.send(res, {
      message: "Métricas globais, sem dados pessoais.",
      data: {
        ...(await metricsDAO.summary()),
        activeTests: app.locals.activeTests?.() || 0,
      },
    }),
  );
  app.post("/api/builds/analyze", csrfProtection, (req, res) =>
    builds.analyze(req, res),
  );
  app.post("/api/builds/upgrade", csrfProtection, (req, res) =>
    builds.upgrade(req, res),
  );
  app.post("/api/builds", requireAuth(userDAO), csrfProtection, (req, res) =>
    builds.create(req, res),
  );
  app.get("/api/builds/my", requireAuth(userDAO), (req, res) =>
    builds.list(req, res),
  );
  app.get("/api/builds/:id", requireAuth(userDAO), (req, res) =>
    builds.show(req, res),
  );
  app.delete(
    "/api/builds/:id",
    requireAuth(userDAO),
    csrfProtection,
    (req, res) => builds.delete(req, res),
  );
  const orders = new OrderController(
    buildDAO,
    builds,
    orderDAO,
    sessionConfig.secret,
  );
  app.post(
    "/api/orders/card",
    requireAuth(userDAO),
    csrfProtection,
    (req, res) => orders.card(req, res),
  );
  app.post(
    "/api/orders/checkout-dream",
    requireAuth(userDAO),
    csrfProtection,
    (req, res) => orders.checkout(req, res),
  );
  app.get("/api/orders/my", requireAuth(userDAO), (req, res) =>
    orders.list(req, res),
  );
  app.get("/api/orders/:id", requireAuth(userDAO), (req, res) =>
    orders.show(req, res),
  );
  app.post(
    "/api/orders/checkout-cart",
    requireAuth(userDAO),
    csrfProtection,
    (req, res) => orders.checkoutCart(req, res),
  );
  app.get("/openapi.json", (_req, res) => res.json(openapi));
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openapi, {
      customSiteTitle: "DreamBuild PC — API",
      swaggerOptions: {
        validatorUrl: null,
        persistAuthorization: false,
        withCredentials: true,
        requestInterceptor: async function (request) {
          request.credentials = "include";
          if (
            !["GET", "HEAD", "OPTIONS"].includes(request.method?.toUpperCase())
          ) {
            const response = await fetch("/api/auth/session", {
              credentials: "include",
              cache: "no-store",
            });
            const body = await response.json();
            if (body.data?.csrfToken)
              request.headers["X-CSRF-Token"] = body.data.csrfToken;
          }
          return request;
        },
      },
    }),
  );

  app.use((_req, res) =>
    ApiResponseView.send(res, {
      statusCode: 404,
      message: "Rota não encontrada.",
    }),
  );

  app.use((error, _req, res, _next) => {
    const statusCode =
      error instanceof AppError
        ? error.statusCode
        : error.code === 8
          ? 503
          : error.type === "entity.parse.failed"
            ? 400
            : error.type === "entity.too.large"
              ? 413
              : 500;
    if (statusCode === 500)
      console.error(
        "Erro interno no servidor:",
        error.code || error.name || "unknown",
      );
    return ApiResponseView.send(res, {
      statusCode,
      errors: error instanceof AppError ? error.errors : [],
      message:
        error instanceof AppError
          ? error.message
          : statusCode === 503
            ? "O banco atingiu um limite temporário de consultas. Tente novamente quando a cota for renovada."
            : statusCode === 400
              ? "JSON inválido."
              : statusCode === 413
                ? "Corpo da requisição muito grande."
                : "Erro interno do servidor.",
    });
  });
  return app;
}
