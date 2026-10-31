import { parseComponent } from "../models/ComponentInput.js";
import { ApiResponseView } from "../views/ApiResponseView.js";
import { AppError } from "../errors/AppError.js";
export class AdminController {
  constructor(dao, onChange = () => {}) {
    this.dao = dao;
    this.onChange = onChange;
  }
  async create(req, res) {
    const component = await this.dao.create(parseComponent(req.body));
    this.onChange(component.id);
    return ApiResponseView.send(res, {
      statusCode: 201,
      message: "Produto cadastrado.",
      data: component,
    });
  }
  async update(req, res) {
    const existing = await this.dao.getById(req.params.id);
    if (!existing) throw new AppError(404, "Produto não encontrado.");
    if (req.body?.slug && req.body.slug !== existing.slug)
      throw new AppError(
        400,
        "O endereço do produto é fixo para preservar os links já compartilhados.",
      );
    const component = await this.dao.update(
      req.params.id,
      parseComponent({ ...existing, ...req.body }),
    );
    this.onChange(component.id);
    return ApiResponseView.send(res, {
      message: "Produto atualizado.",
      data: component,
    });
  }
  async delete(req, res) {
    if (!(await this.dao.getById(req.params.id)))
      throw new AppError(404, "Produto não encontrado.");
    await this.dao.delete(req.params.id);
    this.onChange(req.params.id);
    return ApiResponseView.send(res, {
      message: "Produto removido.",
      data: { id: req.params.id },
    });
  }
}
