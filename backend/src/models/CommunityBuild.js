import { createHash } from "node:crypto";
import { AppError } from "../errors/AppError.js";
export const communityId = (ownerId, buildId) =>
  createHash("sha256")
    .update(ownerId + "\0" + buildId)
    .digest("hex")
    .slice(0, 40);
export function publicationInput(body) {
  if (
    !body ||
    Object.keys(body).some(
      (k) =>
        !["buildId", "nickname", "title", "consent", "previewHash"].includes(k),
    )
  )
    throw new AppError(
      400,
      "Envie apenas os campos da publicação. FPS e preços são calculados pelo servidor.",
    );
  const text = (value, min, max) =>
    typeof value === "string" &&
    value.trim().length >= min &&
    value.trim().length <= max;
  if (body.consent !== true)
    throw new AppError(
      400,
      "Confirme que deseja publicar os dados mostrados na prévia.",
    );
  if (
    !/^[a-zA-Z0-9_-]{1,128}$/.test(body.buildId || "") ||
    !text(body.nickname, 2, 30) ||
    !text(body.title, 2, 60) ||
    !/^[a-f0-9]{64}$/.test(body.previewHash || "")
  )
    throw new AppError(
      400,
      "Escolha apelido, nome público e confira a prévia da montagem.",
    );
  return {
    buildId: body.buildId,
    nickname: body.nickname.trim(),
    title: body.title.trim(),
    previewHash: body.previewHash,
  };
}
export function publicPublication(document) {
  return document ? { id: document.id, ...document.public } : null;
}
export function rankingSummary(record) {
  return {
    id: record.id,
    title: record.title,
    nickname: record.nickname,
    image: record.image,
    configuration: record.configuration,
    priceCents: record.priceCents,
    quotedAt: record.quotedAt,
    publishedAt: record.publishedAt,
    kind: "estimate",
    version: record.version,
    gameCount: record.gameCount,
  };
}
export function previewDigest(data) {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex");
}
export function rankingOptions(query) {
  const resolution = query.resolution || "1080p",
    sort = query.sort || "performance",
    limit = Number(query.limit || 20);
  if (
    !["1080p", "1440p"].includes(resolution) ||
    !["performance", "value"].includes(sort) ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 50
  )
    throw new AppError(400, "Filtro de ranking inválido.");
  return { resolution, sort, limit };
}
