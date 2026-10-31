import { statSync } from "node:fs";
import { isAbsolute } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export class FirebaseConfigurationError extends Error {}

// Inicialização sob demanda: a API de saúde continua funcionando sem o banco.
export function getDatabase() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  const credentialJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!projectId || (!credentialPath && !credentialJson)) {
    throw new FirebaseConfigurationError(
      "Configure FIREBASE_PROJECT_ID e uma credencial de serviço no ambiente do backend.",
    );
  }
  let isFile = false;
  try {
    isFile =
      !!credentialPath &&
      isAbsolute(credentialPath) &&
      statSync(credentialPath).isFile();
  } catch {
    /* Arquivo ausente ou sem permissão de leitura. */
  }
  if (!credentialJson && !isFile) {
    throw new FirebaseConfigurationError(
      "O caminho das credenciais deve ser absoluto e apontar para o JSON salvo no computador.",
    );
  }
  let credential;
  try {
    const source = credentialJson ? JSON.parse(credentialJson) : credentialPath;
    if (credentialJson && source.project_id !== projectId)
      throw new Error("Projeto divergente");
    credential = cert(source);
  } catch {
    throw new FirebaseConfigurationError(
      "O arquivo precisa ser o JSON de conta de serviço baixado do Firebase, com uma chave privada válida.",
    );
  }
  const name = "dreambuild-server";
  const app =
    getApps().find((candidate) => candidate.name === name) ||
    initializeApp({ projectId, credential }, name);
  if (app.options.projectId !== projectId) {
    throw new FirebaseConfigurationError(
      "O projeto mudou. Reinicie o servidor antes de continuar.",
    );
  }
  return getFirestore(app);
}
