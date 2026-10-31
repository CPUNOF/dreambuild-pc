import { ApiResponseView } from "../views/ApiResponseView.js";
import { AppError } from "../errors/AppError.js";
import { Build } from "../models/Build.js";
import { performanceReport } from "../models/ReferencePerformance.js";
export class ReferenceController {
  constructor(references, builds, components) {
    Object.assign(this, { references, builds, components });
  }
  async systems(_req, res) {
    return ApiResponseView.send(res, {
      message: "Configurações e testes publicados.",
      data: await this.references.systems(),
    });
  }
  async report(req, res) {
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(req.params.id))
      throw new AppError(404, "Montagem não encontrada.");
    const resolution = req.query.resolution || "1080p";
    if (!["1080p", "1440p"].includes(resolution))
      throw new AppError(400, "Escolha 1080p ou 1440p.");
    const build = await this.builds.getById(req.params.id);
    if (!build || build.userId !== req.user.id)
      throw new AppError(404, "Montagem não encontrada.");
    const config = Build.configuration(build);
    const parts = await this.components.getMany(Build.componentIds(config));
    const analysis = Build.analyze(
      Build.selection(build.partIds),
      parts,
      "pix",
      config,
    );
    if (!analysis.compatible)
      throw new AppError(
        409,
        "Conclua uma montagem sem conflitos antes de consultar desempenho.",
      );
    const report = performanceReport(
      analysis,
      await this.references.dataset(),
      resolution,
    );
    return ApiResponseView.send(res, {
      message: "Referências consultadas.",
      data: {
        ...report,
        id: build.id,
        name: build.name,
        type: "custom",
        image: parts.find((p) => p.category === "case")?.image,
        priceCents: analysis.comparison.optimized.totalCents,
        priceCheckedAt: new Date().toISOString(),
      },
    });
  }
}
