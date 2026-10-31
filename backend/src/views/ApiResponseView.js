// A View do back-end formata JSON; a interface visual pertence ao React.
export class ApiResponseView {
  static send(
    res,
    { statusCode = 200, message, data = null, errors = [], meta = {} },
  ) {
    return res.status(statusCode).json({
      status: statusCode < 400 ? "success" : "error",
      message,
      data,
      errors,
      meta,
    });
  }
}
