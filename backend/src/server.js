import { createApp } from "./app.js";
import { createHttpServer } from "./httpServer.js";

const port = Number(process.env.PORT || 3001);
const host =
  process.env.HOST ||
  (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");
const server = createHttpServer(createApp()).listen(port, host, () => {
  console.log(`API DreamBuild PC: http://${host}:${port}/api/health`);
});

server.on("error", (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? `A porta ${port} já está em uso. Encerre o outro servidor ou ajuste PORT.`
      : `Não foi possível iniciar o servidor: ${error.message}`,
  );
  process.exitCode = 1;
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.io.close(() => process.exit(0)));
}
