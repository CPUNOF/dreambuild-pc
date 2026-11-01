// CT-UNI-13 e CT-API-12 — Cenários didáticos de jogos (Game.parse e CRUD
// /api/admin/games). Técnicas: valor limite e partição de equivalência.
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { Game } from "../../src/models/Game.js";
import { AppError } from "../../src/errors/AppError.js";
import { startServer } from "../support/memory.js";

const valid = {
  id: "jogo-teste",
  title: "Jogo de Teste",
  weight: 1,
  coverUrl: "/games/capa.jpg",
  screenshotUrl: "https://cdn.example.com/cena.jpg",
  sourceUrl: "https://store.steampowered.com/app/1/",
};
const is400 = (e) => e instanceof AppError && e.statusCode === 400;

describe("CT-UNI-13 Game.parse", () => {
  for (const [label, over, ok] of [
    ["título com 1 caractere (VL - 1)", { title: "A" }, false],
    ["título com 2 caracteres (VL)", { title: "AB" }, true],
    ["título com 120 caracteres (VL)", { title: "a".repeat(120) }, true],
    ["título com 121 caracteres (VL + 1)", { title: "a".repeat(121) }, false],
    // DEF-04: o máximo era medido antes do trim, ao contrário do mínimo.
    [
      "título de 120 caracteres + espaço no fim (DEF-04)",
      { title: "a".repeat(120) + " " },
      true,
    ],
    ["peso 0.09 (VL - 1)", { weight: 0.09 }, false],
    ["peso 0.1 (VL)", { weight: 0.1 }, true],
    ["peso 10 (VL)", { weight: 10 }, true],
    ["peso 10.01 (VL + 1)", { weight: 10.01 }, false],
    ["peso NaN", { weight: Number.NaN }, false],
    ["peso em texto", { weight: "1" }, false],
    ["id com maiúscula", { id: "Jogo" }, false],
    ["id com 100 caracteres (VL)", { id: "a".repeat(100) }, true],
    ["id com 101 caracteres (VL + 1)", { id: "a".repeat(101) }, false],
    [
      "imagem local com travessia",
      { coverUrl: "/games/../segredo.jpg" },
      false,
    ],
    ["imagem HTTP sem TLS", { coverUrl: "http://x.com/a.jpg" }, false],
    [
      "fonte sem HTTPS",
      { sourceUrl: "http://store.steampowered.com/app/1/" },
      false,
    ],
  ])
    test(label, () => {
      if (ok) assert.ok(Game.parse({ ...valid, ...over }));
      else assert.throws(() => Game.parse({ ...valid, ...over }), is400);
    });

  test("resultado é normalizado e sempre marcado como não calibrado", () => {
    const game = Game.parse({
      ...valid,
      title: "  Jogo  ",
      calibrated: true,
      extra: 1,
    });
    assert.equal(game.title, "Jogo");
    assert.equal(game.calibrated, false);
    assert.equal(game.extra, undefined);
  });
});

describe("CT-API-12 CRUD /api/admin/games", () => {
  let ctx;
  before(async () => (ctx = await startServer()));
  after(() => ctx.close());

  test("admin cadastra, lista, altera e remove um cenário", async () => {
    const admin = ctx.client();
    await admin.login("admin@dreambuild.test");
    const created = await admin.post("/api/admin/games", valid);
    assert.equal(created.status, 201);
    assert.equal(created.body.data.calibrated, false);

    const list = await ctx.client().get("/api/games?limit=10");
    assert.equal(list.status, 200);
    assert.deepEqual(
      list.body.data.map((g) => g.id),
      ["jogo-teste"],
    );

    const updated = await admin.put("/api/admin/games/jogo-teste", {
      weight: 2.5,
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.weight, 2.5);
    assert.equal(updated.body.data.title, "Jogo de Teste");

    assert.equal(
      (await admin.put("/api/admin/games/jogo-teste", { id: "outro" })).status,
      400,
    );
    assert.equal(
      (await admin.put("/api/admin/games/jogo-teste", { weight: 11 })).status,
      400,
    );
    assert.equal((await admin.post("/api/admin/games", valid)).status, 409);

    assert.equal(
      (await admin.delete("/api/admin/games/jogo-teste")).status,
      200,
    );
    assert.equal(
      (await admin.delete("/api/admin/games/jogo-teste")).status,
      404,
    );
    assert.equal(
      (await admin.put("/api/admin/games/jogo-teste", { weight: 1 })).status,
      404,
    );
  });

  test("cliente recebe 403 e visitante 401", async () => {
    const client = ctx.client();
    await client.login("cliente@dreambuild.test");
    assert.equal((await client.post("/api/admin/games", valid)).status, 403);
    const visitor = ctx.client();
    await visitor.get("/api/auth/session");
    assert.equal((await visitor.post("/api/admin/games", valid)).status, 401);
    assert.equal(ctx.gameDAO.data.size, 0);
  });

  test("listagem pública valida paginação (400)", async () => {
    assert.equal((await ctx.client().get("/api/games?limit=0")).status, 400);
  });
});
