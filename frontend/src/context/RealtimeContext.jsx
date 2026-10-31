import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";
import { getSession, clearCatalogCache } from "../api/client.js";
const RealtimeContext = createContext(null);
export const useRealtime = () => useContext(RealtimeContext);
export function RealtimeProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [catalogUpdate, setCatalogUpdate] = useState(null);
  useEffect(() => {
    let active = true;
    let connection;
    setConnected(false);
    setSocket(null);
    setError(null);
    if (user) {
      getSession()
        .then((session) => {
          if (!active) return;
          const configured = import.meta.env.VITE_API_URL;
          const origin = configured?.startsWith("http")
            ? new URL(configured).origin
            : undefined;
          connection = io(origin, {
            transports: ["websocket"],
            withCredentials: true,
            auth: { csrfToken: session.csrfToken },
            reconnectionAttempts: 4,
          });
          setSocket(connection);
          connection.on("connect", () => {
            setConnected(true);
            setError(null);
          });
          connection.on("disconnect", () => setConnected(false));
          connection.on("connect_error", () =>
            setError("A conexão em tempo real não está disponível."),
          );
          connection.on("catalog:updated", (update) => {
            clearCatalogCache();
            setCatalogUpdate(update);
          });
        })
        .catch(() => {
          if (active) setError("Não foi possível conectar a bancada.");
        });
    }
    return () => {
      active = false;
      if (connection) connection.disconnect();
    };
  }, [user?.id]);
  return (
    <RealtimeContext.Provider
      value={{
        socket,
        connected,
        error,
        catalogUpdate,
        clearCatalogUpdate: () => setCatalogUpdate(null),
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}
