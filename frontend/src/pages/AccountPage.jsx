import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { LockKeyhole, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import GoogleLoginButton from "../components/GoogleLoginButton.jsx";
import AddressBook from "../components/AddressBook.jsx";
import "../checkout.css";

export function AuthPage({ register = false }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const destination =
    typeof location.state?.from === "string" &&
    location.state.from.startsWith("/") &&
    !location.state.from.startsWith("//")
      ? location.state.from
      : "/conta";
  if (auth.user) return <Navigate to={destination} replace />;
  async function submit(event) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const input = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await (register ? auth.register(input) : auth.login(input));
      navigate(destination, { replace: true });
    } catch (failure) {
      setError(failure.message || "Não foi possível entrar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="account-page">
      <div className="account-intro">
        <LockKeyhole size={28} aria-hidden="true" />
        <p>MINHA CONTA</p>
        <h1>
          {register ? "Seu próximo PC começa aqui." : "Bom ter você de volta."}
        </h1>
        <p>
          Salve suas montagens e acompanhe suas compras simuladas em um só
          lugar.
        </p>
        <Link to="/">Voltar para a loja</Link>
      </div>
      <div className="account-form-panel">
        <h2>{register ? "Criar conta" : "Entrar na conta"}</h2>
        <p className="form-description">
          {register
            ? "Preencha seus dados para começar."
            : "Use o e-mail e a senha do seu cadastro."}
        </p>
        <form onSubmit={submit}>
          <GoogleLoginButton
            onSuccess={() => navigate(destination, { replace: true })}
          />
          <div className="auth-divider">
            <span />
            ou use seu cadastro
            <span />
          </div>
          {register && (
            <label>
              Nome
              <input
                name="name"
                autoComplete="name"
                minLength={2}
                maxLength={80}
                required
                disabled={busy}
              />
            </label>
          )}
          <label>
            E-mail
            <input
              type="email"
              name="email"
              autoComplete="email"
              maxLength={254}
              required
              disabled={busy}
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              name="password"
              autoComplete={register ? "new-password" : "current-password"}
              minLength={register ? 8 : undefined}
              maxLength={128}
              required
              disabled={busy}
            />
          </label>
          {register && (
            <p className="field-help">
              Use pelo menos 8 caracteres. Projeto acadêmico: prefira dados de
              demonstração.
            </p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="primary-button"
            type="submit"
            disabled={busy || auth.loading}
          >
            {busy ? "Aguarde..." : register ? "Criar minha conta" : "Entrar"}
          </button>
        </form>
        <p className="account-switch">
          {register ? "Já possui cadastro?" : "Primeira vez por aqui?"}{" "}
          <Link to={register ? "/entrar" : "/cadastro"} state={location.state}>
            {register ? "Entrar na conta" : "Crie sua conta"}
          </Link>
        </p>
      </div>
    </section>
  );
}

export function AccountPage() {
  const auth = useAuth();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  if (auth.loading)
    return <p className="catalog-load-state">Consultando sua conta...</p>;
  if (!auth.user)
    return <Navigate to="/entrar" state={{ from: "/conta" }} replace />;
  async function logout() {
    setBusy(true);
    try {
      await auth.logout();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="account-profile">
      <UserRound size={32} aria-hidden="true" />
      <p>MINHA CONTA</p>
      <h1>Olá, {auth.user.name}.</h1>
      <p>{auth.user.email}</p>
      <p className="profile-role">
        {auth.user.role === "ADMIN"
          ? "Perfil de administrador"
          : "Perfil de cliente"}
      </p>
      <p>Montagens e compras simuladas vinculadas a esta conta.</p>
      <section className="account-address-panel">
        <h2>Meus endereços</h2>
        <AddressBook manage />
      </section>
      {auth.user.googleLinked ? (
        <p className="google-linked">Google vinculado à sua conta.</p>
      ) : (
        <GoogleLoginButton link />
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="profile-actions">
        <Link className="primary-button" to="/montar">
          Montar meu PC
        </Link>
        <Link className="secondary-button" to="/minhas-montagens">
          Minhas montagens
        </Link>
        <Link className="secondary-button" to="/pedidos">
          Meus pedidos
        </Link>
        {auth.user.role === "ADMIN" && (
          <Link className="secondary-button" to="/admin">
            Administrar catálogo
          </Link>
        )}
        <button
          type="button"
          className="secondary-button"
          disabled={busy}
          onClick={logout}
        >
          {busy ? "Saindo..." : "Sair da conta"}
        </button>
      </div>
    </section>
  );
}
