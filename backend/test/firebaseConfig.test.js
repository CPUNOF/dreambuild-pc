import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  unlinkSync,
  rmdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  getDatabase,
  FirebaseConfigurationError,
} from "../src/config/firebaseConfig.js";

test("configuração rejeita pasta, arquivo ausente e JSON inválido antes de conectar", () => {
  const originalId = process.env.FIREBASE_PROJECT_ID;
  const originalPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const directory = mkdtempSync(join(tmpdir(), "dreambuild-config-"));
  const folder = join(directory, "pasta.json");
  const invalidFile = join(directory, "invalido.json");
  mkdirSync(folder);
  writeFileSync(invalidFile, '{"type":"service_account"}');
  try {
    process.env.FIREBASE_PROJECT_ID = "dreambuild-config-test";
    for (const path of [folder, join(directory, "ausente.json"), invalidFile]) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = path;
      assert.throws(() => getDatabase(), FirebaseConfigurationError);
    }
  } finally {
    if (originalId === undefined) delete process.env.FIREBASE_PROJECT_ID;
    else process.env.FIREBASE_PROJECT_ID = originalId;
    if (originalPath === undefined)
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    else process.env.GOOGLE_APPLICATION_CREDENTIALS = originalPath;
    unlinkSync(invalidFile);
    rmdirSync(folder);
    rmdirSync(directory);
  }
});
