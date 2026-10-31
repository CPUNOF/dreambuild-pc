import { useEffect, useState } from "react";
import { Link } from "react-router";
import { apiRequest, listRecords } from "../api/client.js";
import { money } from "../data/offers.js";
import PublicationDialog from "../components/PublicationDialog.jsx";
export default function MyBuildsPage() {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(null);
  const [publishing, setPublishing] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    listRecords("/builds/my", controller.signal)
      .then(setBuilds)
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);
  async function remove(build) {
    if (
      !window.confirm(
        `Remover a montagem “${build.name}”? Pedidos já gerados permanecerão no histórico.`,
      )
    )
      return;
    setBusy(build.id);
    try {
      await apiRequest(`/builds/${build.id}`, { method: "DELETE" });
      setBuilds((current) => current.filter((item) => item.id !== build.id));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(null);
    }
  }
  return (
    <section className="records-page">
      {publishing && (
        <PublicationDialog
          buildId={publishing}
          onClose={() => setPublishing(null)}
        />
      )}
      <div className="page-heading">
        <div>
          <p>MINHA CONTA</p>
          <h1>Minhas montagens</h1>
          <p>Seus projetos ficam guardados para continuar depois.</p>
        </div>
        <Link className="primary-button" to="/montar">
          Nova montagem
        </Link>
      </div>
      {error && (
        <div className="form-error" role="alert">
          {error}
          <button
            className="text-button"
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Tentar novamente
          </button>
        </div>
      )}
      <p className="community-account-links">
        <Link to="/ranking">Ranking público</Link> ·{" "}
        <Link to="/minhas-publicacoes">Minhas publicações</Link>
      </p>
      {loading ? (
        <p role="status">Carregando montagens...</p>
      ) : builds.length ? (
        <div className="saved-build-list">
          {builds.map((build) => (
            <article key={build.id}>
              <div className="saved-build-images">
                {build.parts.slice(0, 4).map((part) => (
                  <img
                    key={part.id}
                    src={part.image}
                    alt=""
                    width={64}
                    height={64}
                  />
                ))}
              </div>
              <div className="saved-build-content">
                <span>
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                  }).format(new Date(build.createdAt))}
                </span>
                <h2>{build.name}</h2>
                <p>
                  {build.itemCount ?? build.parts.length} unidade(s) ·{" "}
                  {build.compatible
                    ? "Critérios verificados na gravação"
                    : "Em andamento ou com pendências"}
                </p>
                <strong>
                  {build.comparison.optimized.complete
                    ? money(build.comparison.optimized.totalCents)
                    : "Total sem cotação completa"}
                </strong>
                <div className="saved-build-actions">
                  {build.compatible && (
                    <>
                      <button
                        type="button"
                        className="primary-button"
                        disabled={busy === build.id}
                        onClick={() => setPublishing(build.id)}
                      >
                        Publicar meu PC
                      </button>
                      <Link
                        className="secondary-button"
                        to={`/bancada/${build.id}`}
                      >
                        Ver FPS nos jogos
                      </Link>
                    </>
                  )}
                  <Link
                    className="secondary-button"
                    to={`/montar?build=${build.id}`}
                  >
                    Abrir no montador
                  </Link>
                  {build.compatible && (
                    <Link
                      className="secondary-button"
                      to={`/finalizar/${build.id}`}
                    >
                      Compra simulada
                    </Link>
                  )}
                  <button
                    className="text-button danger-text"
                    type="button"
                    disabled={busy === build.id}
                    onClick={() => remove(build)}
                  >
                    Remover
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Seu primeiro PC salvo vem aí.</h2>
          <p>Escolha as peças no montador e salve com um nome.</p>
          <Link className="primary-button" to="/montar">
            Começar montagem
          </Link>
        </div>
      )}
    </section>
  );
}
