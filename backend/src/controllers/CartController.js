import { Cart } from "../models/Cart.js";
import { ApiResponseView } from "../views/ApiResponseView.js";
import { AppError } from "../errors/AppError.js";
import { Offer } from "../models/Offer.js";
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
    if (!(component.offers || []).some((offer) => Offer.eligible(offer, "pix")))
      throw new AppError(
        409,
        "Este produto está sem oferta PIX disponível. Ele pode ser consultado, mas não pode ser comprado agora.",
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
