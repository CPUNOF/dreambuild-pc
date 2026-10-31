import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { X, Globe, ShieldCheck } from "lucide-react";
import { apiRequest } from "../api/client.js";
import { money } from "../data/offers.js";
export default function PublicationDialog({ buildId, onClose }) {
  const dialog = useRef(null),
    navigate = useNavigate();
  const [preview, setPreview] = useState(null),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    [attempt, setAttempt] = useState(0),
    [consent, setConsent] = useState(false);
  useEffect(() => {
    const el = dialog.current,
      prior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    el.showModal();
    return () => {
      el.close();
      document.body.style.overflow = prior;
    };
  }, []);
  useEffect(() => {
    const c = new AbortController();
    setPreview(null);
    setConsent(false);
    apiRequest(`/community/preview/${buildId}`, { signal: c.signal })
      .then(setPreview)
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [buildId, attempt]);
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const record = await apiRequest("/community/builds", {
        method: "POST",
        body: {
          buildId,
          title: form.get("title"),
          nickname: form.get("nickname"),
          consent,
          previewHash: preview.previewHash,
        },
      });
      navigate(`/ranking/${record.id}`);
    } catch (e) {
      setError(e.message);
      if (e.status === 409) setAttempt((n) => n + 1);
    } finally {
      setBusy(false);
    }
  }
  const data = preview?.data;
  return (
    <dialog
      ref={dialog}
      className="publication-dialog"
      onCancel={busy ? (e) => e.preventDefault() : onClose}
      aria-labelledby="publish-title"
    >
      <header>
        <div>
          <p className="section-kicker">VOCÊ ESCOLHE O QUE COMPARTILHA</p>
          <h2 id="publish-title">
            <Globe size={22} /> Publicar meu PC
          </h2>
        </div>
        <button
          type="button"
          aria-label="Fechar publicação"
          disabled={busy}
          onClick={onClose}
        >
          <X />
        </button>
      </header>
      <p>
        Seu e-mail, conta e nome privado da montagem não aparecem. A publicação
        permanece pública até você retirá-la em Minhas publicações.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}{" "}
          {!preview && (
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setError(null);
                setAttempt((n) => n + 1);
              }}
            >
              Tentar novamente
            </button>
          )}
        </p>
      )}
      {!preview && !error && (
        <p role="status">Conferindo peças, cotações e referências...</p>
      )}
      {data && (
        <form onSubmit={submit}>
          <div className="publication-preview">
            <ShieldCheck size={22} />
            <div>
              <strong>{data.configuration.cpu}</strong>
              <p>
                {data.configuration.gpu} · {data.configuration.ram}
              </p>
              <b>
                {data.priceCents
                  ? money(data.priceCents)
                  : "Cotação incompleta"}
              </b>
              <small>
                PIX · frete não incluído · preços com data na ficha pública
              </small>
            </div>
          </div>
          <p>
            {data.performance["1080p"].rankEligible
              ? `Ranking de estimativas em ${data.gameCount} jogos, em 1080p e 1440p. Não são medições deste computador.`
              : "A montagem poderá aparecer na galeria. Sem dados suficientes do conjunto, ela não entra na classificação de FPS."}{" "}
            {!data.priceCents &&
              " Sem cotação de todas as peças, não participa do custo-benefício."}
          </p>
          <label className="field-label">
            Apelido público
            <input
              name="nickname"
              minLength={2}
              maxLength={30}
              required
              autoComplete="off"
              placeholder="Como quer aparecer?"
              disabled={busy}
            />
          </label>
          <label className="field-label">
            Nome público do PC
            <input
              name="title"
              minLength={2}
              maxLength={60}
              required
              autoComplete="off"
              placeholder="Dê um nome ao seu setup"
              disabled={busy}
            />
          </label>
          <label className="publication-consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              disabled={busy}
            />
            Autorizo publicar meu apelido, nome público do PC, peças e
            quantidades, cotações com fonte e data e resultados de
            referência/estimativa mostrados nesta prévia.
          </label>
          <button className="primary-button" disabled={busy || !consent}>
            {busy ? "Publicando..." : "Confirmar publicação"}
          </button>
        </form>
      )}
    </dialog>
  );
}
