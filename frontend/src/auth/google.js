import { initializeApp, getApps } from "@firebase/app";
import {
  getAuth,
  setPersistence,
  inMemoryPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "@firebase/auth";
let ready;
export function prepareGoogle(config) {
  ready ??= (async () => {
    const app =
      getApps().find((a) => a.name === "dreambuild-login") ||
      initializeApp(config, "dreambuild-login");
    const auth = getAuth(app);
    await setPersistence(auth, inMemoryPersistence);
    auth.languageCode = "pt-BR";
    return auth;
  })();
  return ready;
}
export async function googleToken() {
  const auth = await ready;
  if (!auth) throw Error("O login Google ainda está carregando.");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  try {
    return await result.user.getIdToken(true);
  } finally {
    await signOut(auth);
  }
}
