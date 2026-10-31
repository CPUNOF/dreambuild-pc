import { createApp } from "../backend/src/app.js";
import { createHttpServer } from "../backend/src/httpServer.js";

// No deploy, a interface e a API compartilham o mesmo domínio.
const domains = [
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
  process.env.VERCEL_URL,
]
  .filter((value) => value && /^[a-z0-9.-]+$/i.test(value))
  .map((value) => `https://${value}`);
const origins = process.env.FRONTEND_ORIGINS || domains.join(",");
export default createHttpServer(createApp(origins ? { origins } : undefined));
