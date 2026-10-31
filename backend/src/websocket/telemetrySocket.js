import { promisify } from "node:util";
import { timingSafeEqual } from "node:crypto";
import { Build } from "../models/Build.js";
import { Simulation } from "../models/Simulation.js";
import { AppError } from "../errors/AppError.js";

export function attachTelemetry(io, app) {
  const { sessionStore, userDAO, buildDAO, componentDAO, gameDAO, events } =
    app.locals;
  const active = new Map();
  const starts = new Map();
  app.locals.activeTests = () => active.size;
  const getSession = (id) => promisify(sessionStore.get).call(sessionStore, id);
  async function live(socket) {
    const data = await getSession(socket.request.sessionID);
    if (!data?.userId || data.userId !== socket.data.userId)
      throw new AppError(401, "Sua sessão terminou. Entre novamente.");
    const user = await userDAO.getById(data.userId);
    if (!user || user.disabled) throw new AppError(401, "Sua sessão terminou.");
    return user;
  }
  io.use(async (socket, next) => {
    try {
      const data = socket.request.session;
      const supplied = socket.handshake.auth?.csrfToken;
      const expected = data?.csrfToken;
      if (
        !data?.userId ||
        typeof supplied !== "string" ||
        typeof expected !== "string" ||
        supplied.length > 128 ||
        Buffer.byteLength(supplied) !== Buffer.byteLength(expected) ||
        !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
      )
        throw new AppError(401, "Entre na conta para conectar a bancada.");
      socket.data.userId = data.userId;
      await live(socket);
      next();
    } catch (error) {
      next(
        new Error(
          error instanceof AppError
            ? error.message
            : "Não foi possível autenticar a bancada.",
        ),
      );
    }
  });
  io.on("connection", (socket) => {
    socket.join("session:" + socket.request.sessionID);
    let timer = null,
      deadline = null,
      generation = 0;
    function stop(message = "") {
      generation++;
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      if (deadline) {
        clearTimeout(deadline);
        deadline = null;
      }
      if (active.get(socket.data.userId)?.socketId === socket.id)
        active.delete(socket.data.userId);
      socket.emit("bench:state", { running: false, message });
    }
    socket.on("bench:stop", (ack) => {
      stop("Teste encerrado.");
      if (typeof ack === "function") ack({ status: "success" });
    });
    socket.on("bench:start", async (input, ack) => {
      const reply = typeof ack === "function" ? ack : () => {};
      stop();
      const current = generation;
      try {
        const now = Date.now();
        const history = (starts.get(socket.data.userId) || []).filter(
          (time) => now - time < 60000,
        );
        if (history.length >= 10)
          throw new AppError(
            429,
            "Aguarde um minuto antes de iniciar mais testes.",
          );
        history.push(now);
        starts.set(socket.data.userId, history);
        if (
          !input ||
          typeof input.buildId !== "string" ||
          !/^[a-zA-Z0-9_-]{1,128}$/.test(input.buildId) ||
          typeof input.gameId !== "string" ||
          !/^[a-z0-9-]{1,100}$/.test(input.gameId)
        )
          throw new AppError(400, "Montagem ou cenário inválido.");
        await live(socket);
        const [build, game] = await Promise.all([
          buildDAO.getById(input.buildId),
          gameDAO.getById(input.gameId),
        ]);
        if (!build || build.userId !== socket.data.userId)
          throw new AppError(404, "Montagem não encontrada.");
        const components = await componentDAO.getMany(
          Build.componentIds(Build.configuration(build)),
        );
        const analysis = Build.analyze(
          Build.selection(build.partIds),
          components,
          build.comparison.paymentMethod,
          Build.configuration(build),
        );
        const setup = Simulation.setup(analysis, game, input);
        if (!socket.connected || generation !== current)
          return reply({ status: "error", message: "Início cancelado." });
        const previous = active.get(socket.data.userId);
        if (previous)
          previous.stop("Bancada iniciada em outra aba da mesma conta.");
        active.set(socket.data.userId, { socketId: socket.id, stop });
        let sequence = 0,
          busy = false,
          lastVerified = Date.now();
        socket.emit("bench:state", {
          running: true,
          message: "Simulação didática em execução.",
        });
        socket.emit("bench:sample", {
          ...Simulation.sample(setup, 0),
          buildId: input.buildId,
        });
        timer = setInterval(async () => {
          if (busy) return;
          busy = true;
          try {
            if (Date.now() - lastVerified >= 5000) {
              await live(socket);
              const owner = await buildDAO.getById(input.buildId);
              if (!owner || owner.userId !== socket.data.userId)
                throw new Error("Montagem indisponível.");
              lastVerified = Date.now();
            }
            if (!socket.connected || generation !== current) return;
            sequence++;
            socket.emit("bench:sample", {
              ...Simulation.sample(setup, sequence),
              buildId: input.buildId,
            });
            if (sequence >= 240)
              stop("O limite de dois minutos desta simulação foi atingido.");
          } catch {
            stop("A sessão ou a montagem não está mais disponível.");
          } finally {
            busy = false;
          }
        }, 500);
        deadline = setTimeout(
          () => stop("O limite de dois minutos desta simulação foi atingido."),
          120000,
        );
        reply({
          status: "success",
          data: { ...setup, durationLimitSeconds: 120, intervalMs: 500 },
        });
      } catch (error) {
        if (generation === current) stop();
        reply({
          status: "error",
          message:
            error instanceof AppError
              ? error.message
              : "Não foi possível iniciar o teste.",
          code: error.statusCode || 503,
        });
      }
    });
    socket.on("disconnect", () => stop());
  });
  const onLogout = (id) => io.in("session:" + id).disconnectSockets(true);
  const onCatalog = (update) => io.emit("catalog:updated", update);
  events.on("logout", onLogout);
  events.on("catalog-update", onCatalog);
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [id, history] of starts) {
      const recent = history.filter((time) => now - time < 60000);
      if (recent.length) starts.set(id, recent);
      else starts.delete(id);
    }
  }, 60000);
  cleanup.unref();
  return () => {
    for (const test of [...active.values()]) test.stop();
    clearInterval(cleanup);
    starts.clear();
    events.off("logout", onLogout);
    events.off("catalog-update", onCatalog);
  };
}
