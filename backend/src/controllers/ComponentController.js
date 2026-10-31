import { ApiResponseView } from "../views/ApiResponseView.js";

export class ComponentController {
  constructor(dao) {
    this.dao = dao;
  }

  async list(req, res) {
    const { limit = "20", cursor } = req.query;
    if (
      typeof limit !== "string" ||
      !/^\d{1,3}$/.test(limit) ||
      Number(limit) < 1 ||
      Number(limit) > 100 ||
      (cursor !== undefined &&
        (typeof cursor !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(cursor)))
    ) {
      return ApiResponseView.send(res, {
        statusCode: 400,
        message: "Limite ou cursor inválido.",
      });
    }
    const category =
      typeof req.query.category === "string"
        ? req.query.category.toLowerCase()
        : undefined;
    if (
      req.query.category !== undefined &&
      (!category ||
        ![
          "all",
          "cpu",
          "gpu",
          "mobo",
          "ram",
          "storage",
          "psu",
          "case",
          "cooler",
        ].includes(category))
    )
      return ApiResponseView.send(res, {
        statusCode: 400,
        message: "Categoria inválida.",
      });
    res.set("Cache-Control", "no-store");
    try {
      const result = await this.dao.list({
        limit: Number(limit),
        cursor,
        ...(category && category !== "all" ? { category } : {}),
      });
      return ApiResponseView.send(res, {
        message: "Catálogo consultado.",
        data: result.items,
        meta: {
          limit: Number(limit),
          nextCursor: result.nextCursor,
          ...(result.source
            ? { source: result.source, snapshotAt: result.snapshotAt }
            : {}),
        },
      });
    } catch {
      return ApiResponseView.send(res, {
        statusCode: 503,
        message: "O catálogo está indisponível. Tente novamente em instantes.",
      });
    }
  }
  async show(req, res) {
    try {
      const component = await this.dao.getById(req.params.id);
      return ApiResponseView.send(
        res,
        component
          ? { message: "Produto consultado.", data: component }
          : { statusCode: 404, message: "Produto não encontrado." },
      );
    } catch {
      return ApiResponseView.send(res, {
        statusCode: 503,
        message: "O catálogo está indisponível. Tente novamente em instantes.",
      });
    }
  }
}
