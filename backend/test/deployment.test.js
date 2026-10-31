import assert from "node:assert/strict";
import { test } from "node:test";
import { generateKeyPairSync } from "node:crypto";
import { getApps, deleteApp } from "firebase-admin/app";
import {
  getDatabase,
  FirebaseConfigurationError,
} from "../src/config/firebaseConfig.js";

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
