import { useEffect, useState } from "react";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { getHealth } from "../api/client.js";

export default function ServiceStatus() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState("checking");

  useEffect(() => {
    const controller = new AbortController();
    getHealth(controller.signal)
      .then(() => setState("online"))
      .catch(() => {
        if (!controller.signal.aborted) setState("offline");
      });
    return () => controller.abort();
  }, [attempt]);

  const checking = state === "checking";
  const online = state === "online";
  const Icon = online ? Wifi : checking ? RefreshCw : WifiOff;

  function retry() {
    setState("checking");
    setAttempt((value) => value + 1);
  }

  return (
    <div className={`service-status ${state}`}>
      <div role="status" className="flex items-center gap-2">
        <Icon size={16} aria-hidden="true" className={checking ? "spin" : ""} />
        <span>
          {checking
            ? "Verificando conexão…"
            : online
              ? "Serviço conectado"
              : "Serviço indisponível"}
        </span>
      </div>
      <button type="button" onClick={retry} disabled={checking}>
        {checking
          ? "Aguarde"
          : online
            ? "Verificar novamente"
            : "Tentar novamente"}
      </button>
      {!checking && !online && (
        <p>
          Não foi possível conectar. Confira se o servidor está ligado e tente
          novamente.
        </p>
      )}
    </div>
  );
}
