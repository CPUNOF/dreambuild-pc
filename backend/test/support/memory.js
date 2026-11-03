// Infraestrutura de teste: DAOs em memória com a mesma interface dos DAOs do
// Firestore. Permite exercitar Express + controllers + models + "banco" sem
// credenciais reais. Usada pelos testes de API/integração e pelo servidor E2E.
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import session from "express-session";
import { createApp } from "../../src/app.js";
import { User } from "../../src/models/User.js";
import { Component } from "../../src/models/Component.js";
import { Inventory } from "../../src/models/Inventory.js";
import { AppError } from "../../src/errors/AppError.js";

export const PASSWORD = "senha-de-teste-123";

const snapshot = JSON.parse(
  readFileSync(
    new URL("../../data/publicCatalogSnapshot.json", import.meta.url),
  ),
).items;

/** Subconjunto estável do catálogo real (1 em estoque e 1 sem oferta). */
export const FIXTURE_IDS = {
  cpuInStock: "kabum-102248",
  cpuNoOffer: "kabum-662405",
  gpu: "kabum-1000741",
  ram: "kabum-1029658",
  ssd: "kabum-105015",
};

export function catalog(ids = Object.values(FIXTURE_IDS)) {
  return ids.map((id) => {
    const product = structuredClone(snapshot.find((p) => p.id === id));
    // Saldo explicitamente fictício do cenário; ofertas externas não abastecem a loja.
    const price = product.offers?.find(
      (o) => o.availability === "in_stock" && o.paymentMethod === "pix",
    )?.priceCents;
    if (id !== FIXTURE_IDS.cpuNoOffer && price)
      product.inventory = {
        quantity: 100,
        unitPriceCents: price,
        version: 0,
        reorderPoint: 3,
        updatedAt: "2026-11-03T12:00:00.000Z",
      };
    return product;
  });
}

export function memoryInventory(components) {
  return {
    async list({ limit, cursor }, privateView = false) {
      const rows = [...components.data]
        .filter(([, p]) => p.inventory)
        .sort(([a], [b]) => a.localeCompare(b));
      const start = cursor ? rows.findIndex(([id]) => id === cursor) + 1 : 0;
      const selected = rows.slice(start, start + limit);
      return {
        items: selected.map(([id, p]) =>
          Inventory.view(id, p.inventory, privateView),
        ),
        nextCursor: start + limit < rows.length ? selected.at(-1)[0] : null,
      };
    },
    async detail(id) {
      if (!components.data.has(id))
        throw new AppError(404, "Produto inexistente.");
      return {
        inventory: Inventory.view(id, components.data.get(id).inventory, true),
        movements: [],
      };
    },
  };
}

export function memoryUsers(seed = []) {
  const data = new Map(seed.map((u) => [u.id, u]));
  return {
    data,
    async getById(id) {
      return data.get(id) || null;
    },
    async findByEmail(email) {
      return [...data.values()].find((u) => u.email === email) || null;
    },
    async create(input) {
      if (await this.findByEmail(input.email))
        throw new AppError(409, "Este e-mail já possui cadastro.");
      const user = { ...input, id: randomUUID() };
      data.set(user.id, user);
      return user;
    },
    async googleIdentity() {
      throw new AppError(
        503,
        "Login Google indisponível no ambiente de teste.",
      );
    },
  };
}

// Converte a ficha pública para o formato armazenado pelo ComponentDAO real
// (specifications como {label, value}, pois o Firestore não aceita array em array).
const toStored = ({ id, ...p }) => ({
  ...p,
  specifications: p.specifications.map(([label, value]) => ({ label, value })),
});

export function memoryComponents(items = catalog()) {
  const data = new Map(items.map((p) => [p.id, toStored(p)]));
  const toModel = (id, value) => new Component(id, value);
  return {
    data,
    async list({ limit, cursor, category }) {
      const all = [...data.entries()]
        .filter(([, p]) => !category || p.category === category)
        .map(([id, p]) => toModel(id, p));
      const start = cursor ? all.findIndex((p) => p.id === cursor) + 1 : 0;
      const items = all.slice(start, start + limit);
      const nextCursor = start + limit < all.length ? items.at(-1).id : null;
      return { items, nextCursor };
    },
    async getById(id) {
      return data.has(id) ? toModel(id, data.get(id)) : null;
    },
    async getMany(ids) {
      return ids.map((id) => (data.has(id) ? toModel(id, data.get(id)) : null));
    },
    async create(document) {
      if (data.has(document.slug))
        throw new AppError(409, "Já existe um produto com este endereço.");
      data.set(document.slug, document);
      return new Component(document.slug, document);
    },
    async update(id, document) {
      data.set(id, document);
      return new Component(id, document);
    },
    async delete(id) {
      data.delete(id);
    },
  };
}

export function memoryBuilds() {
  const data = new Map();
  return {
    data,
    async create(userId, document) {
      const value = {
        id: randomUUID(),
        userId,
        ...document,
        createdAt: new Date().toISOString(),
      };
      data.set(value.id, value);
      return value;
    },
    async getById(id) {
      return data.get(id) || null;
    },
    async listByUser(userId) {
      return {
        items: [...data.values()].filter((b) => b.userId === userId),
        nextCursor: null,
      };
    },
    async delete(id) {
      data.delete(id);
    },
  };
}

export function memoryOrders() {
  const data = new Map();
  const keys = new Map();
  return {
    data,
    async getById(id) {
      return data.get(id) || null;
    },
    async replay(userId, key, hash) {
      const existing = keys.get(`${userId}:${key}`);
      if (!existing) return null;
      if (existing.hash !== hash)
        throw new AppError(409, "Esta chave já foi usada com outros dados.");
      return data.get(existing.id);
    },
    async createIdempotent(userId, key, hash, document) {
      const previous = await this.replay(userId, key, hash);
      if (previous) return previous;
      const value = {
        id: randomUUID(),
        userId,
        ...document,
        createdAt: new Date().toISOString(),
      };
      data.set(value.id, value);
      keys.set(`${userId}:${key}`, { id: value.id, hash });
      return value;
    },
    async listByUser(userId) {
      return {
        items: [...data.values()].filter((o) => o.userId === userId),
        nextCursor: null,
      };
    },
  };
}

export function memoryGames(seed = []) {
  const data = new Map(seed.map((g) => [g.id, g]));
  return {
    data,
    async list({ limit, cursor }) {
      const all = [...data.values()];
      const start = cursor ? all.findIndex((g) => g.id === cursor) + 1 : 0;
      const items = all.slice(start, start + limit);
      return {
        items,
        nextCursor: start + limit < all.length ? items.at(-1).id : null,
      };
    },
    async getById(id) {
      return data.get(id) || null;
    },
    async create(game) {
      if (data.has(game.id))
        throw new AppError(409, "Já existe um cenário com este identificador.");
      data.set(game.id, game);
      return game;
    },
    async update(id, game) {
      data.set(id, game);
      return game;
    },
    async delete(id) {
      data.delete(id);
    },
  };
}

export async function seedUsers() {
  const passwordHash = await User.hash(PASSWORD);
  return [
    {
      id: "u-client",
      name: "Cliente Teste",
      email: "cliente@dreambuild.test",
      role: "CLIENT",
      passwordHash,
    },
    {
      id: "u-admin",
      name: "Admin Teste",
      email: "admin@dreambuild.test",
      role: "ADMIN",
      passwordHash,
    },
    {
      id: "u-disabled",
      name: "Conta Desativada",
      email: "desativada@dreambuild.test",
      role: "CLIENT",
      disabled: true,
      passwordHash,
    },
  ];
}

/** Cria o app Express real com todos os DAOs em memória. */
export async function memoryApp(options = {}) {
  const components = options.componentDAO || memoryComponents();
  const daos = {
    userDAO: memoryUsers(await seedUsers()),
    componentDAO: components,
    inventoryDAO: memoryInventory(components),
    buildDAO: memoryBuilds(),
    orderDAO: memoryOrders(),
    gameDAO: memoryGames(),
    metricsDAO: {
      async summary() {
        return {
          users: daos.userDAO.data.size,
          orders: daos.orderDAO.data.size,
        };
      },
    },
    ...options,
  };
  delete daos.authLimit;
  const app = createApp({
    origins: "http://127.0.0.1:5173,http://localhost:5173",
    sessionStore: new session.MemoryStore(),
    sessionSecret: "segredo-de-teste-com-mais-de-32-caracteres",
    // Limite alto por padrão: os testes compartilham o IP 127.0.0.1. O cenário
    // específico do limitador (CT-API-04) passa authLimit: 10.
    authLimit: options.authLimit ?? 1000,
    ...daos,
  });
  return { app, ...daos };
}

/** Sobe o app numa porta livre e entrega um cliente HTTP com cookies e CSRF. */
export async function startServer(options) {
  const context = await memoryApp(options);
  const server = context.app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    ...context,
    base,
    client: () => httpClient(base),
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

export function httpClient(base) {
  const cookies = new Map();
  let csrf = "";
  async function request(path, { method = "GET", body, csrfToken } = {}) {
    const token = csrfToken === undefined ? csrf : csrfToken;
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(cookies.size
          ? { Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; ") }
          : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token && method !== "GET" ? { "X-CSRF-Token": token } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    for (const entry of response.headers.getSetCookie()) {
      const pair = entry.split(";")[0];
      const index = pair.indexOf("=");
      cookies.set(pair.slice(0, index), pair.slice(index + 1));
    }
    const json = await response.json().catch(() => null);
    if (json?.data && Object.hasOwn(json.data, "csrfToken"))
      csrf = json.data.csrfToken;
    return { status: response.status, body: json, headers: response.headers };
  }
  return {
    request,
    get: (path) => request(path),
    post: (path, body, opts) =>
      request(path, { method: "POST", body, ...opts }),
    put: (path, body, opts) => request(path, { method: "PUT", body, ...opts }),
    patch: (path, body) => request(path, { method: "PATCH", body }),
    delete: (path, opts) => request(path, { method: "DELETE", ...opts }),
    async login(email, password = PASSWORD) {
      await request("/api/auth/session");
      return request("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
    },
  };
}
