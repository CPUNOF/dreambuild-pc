import { createServer } from "node:http";
import { Server } from "socket.io";
import { attachTelemetry } from "./websocket/telemetrySocket.js";
export function createHttpServer(app) {
  const server = createServer(app);
  const io = new Server(server, {
    cors: { origin: [...app.locals.origins], credentials: true },
    maxHttpBufferSize: 16000,
    allowRequest: (request, callback) =>
      callback(null, app.locals.origins.has(request.headers.origin)),
  });
  io.engine.use(app.locals.sessionMiddleware);
  const cleanup = attachTelemetry(io, app);
  server.io = io;
  server.on("close", cleanup);
  return server;
}
