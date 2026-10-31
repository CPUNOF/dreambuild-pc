import { Game } from "../models/Game.js";
import { pagination } from "../models/Pagination.js";
import { ApiResponseView } from "../views/ApiResponseView.js";
import { AppError } from "../errors/AppError.js";
export class GameController {
  constructor(dao) {
    this.dao = dao;
  }
  async list(req, res) {
    const options = pagination(req.query);
    const result = await this.dao.list(options);
    return ApiResponseView.send(res, {
      message: "Cenários didáticos.",
      data: result.items,
      meta: { limit: options.limit, nextCursor: result.nextCursor },
    });
  }
  async create(req, res) {
    return ApiResponseView.send(res, {
      statusCode: 201,
      message: "Cenário cadastrado.",
      data: await this.dao.create(Game.parse(req.body)),
    });
  }
  async update(req, res) {
    const old = await this.dao.getById(req.params.id);
    if (!old) throw new AppError(404, "Cenário não encontrado.");
    if (req.body?.id && req.body.id !== old.id)
      throw new AppError(400, "O identificador do cenário é fixo.");
    return ApiResponseView.send(res, {
      message: "Cenário atualizado.",
      data: await this.dao.update(
        old.id,
        Game.parse({ ...old, ...req.body, id: old.id }),
      ),
    });
  }
  async delete(req, res) {
    if (!(await this.dao.getById(req.params.id)))
      throw new AppError(404, "Cenário não encontrado.");
    await this.dao.delete(req.params.id);
    return ApiResponseView.send(res, {
      message: "Cenário removido.",
      data: { id: req.params.id },
    });
  }
}
