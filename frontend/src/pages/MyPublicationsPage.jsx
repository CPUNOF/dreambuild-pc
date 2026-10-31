import { useEffect, useState } from "react";
import { Link } from "react-router";
import { apiRequest, listRecords } from "../api/client.js";
export default function MyPublicationsPage() {
  const [items, setItems] = useState(null),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(null),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setError(null);
    listRecords("/community/my", c.signal)
      .then(setItems)
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [attempt]);
  async function remove(item) {
    if (
      !confirm(
        `Retirar “${item.title}” do ranking e da galeria? Sua montagem privada será preservada.`,
      )
    )
      return;
    setBusy(item.id);
    setError(null);
    try {
      await apiRequest(`/community/builds/${item.id}`, { method: "DELETE" });
      setItems((old) => old.filter((t) => t.id !== item.id));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }
  return (
    <section className="records-page">
      <div className="page-heading">
        <div>
          <p>MINHA CONTA</p>
          <h1>Minhas publicações</h1>
          <p>Você decide quando retirar um PC da comunidade.</p>
        </div>
        <Link className="primary-button" to="/minhas-montagens">
          Publicar outra montagem
        </Link>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
          <button
            className="text-button"
            onClick={() => setAttempt((n) => n + 1)}
          >
            Tentar novamente
          </button>
        </p>
      )}
      {!items && !error ? (
        <p role="status">Carregando publicações...</p>
      ) : items?.length ? (
        <div className="my-publications">
          {items.map((item) => (
            <article key={item.id}>
              <img src={item.image} alt="" width={85} height={85} />
              <div>
                <h2>
                  <Link to={`/ranking/${item.id}`}>{item.title}</Link>
                </h2>
                <p>Apelido público: {item.nickname}</p>
                <p>
                  {item.configuration.cpu} · {item.configuration.gpu}
                </p>
              </div>
              <button
                className="secondary-button"
                disabled={busy === item.id}
                onClick={() => remove(item)}
              >
                {busy === item.id ? "Retirando..." : "Retirar publicação"}
              </button>
            </article>
          ))}
        </div>
      ) : (
        !error && (
          <div className="empty-state">
            <h2>Você ainda não publicou um PC.</h2>
            <p>
              Suas montagens permanecem privadas até você confirmar uma
              publicação.
            </p>
            <Link className="primary-button" to="/minhas-montagens">
              Ver minhas montagens
            </Link>
          </div>
        )
      )}
    </section>
  );
}
