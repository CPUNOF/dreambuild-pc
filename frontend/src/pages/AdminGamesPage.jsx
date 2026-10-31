import { useEffect, useState } from "react";
import { apiRequest, listRecords } from "../api/client.js";
import AdminNav from "../components/AdminNav.jsx";
const blank = {
  id: "",
  title: "",
  weight: "1",
  coverUrl: "",
  screenshotUrl: "",
  sourceUrl: "",
};
export default function AdminGamesPage() {
  const [games, setGames] = useState([]);
  const [editing, setEditing] = useState(undefined);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  async function refresh() {
    setGames(await listRecords("/games"));
  }
  useEffect(() => {
    let active = true;
    listRecords("/games")
      .then((items) => {
        if (active) setGames(items);
      })
      .catch((failure) => {
        if (active) setError(failure.message);
      });
    return () => {
      active = false;
    };
  }, []);
  function edit(game) {
    setEditing(game?.id || null);
    setForm(game ? { ...game, weight: String(game.weight) } : { ...blank });
    setError(null);
    setMessage(null);
  }
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const id =
        form.id ||
        form.title
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      await apiRequest(editing ? `/admin/games/${editing}` : "/admin/games", {
        method: editing ? "PUT" : "POST",
        body: { ...form, id, weight: Number(form.weight) },
      });
      await refresh();
      setEditing(undefined);
      setMessage(
        "Cenário salvo. Os parâmetros continuam identificados como didáticos.",
      );
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(game) {
    if (!window.confirm(`Remover o cenário ${game.title}?`)) return;
    setBusy(true);
    try {
      await apiRequest(`/admin/games/${game.id}`, { method: "DELETE" });
      await refresh();
      setMessage("Cenário removido.");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  const field = (label, key, type = "text") => (
    <label className="field-label">
      {label}
      <input
        type={type}
        value={form[key]}
        disabled={busy || (key === "id" && Boolean(editing))}
        required={key !== "id"}
        onChange={(event) =>
          setForm((current) => ({ ...current, [key]: event.target.value }))
        }
      />
    </label>
  );
  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading">
        <div>
          <p>ADMINISTRAÇÃO</p>
          <h1>Cenários da bancada</h1>
          <p>
            Imagens ilustrativas e pesos de um modelo didático, sem benchmark
            medido.
          </p>
        </div>
        {editing === undefined && (
          <button className="primary-button" onClick={() => edit(null)}>
            Novo cenário
          </button>
        )}
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="form-success" role="status">
          {message}
        </p>
      )}
      {editing !== undefined ? (
        <form className="admin-editor" onSubmit={submit}>
          <div className="admin-section-heading">
            <h2>{editing ? "Editar cenário" : "Cadastrar cenário"}</h2>
            <button
              type="button"
              className="secondary-button"
              disabled={busy}
              onClick={() => setEditing(undefined)}
            >
              Cancelar
            </button>
          </div>
          <div className="form-grid">
            {field("Nome do jogo", "title")}
            {field("Identificador (gerado pelo nome se vazio)", "id")}
            <label className="field-label">
              Peso didático (0,1 a 10)
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.01"
                required
                value={form.weight}
                disabled={busy}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    weight: event.target.value,
                  }))
                }
              />
            </label>
            {field("Fonte oficial ou página da editora", "sourceUrl", "url")}
            {field("Imagem da capa (URL ou /games/)", "coverUrl")}
            {field(
              "Imagem ilustrativa do cenário (URL ou /games/)",
              "screenshotUrl",
            )}
          </div>
          <p className="field-help">
            O peso modifica uma fórmula demonstrativa. Salvar não transforma
            este cenário em um resultado medido.
          </p>
          <button type="submit" className="primary-button" disabled={busy}>
            {busy ? "Salvando..." : "Salvar cenário"}
          </button>
        </form>
      ) : (
        <div className="admin-product-list">
          {games.map((game) => (
            <article key={game.id}>
              <img
                className="game-admin-cover"
                src={game.coverUrl}
                width={96}
                height={48}
                alt=""
              />
              <div>
                <h2>{game.title}</h2>
                <p>Peso: {game.weight} · não calibrado</p>
              </div>
              <div className="admin-row-actions">
                <button
                  className="secondary-button"
                  disabled={busy}
                  onClick={() => edit(game)}
                >
                  Editar
                </button>
                <button
                  className="text-button danger-text"
                  disabled={busy}
                  onClick={() => remove(game)}
                >
                  Remover
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
