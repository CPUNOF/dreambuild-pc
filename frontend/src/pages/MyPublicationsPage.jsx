import { useEffect, useState } from "react";
import { Link } from "react-router";
import { apiRequest, listRecords } from "../api/client.js";
import AdminNav from "../components/AdminNav.jsx";
export default function MyPublicationsPage({ demoAdmin = false }) {
  const [items, setItems] = useState(null),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(null),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setError(null);
    setItems(null);
    listRecords(
      demoAdmin ? "/admin/community/demos" : "/community/my",
      c.signal,
    )
      .then((data) => {
        if (!c.signal.aborted) setItems(data);
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [attempt, demoAdmin]);
  async function remove(item) {
    if (
      !confirm(
        `Retirar “${item.title}” do ranking e da galeria? ${demoAdmin ? "Somente este exemplo será removido. Montagens dos usuários serão preservadas." : "Sua montagem privada será preservada."}`,
      )
    )
      return;
    setBusy(item.id);
    setError(null);
    try {
      await apiRequest(
        demoAdmin
          ? `/admin/community/demos/${item.id}`
          : `/community/builds/${item.id}`,
        { method: "DELETE" },
      );
      setItems((old) => old.filter((t) => t.id !== item.id));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }
  return (
    <section className="records-page">
      {demoAdmin && <AdminNav />}
      <div className="page-heading">
        <div>
          <p>{demoAdmin ? "ADMINISTRAÇÃO / COMUNIDADE" : "MINHA CONTA"}</p>
          <h1>{demoAdmin ? "PCs de demonstração" : "Minhas publicações"}</h1>
          <p>
            {demoAdmin
              ? "Remova os exemplos que não quiser manter na galeria e nos rankings. Publicações dos usuários não aparecem nesta lista."
              : "Você decide quando retirar um PC da comunidade."}
          </p>
        </div>
        <Link
          className="primary-button"
          to={demoAdmin ? "/ranking" : "/minhas-montagens"}
        >
          {demoAdmin ? "Ver comunidade" : "Publicar outra montagem"}
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
                disabled={busy !== null}
                onClick={() => remove(item)}
              >
                {busy === item.id
                  ? "Retirando..."
                  : demoAdmin
                    ? "Remover demonstração"
                    : "Retirar publicação"}
              </button>
            </article>
          ))}
        </div>
      ) : (
        !error && (
          <div className="empty-state">
            <h2>
              {demoAdmin
                ? "Nenhum PC de demonstração cadastrado."
                : "Você ainda não publicou um PC."}
            </h2>
            <p>
              {demoAdmin
                ? "As publicações dos usuários continuam disponíveis na comunidade."
                : "Suas montagens permanecem privadas até você confirmar uma publicação."}
            </p>
            <Link
              className="primary-button"
              to={demoAdmin ? "/ranking" : "/minhas-montagens"}
            >
              {demoAdmin ? "Ver comunidade" : "Ver minhas montagens"}
            </Link>
          </div>
        )
      )}
    </section>
  );
}
