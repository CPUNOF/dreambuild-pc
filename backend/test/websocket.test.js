import assert from "node:assert/strict";
import { test } from "node:test";
import session from "express-session";
import { io } from "socket.io-client";
import { createApp } from "../src/app.js";
import { createHttpServer } from "../src/httpServer.js";
import { User } from "../src/models/User.js";
import { Build } from "../src/models/Build.js";
import { Simulation } from "../src/models/Simulation.js";
import { products } from "../../frontend/src/data/products.js";
import { hardwareFacts } from "../data/hardwareFacts.js";
const parts = () =>
  products.map((part) => ({ ...part, hardware: hardwareFacts[part.id] }));
const partIds = Object.fromEntries(
  products.map((part) => [part.category, part.id]),
);

test("modelo é sintético, previsível, muda com resolução e apresenta alerta didático", () => {
  const analysis = Build.analyze(partIds, parts());
  const game = { id: "exemplo", title: "Cenário", weight: 1 };
  const setup = Simulation.setup(analysis, game, {
    resolution: "1080p",
    overclock: false,
    restrictedCooling: false,
  });
  assert.equal(setup.calibrated, false);
  assert.equal(setup.baseFps, 100);
  assert.deepEqual(Simulation.sample(setup, 20), Simulation.sample(setup, 20));
  assert.ok(
    Simulation.setup(analysis, game, {
      resolution: "4K",
      overclock: false,
      restrictedCooling: false,
    }).baseFps < setup.baseFps,
  );
  assert.equal(
    Simulation.sample(
      { ...setup, overclock: true, restrictedCooling: true },
      200,
    ).throttling,
    true,
  );
  assert.throws(() =>
    Simulation.setup(analysis, game, {
      resolution: "outro",
      overclock: false,
      restrictedCooling: false,
    }),
  );
});

test(
  "WebSocket verifica origem, CSRF/sessão e dono; dados privados param no stop e logout",
  { timeout: 15000 },
  async () => {
    const password = "senha-do-teste-ws";
    const hash = await User.hash(password);
    const users = [
      {
        id: "a",
        name: "A",
        email: "a@example.test",
        role: "CLIENT",
        passwordHash: hash,
      },
      {
        id: "b",
        name: "B",
        email: "b@example.test",
        role: "CLIENT",
        passwordHash: hash,
      },
    ];
    const game = { id: "game", title: "Jogo didático", weight: 1 };
    const build = {
      id: "own-build",
      userId: "a",
      partIds,
      comparison: { paymentMethod: "pix" },
    };
    const app = createApp({
      origins: "http://localhost:5173",
      sessionStore: new session.MemoryStore(),
      userDAO: {
        async getById(id) {
          return users.find((user) => user.id === id);
        },
        async findByEmail(email) {
          return users.find((user) => user.email === email);
        },
      },
      componentDAO: {
        async getMany(ids) {
          return ids.map((id) => parts().find((part) => part.id === id));
        },
      },
      buildDAO: {
        async getById(id) {
          return id === build.id ? build : null;
        },
      },
      gameDAO: {
        async getById(id) {
          return id === game.id ? game : null;
        },
      },
    });
    const server = createHttpServer(app).listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const sockets = [];
    async function login(email) {
      let cookie = "";
      const cookies = new Map();
      let csrf;
      async function request(path, body) {
        const response = await fetch(base + path, {
          method: body ? "POST" : "GET",
          headers: {
            Cookie: cookie,
            ...(body
              ? { "Content-Type": "application/json", "X-CSRF-Token": csrf }
              : {}),
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
        for (const entry of response.headers.getSetCookie()) {
          const value = entry.split(";")[0];
          const index = value.indexOf("=");
          cookies.set(value.slice(0, index), value.slice(index + 1));
        }
        cookie = [...cookies]
          .map(([key, value]) => `${key}=${value}`)
          .join("; ");
        const value = await response.json();
        if (value.data?.csrfToken) csrf = value.data.csrfToken;
        return response.status;
      }
      await request("/api/auth/session");
      await request("/api/auth/login", { email, password });
      return {
        get cookie() {
          return cookie;
        },
        get csrf() {
          return csrf;
        },
        logout: () => request("/api/auth/logout", {}),
      };
    }
    async function connect(account, origin = "http://localhost:5173") {
      const socket = io(base, {
        transports: ["websocket"],
        reconnection: false,
        autoConnect: false,
        extraHeaders: {
          Origin: origin,
          ...(account ? { Cookie: account.cookie } : {}),
        },
        auth: { csrfToken: account?.csrf },
      });
      sockets.push(socket);
      await new Promise((resolve, reject) => {
        socket.once("connect", resolve);
        socket.once("connect_error", reject);
        socket.connect();
      });
      return socket;
    }
    const command = (socket, event, input) =>
      new Promise((resolve, reject) => {
        if (input === undefined)
          socket
            .timeout(3000)
            .emit(event, (error, value) =>
              error ? reject(error) : resolve(value),
            );
        else
          socket
            .timeout(3000)
            .emit(event, input, (error, value) =>
              error ? reject(error) : resolve(value),
            );
      });
    const sample = (socket) =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          socket.off("bench:sample", handler);
          reject(new Error("Amostra não recebida."));
        }, 3000);
        const handler = (value) => {
          if (value.sequence >= 1) {
            clearTimeout(timer);
            socket.off("bench:sample", handler);
            resolve(value);
          }
        };
        socket.on("bench:sample", handler);
      });
    try {
      const a = await login("a@example.test"),
        b = await login("b@example.test");
      await assert.rejects(() => connect(null));
      await assert.rejects(() => connect(a, "https://origem-invalida.test"));
      await assert.rejects(() =>
        connect({ cookie: a.cookie, csrf: "incorreto" }),
      );
      const one = await connect(a),
        other = await connect(b);
      let privateCount = 0,
        foreignCount = 0;
      one.on("bench:sample", () => privateCount++);
      other.on("bench:sample", () => foreignCount++);
      const input = {
        buildId: "own-build",
        gameId: "game",
        resolution: "1440p",
        overclock: false,
        restrictedCooling: false,
      };
      assert.equal((await command(other, "bench:start", input)).code, 404);
      const received = sample(one);
      assert.equal(
        (await command(one, "bench:start", input)).status,
        "success",
      );
      const packet = await received;
      assert.equal(packet.simulated, true);
      assert.equal(foreignCount, 0);
      assert.equal(app.locals.activeTests(), 1);
      await command(one, "bench:stop");
      const afterStop = privateCount;
      await new Promise((resolve) => setTimeout(resolve, 700));
      assert.equal(privateCount, afterStop);
      assert.equal(app.locals.activeTests(), 0);
      await command(one, "bench:start", input);
      const disconnected = new Promise((resolve) =>
        one.once("disconnect", resolve),
      );
      assert.equal(await a.logout(), 200);
      await disconnected;
      assert.equal(app.locals.activeTests(), 0);
      assert.equal(other.connected, true);
      assert.equal(foreignCount, 0);
      let publicUpdate;
      other.once("catalog:updated", (value) => {
        publicUpdate = value;
      });
      app.locals.events.emit("catalog-update", {
        componentId: "ryzen",
        updatedAt: "exemplo",
      });
      await new Promise((resolve) => setTimeout(resolve, 50));
      assert.equal(publicUpdate.componentId, "ryzen");
      assert.equal(publicUpdate.userId, undefined);
    } finally {
      sockets.forEach((socket) => socket.disconnect());
      await new Promise((resolve) => server.io.close(resolve));
    }
  },
);
