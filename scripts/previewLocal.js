import { existsSync } from "node:fs";
if (!existsSync(new URL("../frontend/dist/index.html", import.meta.url)))
  throw new Error("Execute npm.cmd run build antes de abrir a prévia.");
const port = process.env.PREVIEW_PORT || "4173";
process.env.PORT = port;
process.env.HOST = "127.0.0.1";
process.env.SERVE_FRONTEND = "true";
process.env.FRONTEND_ORIGINS = `http://127.0.0.1:${port},http://localhost:${port}`;
// Prévia HTTP restrita ao loopback; o deploy usa NODE_ENV=production e HTTPS.
process.env.NODE_ENV = "development";
console.log(`Prévia local do build: http://127.0.0.1:${port}/`);
await import("../backend/src/server.js");
