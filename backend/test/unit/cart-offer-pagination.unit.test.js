// CT-UNI-05 a CT-UNI-08 — Regras de carrinho, elegibilidade de oferta,
// validação de ofertas e paginação. Técnicas: VL, PE e tabela de decisão.
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Cart } from "../../src/models/Cart.js";
import { Offer } from "../../src/models/Offer.js";
import { pagination } from "../../src/models/Pagination.js";
import { AppError } from "../../src/errors/AppError.js";

const is400 = (error) => error instanceof AppError && error.statusCode === 400;

describe("CT-UNI-05 Cart.lines: quantidade 1..10 e até 30 modelos", () => {
  const line = (quantity, componentId = "cpu-1") => [{ componentId, quantity }];
  for (const [label, quantity, ok] of [
    ["0 (VL inferior - 1)", 0, false],
    ["1 (VL inferior)", 1, true],
    ["10 (VL superior)", 10, true],
    ["11 (VL superior + 1)", 11, false],
    ["-1 (PE negativa)", -1, false],
    ["1.5 (PE fracionária)", 1.5, false],
    ['"2" (PE texto)', "2", false],
  ])
    test(`quantidade ${label}`, () => {
      if (ok) assert.equal(Cart.lines(line(quantity))[0].quantity, quantity);
      else assert.throws(() => Cart.lines(line(quantity)), is400);
    });

  const many = (n) =>
    Array.from({ length: n }, (_, i) => ({
      componentId: `p${i}`,
      quantity: 1,
    }));
  test("30 modelos (VL superior) é aceito", () =>
    assert.equal(Cart.lines(many(30)).length, 30));
  test("31 modelos (VL superior + 1) é rejeitado", () =>
    assert.throws(() => Cart.lines(many(31)), is400));
  test("entrada que não é lista é rejeitada", () =>
    assert.throws(() => Cart.lines("x"), is400));

  test("modelo repetido é rejeitado", () =>
    assert.throws(
      () =>
        Cart.lines([
          { componentId: "a", quantity: 1 },
          { componentId: "a", quantity: 2 },
        ]),
      is400,
    ));

  for (const [label, id, ok] of [
    ["128 caracteres (VL)", "a".repeat(128), true],
    ["129 caracteres (VL + 1)", "a".repeat(129), false],
    ["com barra (travessia)", "../admin", false],
    ["vazio", "", false],
  ])
    test(`identificador ${label}`, () => {
      if (ok) assert.equal(Cart.lines(line(1, id)).length, 1);
      else assert.throws(() => Cart.lines(line(1, id)), is400);
    });

  test("linhas saem ordenadas e só com os campos esperados", () => {
    assert.deepEqual(
      Cart.lines([
        { componentId: "b", quantity: 1, extra: true },
        { componentId: "a", quantity: 2 },
      ]),
      [
        { componentId: "a", quantity: 2 },
        { componentId: "b", quantity: 1 },
      ],
    );
  });
});

describe("CT-UNI-06 Offer.eligible — tabela de decisão", () => {
  // Regra: elegível ⇔ disponível E método pedido E preço inteiro > 0.
  const base = {
    availability: "in_stock",
    paymentMethod: "pix",
    priceCents: 1000,
  };
  const table = [
    // disponibilidade, método, preço, esperado
    ["in_stock", "pix", 1000, true],
    ["out_of_stock", "pix", 1000, false],
    ["unknown", "pix", 1000, false],
    ["in_stock", "card", 1000, false],
    ["in_stock", "pix", 0, false],
    ["in_stock", "pix", -5, false],
    ["in_stock", "pix", 10.5, false],
    ["in_stock", "pix", null, false],
  ];
  for (const [availability, paymentMethod, priceCents, expected] of table)
    test(`${availability} / ${paymentMethod} / ${priceCents} → ${expected}`, () =>
      assert.equal(
        Offer.eligible({ ...base, availability, paymentMethod, priceCents }),
        expected,
      ));
  test("oferta ausente não é elegível", () =>
    assert.equal(Offer.eligible(undefined), false));
  test("método de pagamento pode ser escolhido", () =>
    assert.equal(
      Offer.eligible({ ...base, paymentMethod: "card" }, "card"),
      true,
    ));
});

describe("CT-UNI-07 Offer.parseMany — validação de ofertas do admin", () => {
  const offer = (over = {}) => ({
    store: "kabum",
    paymentMethod: "pix",
    availability: "in_stock",
    priceCents: 1000,
    sourceUrl: "https://www.kabum.com.br/produto/1/teste",
    checkedAt: new Date(Date.now() - 60_000).toISOString(),
    ...over,
  });
  const stores = ["kabum", "pichau", "terabyte"];
  const methods = ["pix", "cash", "card"];
  const hosts = {
    kabum: "kabum.com.br",
    pichau: "pichau.com.br",
    terabyte: "terabyteshop.com.br",
  };
  const nine = stores.flatMap((store) =>
    methods.map((paymentMethod) =>
      offer({
        store,
        paymentMethod,
        sourceUrl: `https://www.${hosts[store]}/p/1`,
      }),
    ),
  );

  test("9 ofertas (VL superior) aceitas", () =>
    assert.equal(Offer.parseMany(nine).length, 9));
  test("10 ofertas (VL + 1) rejeitadas", () =>
    assert.throws(() => Offer.parseMany([...nine, offer()]), is400));
  test("mesma loja e pagamento duplicados", () =>
    assert.throws(() => Offer.parseMany([offer(), offer()]), is400));

  for (const [label, over] of [
    ["loja desconhecida", { store: "amazon" }],
    ["URL de outra loja", { sourceUrl: "https://www.pichau.com.br/p/1" }],
    ["URL sem HTTPS", { sourceUrl: "http://www.kabum.com.br/p/1" }],
    [
      "URL com credenciais",
      { sourceUrl: "https://user:pw@www.kabum.com.br/p/1" },
    ],
    [
      "data futura",
      { checkedAt: new Date(Date.now() + 3_600_000).toISOString() },
    ],
    ["data antes de 2000", { checkedAt: "1999-12-31T00:00:00.000Z" }],
    ["preço 0 (VL inferior - 1)", { priceCents: 0 }],
    ["preço acima de 1.000.000.000 (VL + 1)", { priceCents: 1_000_000_001 }],
    ["em estoque sem preço", { priceCents: null }],
  ])
    test(`rejeita ${label}`, () =>
      assert.throws(() => Offer.parseMany([offer(over)]), is400));

  for (const [label, over] of [
    ["preço 1 (VL inferior)", { priceCents: 1 }],
    ["preço 1.000.000.000 (VL superior)", { priceCents: 1_000_000_000 }],
    [
      "sem estoque e sem preço",
      { availability: "out_of_stock", priceCents: null },
    ],
    ["subdomínio da loja", { sourceUrl: "https://m.kabum.com.br/p/1" }],
  ])
    test(`aceita ${label}`, () =>
      assert.equal(Offer.parseMany([offer(over)]).length, 1));
});

describe("CT-UNI-08 pagination: limite 1..100 e cursor seguro", () => {
  for (const [label, query, ok] of [
    ["padrão sem parâmetros", {}, true],
    ['limit "0" (VL - 1)', { limit: "0" }, false],
    ['limit "1" (VL inferior)', { limit: "1" }, true],
    ['limit "100" (VL superior)', { limit: "100" }, true],
    ['limit "101" (VL + 1)', { limit: "101" }, false],
    ['limit "abc" (PE não numérica)', { limit: "abc" }, false],
    ['limit "-1"', { limit: "-1" }, false],
    ["limit repetido na URL (array)", { limit: ["1", "2"] }, false],
    ["cursor válido", { cursor: "abc_123-XYZ" }, true],
    ["cursor com caractere inválido", { cursor: "a/b" }, false],
    ["cursor com 129 caracteres", { cursor: "a".repeat(129) }, false],
  ])
    test(label, () => {
      if (ok) assert.ok(pagination(query).limit >= 1);
      else assert.throws(() => pagination(query), is400);
    });
  test("valor padrão é 20", () =>
    assert.deepEqual(pagination({}), { limit: 20, cursor: undefined }));
});
