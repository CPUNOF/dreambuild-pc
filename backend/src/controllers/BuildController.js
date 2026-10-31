import { Build } from "../models/Build.js";
import { Component } from "../models/Component.js";
import { pagination } from "../models/Pagination.js";
import { AppError } from "../errors/AppError.js";
import { ApiResponseView } from "../views/ApiResponseView.js";
import { cookieOptions } from "../config/sessionConfig.js";
import { Upgrade } from "../models/Upgrade.js";
import { Cart } from "../models/Cart.js";
export class BuildController {
  constructor(components, builds) {
    this.components = components;
    this.builds = builds;
  }
  async analyzeInput(input) {
    const config = Build.configuration(input);
    const components = await this.components.getMany(
      Build.componentIds(config),
    );
    const analysis = Build.analyze(
      config.partIds,
      components,
      input.paymentMethod || "pix",
      config,
    );
    const { comparison, ...quote } = Cart.summarize(
      analysis.parts.map((p) => ({
        componentId: p.id,
        quantity: analysis.quantities[p.id] ?? 1,
      })),
      analysis.parts,
    );
    analysis.storeQuote = {
      ...quote,
      items: quote.items.map(({ component, ...item }) => item),
    };
    return analysis;
  }
  async analyze(req, res) {
    const analysis = await this.analyzeInput(req.body);
    res.cookie(
      "draftBuildCookie",
      {
        partIds: analysis.partIds,
        quantities: analysis.quantities,
        storageIds: analysis.storageIds,
      },
      { ...cookieOptions(), signed: true, maxAge: 30 * 24 * 60 * 60 * 1000 },
    );
    return ApiResponseView.send(res, {
      message: "Montagem analisada.",
      data: analysis,
    });
  }
  async upgrade(req, res) {
    const analysis = await this.analyzeInput(req.body);
    if (!analysis.compatible)
      throw new AppError(
        400,
        "Conclua uma montagem compatível antes de consultar alternativas.",
      );
    const category = Upgrade.target(analysis);
    const candidates = category
      ? (await this.components.list({ limit: 100, category })).items
      : [];
    return ApiResponseView.send(res, {
      message: "Sugestão didática consultada.",
      data: Upgrade.suggest(analysis, candidates),
    });
  }
  draft(req, res) {
    let config = { partIds: {}, quantities: {}, storageIds: [] };
    try {
      if (req.signedCookies.draftBuildCookie?.partIds)
        config = Build.configuration(req.signedCookies.draftBuildCookie);
    } catch {
      /* Rascunho inválido é descartado. */
    }
    return ApiResponseView.send(res, {
      message: "Rascunho consultado.",
      data: config,
    });
  }
  async create(req, res) {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (name.length < 2 || name.length > 80)
      throw new AppError(400, "Dê um nome de 2 a 80 caracteres à montagem.");
    const analysis = await this.analyzeInput(req.body);
    const critical = analysis.notes.filter((note) =>
      [
        "SOCKET",
        "RAM_TYPE",
        "CPU_RAM_TYPE",
        "UNKNOWN_CRITICAL_SOCKET",
        "UNKNOWN_CRITICAL_RAM",
        "RAM_SLOTS",
        "RAM_CAPACITY",
        "CPU_RAM_CAPACITY",
        "UNKNOWN_RAM_MODULES",
        "UNKNOWN_RAM_SLOTS",
        "UNKNOWN_RAM_CAPACITY",
        "RAM_FORM_FACTOR",
        "STORAGE_CONNECTIONS",
        "UNKNOWN_STORAGE_INTERFACE",
        "UNKNOWN_M2_SLOTS",
        "UNKNOWN_SATA_PORTS",
        "COOLER_SOCKET",
        "UNKNOWN_COOLER_SOCKET",
      ].includes(note.code),
    );
    if (critical.length) throw new AppError(409, critical[0].message);
    if (!analysis.parts.length)
      throw new AppError(400, "Escolha ao menos uma peça antes de salvar.");
    const document = await this.builds.create(req.user.id, {
      name,
      ...Build.snapshot(analysis),
    });
    res.cookie(
      "draftBuildCookie",
      {
        partIds: analysis.partIds,
        quantities: analysis.quantities,
        storageIds: analysis.storageIds,
      },
      { ...cookieOptions(), signed: true, maxAge: 30 * 24 * 60 * 60 * 1000 },
    );
    return ApiResponseView.send(res, {
      statusCode: 201,
      message: "Montagem salva.",
      data: this.public(document),
    });
  }
  public(document) {
    const { partsSnapshot, ...result } = document;
    return {
      ...result,
      parts: (partsSnapshot || []).map((part) => new Component(part.id, part)),
    };
  }
  async list(req, res) {
    const options = pagination(req.query);
    const result = await this.builds.listByUser(req.user.id, options);
    return ApiResponseView.send(res, {
      message: "Suas montagens.",
      data: result.items.map((item) => this.public(item)),
      meta: { limit: options.limit, nextCursor: result.nextCursor },
    });
  }
  async show(req, res) {
    const document = await this.builds.getById(req.params.id);
    if (!document || document.userId !== req.user.id)
      throw new AppError(404, "Montagem não encontrada.");
    return ApiResponseView.send(res, {
      message: "Montagem consultada.",
      data: this.public(document),
    });
  }
  async delete(req, res) {
    const document = await this.builds.getById(req.params.id);
    if (!document || document.userId !== req.user.id)
      throw new AppError(404, "Montagem não encontrada.");
    await this.builds.delete(document.id);
    return ApiResponseView.send(res, {
      message: "Montagem removida.",
      data: { id: document.id },
    });
  }
}
