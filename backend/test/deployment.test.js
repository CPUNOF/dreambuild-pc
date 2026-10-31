import assert from "node:assert/strict";
import { test } from "node:test";
import { generateKeyPairSync } from "node:crypto";
import { spawnSync } from "node:child_process";
import { getApps, deleteApp } from "firebase-admin/app";
import {
  getDatabase,
  FirebaseConfigurationError,
} from "../src/config/firebaseConfig.js";

test("Firebase Auth inicia mesmo quando o runtime não permite require de módulos ESM", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--no-experimental-require-module",
      "-e",
      "require('firebase-admin/auth')",
    ],
    { cwd: new URL("..", import.meta.url), encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
});

test("entrypoint da nuvem atende HTTP e restringe origens sem consultar o banco", async () => {
  const previous = {
    origin: process.env.FRONTEND_ORIGINS,
    domain: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  };
  let server;
  try {
    delete process.env.FRONTEND_ORIGINS;
    process.env.VERCEL_PROJECT_PRODUCTION_URL =
      "dreambuild-deployment-test.vercel.app";
    server = (await import("../../api/server.js")).default;
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = `http://127.0.0.1:${server.address().port}/api/health`;
    const ok = await fetch(address, {
      headers: { Origin: "https://dreambuild-deployment-test.vercel.app" },
    });
    assert.equal(ok.status, 200);
    assert.equal(
      ok.headers.get("access-control-allow-origin"),
      "https://dreambuild-deployment-test.vercel.app",
    );
    assert.equal((await ok.json()).data.service, "dreambuild-api");
    const denied = await fetch(address, {
      headers: { Origin: "https://unexpected.example" },
    });
    assert.equal(denied.headers.get("access-control-allow-origin"), null);
    assert.ok(server.io);
  } finally {
    if (server) await new Promise((resolve) => server.io.close(resolve));
    if (previous.origin === undefined) delete process.env.FRONTEND_ORIGINS;
    else process.env.FRONTEND_ORIGINS = previous.origin;
    if (previous.domain === undefined)
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    else process.env.VERCEL_PROJECT_PRODUCTION_URL = previous.domain;
  }
});

test("credencial por variável rejeita JSON inválido/projeto divergente sem expor seu conteúdo", () => {
  const old = {
    id: process.env.FIREBASE_PROJECT_ID,
    json: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    path: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  };
  try {
    process.env.FIREBASE_PROJECT_ID = "deployment-test";
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    for (const value of [
      "{invalido",
      JSON.stringify({ project_id: "outro-projeto", private_key: "nao-expor" }),
    ]) {
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON = value;
      assert.throws(
        () => getDatabase(),
        (error) =>
          error instanceof FirebaseConfigurationError &&
          !error.message.includes("nao-expor"),
      );
    }
  } finally {
    for (const [key, value] of Object.entries({
      FIREBASE_PROJECT_ID: old.id,
      FIREBASE_SERVICE_ACCOUNT_JSON: old.json,
      GOOGLE_APPLICATION_CREDENTIALS: old.path,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("configuração de nuvem inicializa Admin com credencial em memória, sem arquivo nem consulta ao banco", async () => {
  const previous = { ...process.env };
  try {
    const { privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    });
    process.env.FIREBASE_PROJECT_ID = "deployment-test";
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
      type: "service_account",
      project_id: "deployment-test",
      client_email: "test@deployment-test.iam.gserviceaccount.com",
      private_key: privateKey,
    });
    const db = getDatabase();
    assert.equal(db.projectId, "deployment-test");
    await db.terminate();
    await deleteApp(getApps().find((app) => app.name === "dreambuild-server"));
  } finally {
    for (const key of [
      "FIREBASE_PROJECT_ID",
      "FIREBASE_SERVICE_ACCOUNT_JSON",
      "GOOGLE_APPLICATION_CREDENTIALS",
    ]) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
