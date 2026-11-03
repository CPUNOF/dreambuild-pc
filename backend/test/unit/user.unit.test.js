// CT-UNI-01 a CT-UNI-04 — Validação de cadastro (User.registration) e senha.
// Técnicas: partição de equivalência (PE) e análise de valor limite (VL).
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { User } from "../../src/models/User.js";
import { AppError } from "../../src/errors/AppError.js";

const valid = {
  name: "Ana Souza",
  email: "ana@dreambuild.test",
  password: "12345678",
};
const rejects = (input, message) =>
  assert.throws(
    () => User.registration(input),
    (error) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      message.test(error.message),
  );

describe("CT-UNI-01 nome: limites 2..80 após trim", () => {
  const cases = [
    ["vazio (PE inválida)", "", false],
    ["1 caractere (VL inferior - 1)", "A", false],
    ["2 caracteres (VL inferior)", "Al", true],
    ["80 caracteres (VL superior)", "a".repeat(80), true],
    ["81 caracteres (VL superior + 1)", "a".repeat(81), false],
    ["só espaços vira vazio", "     ", false],
    ["espaços nas pontas são removidos", "  Al  ", true],
    ["tipo não string (PE inválida)", 12345, false],
  ];
  for (const [label, name, ok] of cases)
    test(label, () => {
      if (ok)
        assert.equal(User.registration({ ...valid, name }).name, name.trim());
      else rejects({ ...valid, name }, /nome/);
    });
});

describe("CT-UNI-02 e-mail: formato e limite de 254", () => {
  const domain = "@dreambuild.test"; // 16 caracteres
  const cases = [
    ["formato válido", "ana@dreambuild.test", true],
    ["sem @ (PE inválida)", "ana.dreambuild.test", false],
    ["sem domínio de topo", "ana@dreambuild", false],
    ["com espaço interno", "ana souza@dreambuild.test", false],
    [
      "254 caracteres (VL superior)",
      "a".repeat(254 - domain.length) + domain,
      true,
    ],
    [
      "255 caracteres (VL superior + 1)",
      "a".repeat(255 - domain.length) + domain,
      false,
    ],
    ["não string", null, false],
  ];
  for (const [label, email, ok] of cases)
    test(label, () => {
      if (ok) assert.equal(User.registration({ ...valid, email }).email, email);
      else rejects({ ...valid, email }, /e-mail/);
    });

  test("e-mail é normalizado para minúsculas e sem espaços nas pontas", () => {
    assert.equal(
      User.registration({ ...valid, email: "  ANA@DreamBuild.TEST " }).email,
      "ana@dreambuild.test",
    );
  });
});

describe("CT-UNI-03 senha: limites 8..128", () => {
  const cases = [
    ["7 caracteres (VL inferior - 1)", "a".repeat(7), false],
    ["8 caracteres (VL inferior)", "a".repeat(8), true],
    ["128 caracteres (VL superior)", "a".repeat(128), true],
    ["129 caracteres (VL superior + 1)", "a".repeat(129), false],
    ["número em vez de texto (PE inválida)", 12345678, false],
    ["ausente", undefined, false],
  ];
  for (const [label, password, ok] of cases)
    test(label, () => {
      if (ok)
        assert.equal(
          User.registration({ ...valid, password }).password,
          password,
        );
      else rejects({ ...valid, password }, /senha/);
    });

  test("campos extras (ex.: role) não passam pela validação", () => {
    const result = User.registration({ ...valid, role: "ADMIN" });
    assert.deepEqual(Object.keys(result).sort(), ["email", "name", "password"]);
  });
});

describe("CT-UNI-04 hash de senha (scrypt)", () => {
  test("gera salts diferentes e só aceita a senha correta", async () => {
    const [a, b] = await Promise.all([
      User.hash("segredo-1"),
      User.hash("segredo-1"),
    ]);
    assert.match(a, /^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/);
    assert.notEqual(a, b);
    assert.equal(await User.verify("segredo-1", a), true);
    assert.equal(await User.verify("segredo-2", a), false);
  });

  test("hash malformado nunca é aceito", async () => {
    for (const hash of [
      undefined,
      "",
      "scrypt:abc:def",
      "md5:" + "a".repeat(32),
    ])
      assert.equal(await User.verify("qualquer", hash), false);
  });

  test("dados públicos não expõem hash nem UID do Google", () => {
    const pub = User.public({
      id: "1",
      name: "Ana",
      email: "a@b.co",
      role: "CLIENT",
      passwordHash: "scrypt:x",
      googleUid: "uid-secreto",
    });
    assert.equal(pub.passwordHash, undefined);
    assert.equal(pub.googleUid, undefined);
    assert.equal(pub.googleLinked, true);
    assert.equal(User.public(null), null);
  });
});
