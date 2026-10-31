import { AppError } from "../errors/AppError.js";
export class Game {
  static parse(input) {
    if (
      !input ||
      typeof input.id !== "string" ||
      !/^[a-z0-9-]{1,100}$/.test(input.id) ||
      typeof input.title !== "string" ||
      input.title.trim().length < 2 ||
      input.title.length > 120
    )
      throw new AppError(
        400,
        "Informe nome e identificador válidos para o cenário.",
      );
    if (
      typeof input.weight !== "number" ||
      !Number.isFinite(input.weight) ||
      input.weight < 0.1 ||
      input.weight > 10
    )
      throw new AppError(400, "O peso didático deve ficar entre 0,1 e 10.");
    const image = (value) =>
      typeof value === "string" &&
      value.length < 2000 &&
      ((/^\/games\/[a-zA-Z0-9_./-]+$/.test(value) && !value.includes("..")) ||
        /^https:\/\/[^\s]+$/.test(value));
    if (
      !image(input.coverUrl) ||
      !image(input.screenshotUrl) ||
      typeof input.sourceUrl !== "string" ||
      !/^https:\/\/[^\s]+$/.test(input.sourceUrl) ||
      input.sourceUrl.length > 2000
    )
      throw new AppError(400, "Informe as imagens e a fonte HTTPS do jogo.");
    return {
      id: input.id,
      title: input.title.trim(),
      weight: input.weight,
      coverUrl: input.coverUrl,
      screenshotUrl: input.screenshotUrl,
      sourceUrl: input.sourceUrl,
      calibrated: false,
      modelLabel: "Cenário didático, sem benchmark medido",
    };
  }
}
