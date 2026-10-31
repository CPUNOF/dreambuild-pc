import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { apiRequest } from "../api/client.js";
import { useAuth } from "./AuthContext.jsx";
const Context = createContext(null);
export const useCart = () => useContext(Context);
export function CartProvider({ children }) {
  const { user, loading } = useAuth();
  const [cart, setCart] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [toastError, setToastError] = useState(null),
    [notice, setNotice] = useState(null);
  const lock = useRef(false);
  const generation = useRef(0);
  async function refresh() {
    const version = ++generation.current;
    try {
      const result = await apiRequest("/cart");
      if (version === generation.current) {
        setCart(result);
        setError(null);
      }
      return result;
    } catch (failure) {
      if (version === generation.current) setError(failure.message);
      throw failure;
    }
  }
  useEffect(() => {
    if (!loading) {
      setCart(null);
      refresh().catch(() => {});
    }
    return () => {
      generation.current++;
    };
  }, [user?.id, loading]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5500);
    return () => clearTimeout(timer);
  }, [notice]);
  async function update(id, quantity) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    setToastError(null);
    const version = ++generation.current;
    setNotice(null);
    try {
      const result = await apiRequest("/cart/items/" + id, {
        method: quantity ? "PUT" : "DELETE",
        ...(quantity ? { body: { quantity } } : {}),
      });
      if (version === generation.current) {
        setCart(result);
        return result;
      }
    } catch (failure) {
      setError(failure.message);
      setToastError(failure.message);
      throw failure;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function add(product) {
    const current =
      cart?.items.find((item) => item.componentId === product.id)?.quantity ||
      0;
    if (current >= 10) {
      setError("O limite é de 10 unidades por modelo.");
      setToastError("O limite é de 10 unidades por modelo.");
      return;
    }
    const result = await update(product.id, current + 1);
    if (result) setNotice({ name: product.name, id: Date.now() });
  }
  return (
    <Context.Provider
      value={{
        cart,
        busy,
        error,
        refresh,
        update,
        add,
        dismissError: () => {
          setError(null);
          setToastError(null);
        },
      }}
    >
      {children}
      {toastError && (
        <aside className="cart-toast cart-toast-error" role="alert">
          <span>{toastError}</span>
          <button
            aria-label="Fechar erro do carrinho"
            onClick={() => {
              setError(null);
              setToastError(null);
            }}
          >
            ×
          </button>
        </aside>
      )}
      {notice && (
        <aside className="cart-toast" role="status">
          <span>
            <strong>Adicionado ao carrinho</strong>
            <small>{notice.name}</small>
          </span>
          <Link to="/carrinho" onClick={() => setNotice(null)}>
            Ver carrinho
          </Link>
          <button
            aria-label="Fechar aviso do carrinho"
            onClick={() => setNotice(null)}
          >
            ×
          </button>
        </aside>
      )}
    </Context.Provider>
  );
}
