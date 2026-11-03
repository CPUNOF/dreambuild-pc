import { Cart } from "../models/Cart.js";
import { ApiResponseView } from "../views/ApiResponseView.js";
import { AppError } from "../errors/AppError.js";
import { inventoryState } from "../../../shared/inventory.js";
import { Build } from "../models/Build.js";
export class CartController {
  constructor(components) {
    this.components = components;
  }
  async snapshot(req) {
    const lines = Cart.lines(req.session.cart || []);
    return Cart.summarize(
      lines,
      await this.components.getMany(lines.map((line) => line.componentId)),
    );
  }
  async show(req, res) {
    return ApiResponseView.send(res, {
      message: "Seu carrinho.",
      data: await this.snapshot(req),
    });
  }
  async update(req, res) {
    const quantity = req.body?.quantity;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10)
      throw new AppError(400, "Escolha de 1 a 10 unidades.");
    const component = await this.components.getById(req.params.id);
    if (!component) throw new AppError(404, "Produto não encontrado.");
    const stock = inventoryState(component.inventory);
    if (!stock.configured || stock.quantity < quantity)
      throw new AppError(
        409,
        "Quantidade indisponível no estoque simulado da DreamBuild. Atualize o produto ou escolha outra quantidade.",
      );
    const lines = Cart.lines(req.session.cart || []).filter(
      (line) => line.componentId !== req.params.id,
    );
    req.session.cart = Cart.lines([
      ...lines,
      { componentId: req.params.id, quantity },
    ]);
    return this.show(req, res);
  }
  async addBuild(req, res) {
    const key = req.body?.idempotencyKey;
    if (typeof key !== "string" || !/^[a-zA-Z0-9_-]{16,128}$/.test(key))
      throw new AppError(400, "A identificação desta adição é inválida.");
    const config = Build.configuration(req.body),
      fingerprint = JSON.stringify(config);
    if (req.session.lastBuildAddition?.key === key) {
      if (req.session.lastBuildAddition.fingerprint !== fingerprint)
        throw new AppError(
          409,
          "Esta tentativa já foi usada para outra montagem.",
        );
      return this.show(req, res);
    }
    const current = Cart.lines(req.session.cart || []),
      ids = Build.componentIds(config);
    const allIds = [...new Set([...current.map((i) => i.componentId), ...ids])];
    const all = await this.components.getMany(allIds),
      byId = new Map(all.filter(Boolean).map((p) => [p.id, p]));
    const analysis = Build.analyze(
      config.partIds,
      ids.map((id) => byId.get(id) || null),
      "pix",
      config,
    );
    if (!analysis.complete || !analysis.compatible)
      throw new AppError(
        400,
        "Conclua uma montagem compatível antes de adicionar o PC ao carrinho.",
      );
    const quantities = new Map(
      current.map((line) => [line.componentId, line.quantity]),
    );
    for (const part of analysis.parts)
      quantities.set(
        part.id,
        (quantities.get(part.id) || 0) + (analysis.quantities[part.id] ?? 1),
      );
    const lines = Cart.lines(
      [...quantities].map(([componentId, quantity]) => ({
        componentId,
        quantity,
      })),
    );
    const summary = Cart.summarize(lines, all);
    if (summary.hasUnavailableProducts)
      throw new AppError(
        409,
        "Há itens sem saldo suficiente no carrinho. Revise as quantidades antes de continuar.",
      );
    req.session.cart = lines;
    req.session.lastBuildAddition = { key, fingerprint };
    return ApiResponseView.send(res, {
      message:
        "Montagem adicionada ao carrinho. Confira as peças antes de finalizar.",
      data: summary,
    });
  }
  async remove(req, res) {
    req.session.cart = Cart.lines(req.session.cart || []).filter(
      (line) => line.componentId !== req.params.id,
    );
    return this.show(req, res);
  }
  async clear(req, res) {
    req.session.cart = [];
    return this.show(req, res);
  }
}
