import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Check } from "lucide-react";
import { apiRequest } from "../api/client.js";
import { money } from "../data/offers.js";
import { usePurchaseJourney } from "../components/PurchaseJourney.jsx";
import DreamCard from "../components/DreamCard.jsx";
export default function CheckoutPage() {
  const { buildId } = useParams();
  const journey = usePurchaseJourney();
  const [build, setBuild] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [key] = useState(() => crypto.randomUUID());
  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const saved = await apiRequest(`/builds/${buildId}`);
      if (!active) return;
      setBuild(saved);
      const current = await apiRequest("/builds/analyze", {
        method: "POST",
        body: {
          partIds: saved.partIds,
          quantities: saved.quantities,
          storageIds: saved.storageIds,
          paymentMethod: saved.comparison.paymentMethod,
        },
      });
      if (active) setAnalysis(current);
    })()
      .catch((failure) => {
        if (active) setError(failure.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [buildId]);
  async function generate() {
    setBusy(true);
    setError(null);
    try {
      setCard(await apiRequest("/orders/card", { method: "POST" }));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  async function checkout() {
    if (busy) return;
    setBusy(true);
    setSubmitted(true);
    setError(null);
    try {
      await journey.run(() =>
        apiRequest("/orders/checkout-dream", {
          method: "POST",
          body: { buildId, idempotencyKey: key, card },
        }),
      );
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="checkout-page">
      {journey.feedback}
      <div className="page-heading">
        <div>
          <p>COMPRA SIMULADA</p>
          <h1>Seu PC dos sonhos, sem cobrança.</h1>
          <p>
            Esta é uma demonstração acadêmica. Não existe pagamento, envio ou
            pedido em loja real.
          </p>
        </div>
        <Link className="secondary-button" to={`/montar?build=${buildId}`}>
          Voltar ao montador
        </Link>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Conferindo sua montagem...</p>
      ) : (
        build &&
        analysis && (
          <div className="checkout-layout">
            <section className="checkout-review">
              <h2>{build.name}</h2>
              <p className="field-help">
                Os dados das peças e os preços são conferidos novamente no
                servidor.
              </p>
              <div className="checkout-parts">
                {analysis.parts.map((part) => (
                  <article key={part.id}>
                    <img src={part.image} width={54} height={54} alt="" />
                    <div>
                      <small>{part.categoryName}</small>
                      <strong>
                        {part.name} × {analysis.quantities?.[part.id] ?? 1}
                      </strong>
                      <span>{part.model}</span>
                    </div>
                    <Check size={17} aria-hidden="true" />
                  </article>
                ))}
              </div>
              <div className="checkout-total">
                <span>Menor total combinado, sem frete</span>
                <strong>
                  {analysis.comparison.optimized.complete
                    ? money(analysis.comparison.optimized.totalCents)
                    : "Cotação integral indisponível"}
                </strong>
                <p>
                  {analysis.comparison.optimized.complete
                    ? "Valor de referência registrado nas consultas. Nenhuma cobrança será feita."
                    : "Há peças sem oferta disponível. Revise a seleção no montador antes de comprar."}
                </p>
              </div>
              {!analysis.compatible && (
                <p className="form-error" role="alert">
                  Há pendências de compatibilidade. Reabra o montador e corrija
                  antes de continuar.
                </p>
              )}
            </section>
            <aside className="checkout-payment">
              <h2>Cartão de demonstração</h2>
              <p className="field-help">
                Gerado pelo próprio projeto. Não digite dados bancários.
              </p>
              <DreamCard card={card} />
              <button
                className="secondary-button"
                type="button"
                disabled={
                  busy ||
                  submitted ||
                  !analysis.compatible ||
                  !analysis.comparison.optimized.complete
                }
                onClick={generate}
              >
                {card ? "Gerar outro cartão fictício" : "Gerar cartão fictício"}
              </button>
              {card && (
                <p className="field-help">
                  Válido por dez minutos para esta simulação. O histórico guarda
                  somente o número mascarado.
                </p>
              )}
              <button
                className="checkout-sound-toggle"
                type="button"
                aria-pressed={journey.sound}
                onClick={journey.toggleSound}
              >
                Som de confirmação: {journey.sound ? "ligado" : "desligado"}
              </button>
              <label className="simulation-consent">
                <input
                  type="checkbox"
                  checked={accepted}
                  disabled={busy}
                  onChange={(event) => setAccepted(event.target.checked)}
                />
                <span>
                  Entendi que a compra é fictícia, sem cobrança e sem entrega de
                  produtos.
                </span>
              </label>
              <button
                className="primary-button"
                type="button"
                disabled={
                  busy ||
                  !card ||
                  !accepted ||
                  !analysis.compatible ||
                  !analysis.comparison.optimized.complete
                }
                onClick={checkout}
              >
                {busy
                  ? "Processando simulação..."
                  : submitted
                    ? "Consultar / repetir tentativa"
                    : "Concluir compra simulada"}
              </button>
              <p className="field-help">
                Se a resposta falhar, repetir a mesma tentativa não cria outra
                compra.
              </p>
            </aside>
          </div>
        )
      )}
    </section>
  );
}
