import { useState } from "react";
import { Link } from "react-router";
import { apiRequest } from "../api/client.js";
export default function UpgradeSuggestion({ build }) {
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  async function check() {
    setBusy(true);
    setError(null);
    try {
      setResult(
        await apiRequest("/builds/upgrade", {
          method: "POST",
          body: {
            partIds: build.partIds,
            quantities: build.quantities,
            storageIds: build.storageIds,
            paymentMethod: build.comparison?.paymentMethod || "pix",
          },
        }),
      );
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="upgrade-suggestion">
      <h2>Alternativa no modelo didático</h2>
      <p>
        A consulta procura uma CPU ou GPU com índice superior e repete as
        verificações automáticas de compatibilidade.
      </p>
      <button
        className="secondary-button"
        disabled={busy || !build}
        onClick={check}
      >
        {busy ? "Consultando..." : "Consultar alternativa"}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {result && (
        <div role="status">
          <p>{result.message}</p>
          {result.candidate && (
            <p>
              <Link to={`/produto/${result.candidate.slug}`}>
                {result.candidate.name}
              </Link>{" "}
              · índice {result.currentScore} → {result.candidateScore}
            </p>
          )}
          <small>{result.disclaimer}</small>
        </div>
      )}
    </section>
  );
}
