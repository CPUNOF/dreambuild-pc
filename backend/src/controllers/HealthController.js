import { ApiResponseView } from "../views/ApiResponseView.js";

export class HealthController {
  static show(_req, res) {
    res.set("Cache-Control", "no-store");
    return ApiResponseView.send(res, {
      message: "Servidor DreamBuild PC disponível.",
      data: {
        service: "dreambuild-api",
        version: "0.1.0",
        database:
          process.env.FIREBASE_PROJECT_ID &&
          (process.env.GOOGLE_APPLICATION_CREDENTIALS ||
            process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
            ? "not-checked"
            : "not-configured",
      },
    });
  }
}
