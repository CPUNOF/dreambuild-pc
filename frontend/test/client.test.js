// CT-UNI-11 / CT-UNI-12 — Cliente HTTP do front-end (src/api/client.js):
// paginação do catálogo, cache, CSRF e tratamento de erros da API.
import { beforeEach, describe, expect, test, vi } from "vitest";

const json = (body, status = 200) =>
  Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
const page = (data, nextCursor = null, meta = {}) =>
  json({ status: "success", data, errors: [], meta: { nextCursor, ...meta } });
const catalogCalls = (mock) =>
  mock.mock.calls.filter(([url]) => url.startsWith("/api/components"));

let client;
beforeEach(async () => {
  vi.resetModules(); // zera o token CSRF guardado no módulo
  client = await import("../src/api/client.js");
});

describe("CT-UNI-11 getCatalog", () => {
  test("segue os cursores até o fim e ordena por displayOrder", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => page([{ id: "b", displayOrder: 2 }], "c1"))
      .mockImplementationOnce(() =>
        page([{ id: "a", displayOrder: 1 }, { id: "z" }]),
      );
    const items = await client.getCatalog(new AbortController().signal);
    expect(items.map((p) => p.id)).toEqual(["a", "b", "z"]);
    expect(catalogCalls(fetch)).toHaveLength(2);
    expect(fetch.mock.calls[1][0]).toContain("cursor=c1");
  });

  test("usa o cache da sessão na segunda chamada e ignora com force", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(() => page([{ id: "a" }]));
    const signal = new AbortController().signal;
    await client.getCatalog(signal);
    await client.getCatalog(signal);
    expect(catalogCalls(fetch)).toHaveLength(1);
    await client.getCatalog(signal, { force: true });
    expect(catalogCalls(fetch)).toHaveLength(2);
    expect(
      fetch.mock.calls.filter(([url]) => url.startsWith("/api/inventory")),
    ).toHaveLength(3);
  });

  test("cache com mais de 5 minutos é descartado", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(() => page([{ id: "a" }]));
    const now = vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    await client.getCatalog(new AbortController().signal);
    now.mockReturnValue(1_000_000 + 5 * 60 * 1000); // exatamente 5 min (VL)
    await client.getCatalog(new AbortController().signal);
    expect(catalogCalls(fetch)).toHaveLength(2);
  });

  test("marca localSnapshot quando a API usa a cópia local", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      page([{ id: "a" }], null, { source: "curated-local" }),
    );
    const items = await client.getCatalog(new AbortController().signal);
    expect(items.localSnapshot).toBe(true);
  });

  test("cursor repetido interrompe a consulta (evita laço infinito)", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      page([{ id: "a" }], "mesmo"),
    );
    await expect(
      client.getCatalog(new AbortController().signal),
    ).rejects.toThrow(/completar a consulta/);
  });

  test.each([
    ["HTTP 503", () => json({ status: "error" }, 503)],
    [
      "data que não é lista",
      () => json({ status: "success", data: {}, meta: { nextCursor: null } }),
    ],
    ["meta ausente", () => json({ status: "success", data: [] })],
  ])("rejeita resposta inválida: %s", async (_l, reply) => {
    vi.spyOn(globalThis, "fetch").mockImplementation(reply);
    await expect(
      client.getCatalog(new AbortController().signal),
    ).rejects.toThrow();
  });
});

describe("CT-UNI-12 apiRequest", () => {
  const session = (token = "t1") =>
    json({
      status: "success",
      data: { user: null, csrfToken: token },
      errors: [],
      meta: {},
    });

  test("mutação busca a sessão antes e envia X-CSRF-Token", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => session("t1"))
      .mockImplementationOnce(() =>
        json({ status: "success", data: { ok: true } }),
      );
    await client.apiRequest("/cart/items/x", {
      method: "PUT",
      body: { quantity: 1 },
    });
    expect(fetch.mock.calls[0][0]).toBe("/api/auth/session");
    const [, options] = fetch.mock.calls[1];
    expect(options.headers["X-CSRF-Token"]).toBe("t1");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.credentials).toBe("include");
  });

  test("CSRF_INVALID renova o token e repete uma única vez", async () => {
    const csrfError = () =>
      json(
        {
          status: "error",
          message: "Atualize",
          errors: [{ code: "CSRF_INVALID" }],
        },
        403,
      );
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => session("velho"))
      .mockImplementationOnce(csrfError)
      .mockImplementationOnce(() => session("novo"))
      .mockImplementationOnce(csrfError);
    await expect(
      client.apiRequest("/auth/logout", { method: "POST" }),
    ).rejects.toMatchObject({
      status: 403,
    });
    expect(fetch).toHaveBeenCalledTimes(4);
    expect(fetch.mock.calls[3][1].headers["X-CSRF-Token"]).toBe("novo");
  });

  test("erro da API vira ApiError com status, mensagem e erros", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      json(
        {
          status: "error",
          message: "Produto não encontrado.",
          errors: [{ field: "id" }],
        },
        404,
      ),
    );
    const error = await client.apiRequest("/components/x").catch((e) => e);
    expect(error).toBeInstanceOf(client.ApiError);
    expect(error).toMatchObject({
      status: 404,
      message: "Produto não encontrado.",
      errors: [{ field: "id" }],
    });
  });

  test("resposta que não é JSON gera mensagem amigável", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<html>502</html>", { status: 502 }),
    );
    await expect(client.apiRequest("/health")).rejects.toMatchObject({
      status: 502,
      message: "O servidor não respondeu como esperado.",
    });
  });

  test("getHealth rejeita resposta de outro serviço", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      json({ status: "success", data: { service: "outro" } }),
    );
    await expect(
      client.getHealth(new AbortController().signal),
    ).rejects.toThrow(/não pertence/);
  });
});
