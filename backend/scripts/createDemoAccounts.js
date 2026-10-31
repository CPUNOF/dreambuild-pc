import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { writeFile, mkdir } from "node:fs/promises";
import { User } from "../src/models/User.js";
import { UserDAO } from "../src/dao/UserDAO.js";
import { getDatabase } from "../src/config/firebaseConfig.js";
const path = new URL("../.secrets/demo-accounts.json", import.meta.url);
try {
  if (existsSync(path)) {
    console.log(
      "O arquivo local das contas de demonstração já existe; preservado.",
    );
  } else {
    const dao = new UserDAO();
    const accounts = [];
    for (const [email, name, role] of [
      ["admin@dreambuild.demo", "Administrador de demonstração", "ADMIN"],
      ["cliente@dreambuild.demo", "Cliente de demonstração", "CLIENT"],
    ]) {
      if (await dao.findByEmail(email))
        throw new Error(
          "Conta já existente; nenhuma senha ou permissão será substituída.",
        );
      const password = randomBytes(12).toString("hex");
      await dao.create({
        email,
        name,
        role,
        passwordHash: await User.hash(password),
      });
      accounts.push({ email, password, role });
    }
    await mkdir(new URL("../.secrets/", import.meta.url), { recursive: true });
    await writeFile(path, JSON.stringify(accounts, null, 2) + "\n", {
      mode: 0o600,
      flag: "wx",
    });
    console.log(
      "Contas de demonstração criadas. Credenciais salvas somente em backend/.secrets/demo-accounts.json.",
    );
  }
} catch {
  console.error(
    "Não foi possível preparar as contas; cadastros existentes não foram alterados.",
  );
  process.exitCode = 1;
} finally {
  await getDatabase().terminate();
}
