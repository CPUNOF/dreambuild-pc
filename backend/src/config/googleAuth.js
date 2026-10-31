import { readFileSync } from "node:fs";
import { getAuth } from "firebase-admin/auth";
import { getApp } from "firebase-admin/app";
import { getDatabase } from "./firebaseConfig.js";
import { AppError } from "../errors/AppError.js";
export function googleWebConfiguration() {
  try {
    const data = JSON.parse(
      readFileSync(
        new URL("../../data/googleWebConfig.json", import.meta.url),
        "utf8",
      ),
    );
    return {
      enabled: data.enabled === true,
      config: {
        apiKey: data.config.apiKey,
        authDomain: data.config.authDomain,
        projectId: data.config.projectId,
        appId: data.config.appId,
      },
    };
  } catch {
    return { enabled: false };
  }
}
export async function verifyGoogleToken(idToken) {
  if (
    typeof idToken !== "string" ||
    idToken.length < 100 ||
    idToken.length > 15000
  )
    throw new AppError(400, "Conclua o login na janela do Google.");
  let claims;
  try {
    getDatabase();
    claims = await getAuth(getApp("dreambuild-server")).verifyIdToken(
      idToken,
      true,
    );
  } catch {
    throw new AppError(
      401,
      "O login Google expirou ou não pôde ser validado. Tente novamente.",
    );
  }
  return identityFromVerifiedGoogleClaims(claims);
}

// Recebe somente claims já verificados pelo Firebase Admin, nunca o corpo do POST.
export function identityFromVerifiedGoogleClaims(claims) {
  if (
    claims.firebase?.sign_in_provider !== "google.com" ||
    claims.email_verified !== true ||
    !claims.uid ||
    typeof claims.email !== "string"
  )
    throw new AppError(401, "Use uma conta Google com e-mail verificado.");
  const email = claims.email.trim().toLowerCase();
  return {
    uid: claims.uid,
    email,
    authoritativeEmail: /^[^@\s]+@gmail\.com$/.test(email),
    name:
      typeof claims.name === "string"
        ? claims.name.slice(0, 80)
        : "Cliente DreamBuild",
  };
}
