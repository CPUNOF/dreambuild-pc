import { pagination } from "../models/Pagination.js";
import { ApiResponseView } from "../views/ApiResponseView.js";
export class InventoryController {
  constructor(dao, onChange = () => {}) {
    this.dao = dao;
    this.onChange = onChange;
  }
  async list(req, res, privateView = false) {
    const options = pagination(req.query),
      page = await this.dao.list(options, privateView);
    res.set("Cache-Control", "no-store");
    return ApiResponseView.send(res, {
      message: "Estoque simulado da DreamBuild.",
      data: page.items,
      meta: { limit: options.limit, nextCursor: page.nextCursor },
    });
  }
  async detail(req, res) {
    res.set("Cache-Control", "no-store");
    return ApiResponseView.send(res, {
      message: "Saldo e últimas 20 movimentações.",
      data: await this.dao.detail(req.params.id),
    });
  }
  async adjust(req, res) {
    const result = await this.dao.adjust(req.params.id, req.body, req.user);
    this.onChange(req.params.id);
    return ApiResponseView.send(res, {
      message: result.replayed
        ? "Movimentação já registrada."
        : "Estoque atualizado.",
      data: result,
    });
  }
}
