import { Build } from "../models/Build.js";
import { performanceReport } from "../models/ReferencePerformance.js";
import {
  publicationInput,
  previewDigest,
  rankingOptions,
} from "../models/CommunityBuild.js";
import { ApiResponseView } from "../views/ApiResponseView.js";
import { AppError } from "../errors/AppError.js";
import { pagination } from "../models/Pagination.js";
export class CommunityController {
  constructor({ community, builds, components, references }) {
    Object.assign(this, { community, builds, components, references });
  }
  async prepare(ownerId, buildId) {
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(buildId || ""))
      throw new AppError(400, "Montagem inválida.");
    const build = await this.builds.getById(buildId);
    if (!build || build.userId !== ownerId)
      throw new AppError(404, "Montagem não encontrada.");
    const config = Build.configuration(build);
    const parts = await this.components.getMany(Build.componentIds(config)),
      analysis = Build.analyze(config.partIds, parts, "pix", config);
    if (!analysis.compatible)
      throw new AppError(
        409,
        "Conclua uma montagem compatível antes de publicar.",
      );
    const dataset = await this.references.dataset();
    const performance = Object.fromEntries(
      ["1080p", "1440p"].map((r) => [
        r,
        performanceReport(analysis, dataset, r),
      ]),
    );
    const quotes = analysis.comparison.optimized.choices
      .filter((c) => c.offer)
      .map((c) => ({
        componentId: c.componentId,
        store: c.offer.store,
        priceCents: c.offer.priceCents,
        checkedAt: c.offer.checkedAt,
        sourceUrl: c.offer.sourceUrl,
        quantity: c.offer.quantity ?? 1,
        unitPriceCents: c.offer.unitPriceCents ?? c.offer.priceCents,
      }));
    const data = {
      version: dataset.version,
      gameCount: dataset.rankingGameIds.length,
      kind: "estimate",
      image:
        parts.find((p) => p.category === "case")?.image ||
        parts.find((p) => p.category === "gpu")?.image ||
        null,
      configuration: performance["1080p"].configuration,
      parts: parts.map((p) => ({
        quantity: config.quantities[p.id] ?? 1,
        id: p.id,
        category: p.category,
        name: p.name,
        model: p.model || "",
        image: p.image,
      })),
      priceCents: analysis.comparison.optimized.complete
        ? analysis.comparison.optimized.totalCents
        : null,
      quotedAt: quotes.length ? quotes.map((q) => q.checkedAt).sort()[0] : null,
      quotes,
      shippingIncluded: false,
      paymentMethod: "pix",
      performance,
      cooling: analysis.resources.cooling,
      ramCapacityGb: analysis.resources.ram.capacityGb,
      itemCount: analysis.itemCount,
    };
    return { data, previewHash: previewDigest(data) };
  }
  async preview(req, res) {
    const result = await this.prepare(req.user.id, req.params.id);
    return ApiResponseView.send(res, {
      message: "Prévia privada da publicação. Nada foi publicado.",
      data: result,
    });
  }
  async publish(req, res) {
    const input = publicationInput(req.body),
      fresh = await this.prepare(req.user.id, input.buildId);
    if (input.previewHash !== fresh.previewHash)
      throw new AppError(
        409,
        "As peças, cotações ou referências mudaram. Confira a prévia novamente.",
      );
    const record = await this.community.publish(req.user.id, input.buildId, {
      ...fresh.data,
      nickname: input.nickname,
      title: input.title,
      publishedAt: new Date().toISOString(),
    });
    return ApiResponseView.send(res, {
      statusCode: 201,
      message: "Seu PC foi publicado voluntariamente.",
      data: record,
    });
  }
  async list(req, res) {
    const options = rankingOptions(req.query),
      dataset = await this.references.dataset();
    return ApiResponseView.send(res, {
      message: "Ranking de estimativas comparáveis.",
      data: await this.community.list({ version: dataset.version, ...options }),
      meta: {
        ...options,
        version: dataset.version,
        gameIds: dataset.rankingGameIds,
        kind: "estimate",
        limit: options.limit,
      },
    });
  }
  async gallery(req, res) {
    return ApiResponseView.send(res, {
      message: "PCs publicados voluntariamente.",
      data: await this.community.gallery(),
    });
  }
  async detail(req, res) {
    const item = await this.community.detail(req.params.id);
    if (!item) throw new AppError(404, "Publicação não encontrada.");
    return ApiResponseView.send(res, { message: "PC público.", data: item });
  }
  async mine(req, res) {
    const options = pagination(req.query),
      result = await this.community.mine(req.user.id, options);
    return ApiResponseView.send(res, {
      message: "Suas publicações.",
      data: result.items,
      meta: { limit: options.limit, nextCursor: result.nextCursor },
    });
  }
  async remove(req, res) {
    await this.community.remove(req.user.id, req.params.id);
    return ApiResponseView.send(res, {
      message: "Publicação removida. Sua montagem privada foi preservada.",
      data: { id: req.params.id },
    });
  }
}
