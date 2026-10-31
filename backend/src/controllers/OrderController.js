import { createHash, randomBytes } from "node:crypto";
import { DemoCard } from "../models/DemoCard.js";
import { Build } from "../models/Build.js";
import { Component } from "../models/Component.js";
import { pagination } from "../models/Pagination.js";
import { ApiResponseView } from "../views/ApiResponseView.js";
import { AppError } from "../errors/AppError.js";
import { Cart } from "../models/Cart.js";
export class OrderController {
  constructor(builds, buildController, orders, secret) {
    this.builds = builds;
    this.buildController = buildController;
    this.orders = orders;
    this.secret = secret;
  }
  card(req, res) {
    res.set("Cache-Control", "no-store");
    return ApiResponseView.send(res, {
      message: "Cartão fictício gerado. Não é um cartão bancário.",
      data: DemoCard.create(req.user, this.secret),
    });
  }
  public(document) {
    const { buildSnapshot, ...result } = document;
    const { partsSnapshot, ...snapshot } = buildSnapshot;
    return {
      ...result,
      buildSnapshot: {
        ...snapshot,
        parts: partsSnapshot.map((part) => ({
          ...new Component(part.id, part),
          quantity:
            snapshot.quantities?.[part.id] ??
            result.lines?.find((line) => line.componentId === part.id)
              ?.quantity ??
            1,
        })),
      },
    };
  }
  async checkout(req, res) {
    const { buildId, idempotencyKey, card } = req.body || {};
    if (
      typeof buildId !== "string" ||
      !/^[a-zA-Z0-9_-]{1,128}$/.test(buildId) ||
      typeof idempotencyKey !== "string" ||
      !/^[a-zA-Z0-9_-]{16,128}$/.test(idempotencyKey) ||
      !card ||
      typeof card !== "object"
    )
      throw new AppError(400, "Informe a montagem e gere seu cartão fictício.");
    const requestHash = createHash("sha256")
      .update(
        JSON.stringify({
          buildId,
          card: {
            number: card.number,
            cvv: card.cvv,
            validUntil: card.validUntil,
            token: card.token,
          },
        }),
      )
      .digest("hex");
    const replay = await this.orders.replay(
      req.user.id,
      idempotencyKey,
      requestHash,
    );
    if (replay)
      return ApiResponseView.send(res, {
        message: "Compra simulada já registrada.",
        data: this.public(replay),
      });
    DemoCard.verify(card, req.user.id, this.secret);
    const build = await this.builds.getById(buildId);
    if (!build || build.userId !== req.user.id)
      throw new AppError(404, "Montagem não encontrada.");
    const analysis = await this.buildController.analyzeInput({
      partIds: build.partIds,
      quantities: build.quantities,
      storageIds: build.storageIds,
      paymentMethod: build.comparison.paymentMethod,
    });
    if (!analysis.compatible)
      throw new AppError(
        400,
        "A montagem precisa estar completa e sem incompatibilidades. Reabra o montador para revisar.",
      );
    if (!analysis.comparison.optimized.complete)
      throw new AppError(
        409,
        "Há peças sem oferta disponível nesta modalidade. Revise a montagem antes de comprar.",
      );
    const document = {
      buildId,
      buildName: build.name,
      simulated: true,
      approvalCode: randomBytes(5).toString("hex").toUpperCase(),
      totalCents: analysis.comparison.optimized.totalCents,
      buildSnapshot: Build.snapshot(analysis),
      fakeCardDetails: {
        maskedNumber: DemoCard.masked(card.number),
        holderName: req.user.name,
        label: "DREAMBUILD DEMO — SEM VALOR BANCÁRIO",
      },
    };
    const order = await this.orders.createIdempotent(
      req.user.id,
      idempotencyKey,
      requestHash,
      document,
    );
    return ApiResponseView.send(res, {
      statusCode: 201,
      message: "Compra simulada aprovada. Nenhum pagamento foi realizado.",
      data: this.public(order),
    });
  }
  async list(req, res) {
    const options = pagination(req.query);
    const result = await this.orders.listByUser(req.user.id, options);
    return ApiResponseView.send(res, {
      message: "Seus pedidos simulados.",
      data: result.items.map((item) => this.public(item)),
      meta: { limit: options.limit, nextCursor: result.nextCursor },
    });
  }
  async checkoutCart(req, res) {
    const { idempotencyKey, card, items, quoteVersion } = req.body || {};
    if (
      typeof idempotencyKey !== "string" ||
      !/^[-a-zA-Z0-9_]{16,128}$/.test(idempotencyKey) ||
      !card ||
      typeof card !== "object"
    )
      throw new AppError(400, "Revise o pedido e gere seu cartão fictício.");
    const lines = Cart.lines(items);
    if (!lines.length) throw new AppError(400, "Seu carrinho está vazio.");
    const requestHash = createHash("sha256")
      .update(
        JSON.stringify({
          kind: "cart",
          quoteVersion,
          lines,
          card: {
            number: card.number,
            cvv: card.cvv,
            validUntil: card.validUntil,
            token: card.token,
          },
        }),
      )
      .digest("hex");
    const previous = await this.orders.replay(
      req.user.id,
      idempotencyKey,
      requestHash,
    );
    if (previous)
      return ApiResponseView.send(res, {
        message: "Pedido já confirmado.",
        data: this.public(previous),
      });
    DemoCard.verify(card, req.user.id, this.secret);
    if (
      JSON.stringify(lines) !==
      JSON.stringify(Cart.lines(req.session.cart || []))
    )
      throw new AppError(
        409,
        "O carrinho mudou. Volte e revise os produtos antes de confirmar.",
      );
    const parts = await this.buildController.components.getMany(
      lines.map((line) => line.componentId),
    );
    const summary = Cart.summarize(lines, parts);
    if (quoteVersion !== summary.quoteVersion)
      throw new AppError(
        409,
        "Os preços ou a disponibilidade mudaram. Volte ao carrinho e revise a cotação atual.",
      );
    if (summary.hasMissingProducts)
      throw new AppError(409, "Um produto foi removido. Revise o carrinho.");
    if (summary.hasUnavailableProducts)
      throw new AppError(
        409,
        "Há produtos sem oferta disponível. Remova ou substitua os itens indisponíveis antes de comprar.",
      );
    const document = {
      kind: "cart",
      buildId: null,
      buildName:
        summary.itemCount === 1
          ? summary.items[0].component.name
          : `Pedido com ${summary.itemCount} peças`,
      simulated: true,
      approvalCode: randomBytes(5).toString("hex").toUpperCase(),
      totalCents: summary.totalCents,
      lines: summary.items.map(
        ({ componentId, quantity, unitPriceCents, lineTotalCents }) => ({
          componentId,
          quantity,
          unitPriceCents,
          lineTotalCents,
        }),
      ),
      buildSnapshot: Build.snapshot({
        parts,
        comparison: summary.comparison,
        kind: "cart",
        itemCount: summary.itemCount,
      }),
      fakeCardDetails: {
        maskedNumber: DemoCard.masked(card.number),
        holderName: req.user.name,
        label: "DREAMBUILD DEMO — SEM VALOR BANCÁRIO",
      },
    };
    const order = await this.orders.createIdempotent(
      req.user.id,
      idempotencyKey,
      requestHash,
      document,
    );
    req.session.cart = [];
    return ApiResponseView.send(res, {
      statusCode: 201,
      message:
        "Pedido confirmado em simulação. Nenhum pagamento foi realizado.",
      data: this.public(order),
    });
  }
  async show(req, res) {
    const order = await this.orders.getById(req.params.id);
    if (!order || order.userId !== req.user.id)
      throw new AppError(404, "Pedido não encontrado.");
    return ApiResponseView.send(res, {
      message: "Pedido simulado consultado.",
      data: this.public(order),
    });
  }
}
