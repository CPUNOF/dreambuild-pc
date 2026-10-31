import { createContext, useContext, useEffect, useState, useRef } from "react";
import { apiRequest, getSession } from "../api/client.js";
import { Navigate, useLocation } from "react-router";
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function RequireUser({ children, role }) {
  const auth = useAuth();
  const location = useLocation();
  if (auth.loading)
    return <p className="catalog-load-state">Consultando sua sessão...</p>;
  if (!auth.user)
    return (
      <Navigate to="/entrar" state={{ from: location.pathname }} replace />
    );
  if (role && auth.user.role !== role)
    return (
      <section className="catalog-load-state">
        <h1>Acesso restrito</h1>
        <p>Esta área é exclusiva da administração.</p>
      </section>
    );
  return children;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const revision = useRef(0);
  const transitioning = useRef(false);
  useEffect(() => {
    let active = true;
    const startRevision = revision.current;
    getSession()
      .then((data) => {
        if (active && revision.current === startRevision) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    const refresh = () => {
      if (transitioning.current) return;
      const version = revision.current;
      getSession()
        .then((data) => {
          if (active && version === revision.current && !transitioning.current)
            setUser(data.user);
        })
        .catch(() => {});
    };
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
    };
  }, []);
  async function authenticate(path, input) {
    revision.current++;
    transitioning.current = true;
    try {
      const data = await apiRequest(path, { method: "POST", body: input });
      setUser(data.user);
      return data.user;
    } finally {
      transitioning.current = false;
    }
  }
  async function logout() {
    revision.current++;
    transitioning.current = true;
    try {
      await apiRequest("/auth/logout", { method: "POST" });
      setUser(null);
    } finally {
      transitioning.current = false;
    }
  }
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login: (input) => authenticate("/auth/login", input),
        register: (input) => authenticate("/auth/register", input),
        googleLogin: (idToken) => authenticate("/auth/google", { idToken }),
        linkGoogle: (idToken) => authenticate("/auth/google/link", { idToken }),
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
