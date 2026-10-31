import { useEffect, useState } from "react";
import { apiRequest } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
export default function GoogleLoginButton({ link = false, onSuccess }) {
  const auth = useAuth(),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    Promise.all([apiRequest("/auth/providers"), import("../auth/google.js")])
      .then(async ([data, module]) => {
        if (!data.google.enabled) return;
        await module.prepareGoogle(data.google.config);
        if (active) setReady(true);
      })
      .catch(() => {
        if (active)
          setError(
            "Não foi possível carregar o login Google. Tente recarregar a página.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  async function enter() {
    setBusy(true);
    setError(null);
    try {
      const module = await import("../auth/google.js"),
        idToken = await module.googleToken();
      await (link ? auth.linkGoogle(idToken) : auth.googleLogin(idToken));
      onSuccess?.();
    } catch (failure) {
      setError(
        failure.code === "auth/popup-closed-by-user"
          ? "A janela do Google foi fechada. Você pode tentar novamente."
          : failure.code === "auth/popup-blocked"
            ? "Permita a janela de login Google neste navegador e tente novamente."
            : failure.message || "Não foi possível entrar com Google.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="google-login">
      <button
        type="button"
        className="google-login-button"
        disabled={!ready || busy}
        onClick={enter}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            fill="#4285f4"
            d="M22 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.6a4.8 4.8 0 0 1-2.1 3.1v2.6H19c2-1.9 3-4.5 3-7.6Z"
          />
          <path
            fill="#34a853"
            d="M12 22c2.8 0 5.1-.9 6.8-2.5l-3.3-2.6c-.9.6-2.1.9-3.5.9-2.7 0-5-1.8-5.8-4.2H2.8v2.7A10 10 0 0 0 12 22Z"
          />
          <path
            fill="#fbbc05"
            d="M6.2 13.6a6 6 0 0 1 0-3.2V7.7H2.8a10 10 0 0 0 0 8.6Z"
          />
          <path
            fill="#ea4335"
            d="M12 6.2c1.5 0 2.8.5 3.8 1.5l3-3A10 10 0 0 0 2.8 7.7l3.4 2.7C7 8 9.3 6.2 12 6.2Z"
          />
        </svg>
        {busy
          ? "Conectando ao Google..."
          : link
            ? "Vincular Google à minha conta"
            : "Continuar com Google"}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
