import { useEffect, useState } from "react";
import DreamCard from "./DreamCard.jsx";
import { demoExpiry } from "../../../shared/delivery.js";
export default function DreamCardForm({ card, onGenerate, onValid, disabled }) {
  const [approved, setApproved] = useState(false),
    [now, setNow] = useState(Date.now());
  useEffect(() => {
    setApproved(false);
    setNow(Date.now());
  }, [card]);
  useEffect(() => {
    if (!card) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [card]);
  const expired = Boolean(card && now > card.validUntil),
    valid = Boolean(card && approved && !expired);
  useEffect(() => {
    onValid(valid ? { ...card, expiry: demoExpiry(card) } : null);
  }, [valid, card, onValid]);
  return (
    <div className="dreamcard-form">
      <div className="checkout-card-preview">
        <DreamCard card={card} />
      </div>
      <p className="field-help">
        Pagamento exclusivo com DreamCard de demonstração. Não há campos
        bancários, integração com Google Pay ou cobrança.
      </p>
      <button
        type="button"
        className="secondary-button"
        disabled={disabled}
        onClick={onGenerate}
      >
        {card ? "Gerar outro cartão fictício" : "Gerar cartão fictício"}
      </button>
      {card && (
        <>
          <dl className="demo-payment-facts">
            <div>
              <dt>Identificador de demonstração</dt>
              <dd>{card.number.match(/.{1,4}/g).join(" ")}</dd>
            </div>
            <div>
              <dt>Nome da conta</dt>
              <dd>{card.holderName}</dd>
            </div>
            <div>
              <dt>Validade de demonstração</dt>
              <dd>{demoExpiry(card)}</dd>
            </div>
          </dl>
          <p className="field-help">
            Gerado pelo próprio site, válido por dez minutos. Apenas este
            DreamCard é aceito pelo servidor.
          </p>
          {expired && (
            <p className="form-error" role="alert">
              Este DreamCard expirou. Gere outro cartão fictício para continuar.
            </p>
          )}
          <button
            type="button"
            className="primary-button"
            disabled={disabled || expired}
            onClick={() => setApproved(true)}
          >
            {approved ? "DreamCard selecionado" : "Usar este DreamCard"}
          </button>
          <p className={valid ? "checkout-valid" : "field-help"} role="status">
            {valid
              ? "DreamCard conferido. Pronto para revisar."
              : "Selecione o DreamCard gerado para continuar."}
          </p>
        </>
      )}
    </div>
  );
}
