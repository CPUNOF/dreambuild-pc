import { useEffect, useState } from "react";
import DreamCard from "./DreamCard.jsx";
import { demoExpiry } from "../../../shared/delivery.js";
export default function DreamCardForm({ card, onGenerate, onValid, disabled }) {
  const [fields, setFields] = useState({
    number: "",
    holderName: "",
    expiry: "",
    cvv: "",
  });
  const [touched, setTouched] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!card) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [card]);
  useEffect(() => {
    setFields({ number: "", holderName: "", expiry: "", cvv: "" });
    setTouched(false);
    onValid(null);
  }, [card]);
  const valid = Boolean(
    card &&
    now <= card.validUntil &&
    fields.number.replace(/\s/g, "") === card.number &&
    fields.holderName.trim().toLocaleLowerCase() ===
      card.holderName.trim().toLocaleLowerCase() &&
    fields.expiry === demoExpiry(card) &&
    fields.cvv === card.cvv,
  );
  useEffect(() => {
    onValid(
      valid
        ? {
            ...card,
            number: fields.number.replace(/\s/g, ""),
            cvv: fields.cvv,
            expiry: fields.expiry,
          }
        : null,
    );
  }, [valid, card, fields.number, fields.cvv, fields.expiry]);
  function fill() {
    setFields({
      number: card.number,
      holderName: card.holderName,
      expiry: demoExpiry(card),
      cvv: card.cvv,
    });
    setTouched(true);
  }
  return (
    <div className="dreamcard-form">
      <div className="checkout-card-preview">
        <DreamCard
          card={
            card && {
              ...card,
              number: fields.number
                ? fields.number.replace(/\s/g, "").padEnd(16, "•")
                : card.number,
              holderName: fields.holderName || card.holderName,
              cvv: fields.cvv || card.cvv,
            }
          }
        />
      </div>
      <p className="field-help">
        Use apenas o DreamCard gerado aqui. Ele expira em dez minutos e não tem
        valor bancário.
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
          <details className="issued-card-data">
            <summary>Consultar dados do cartão gerado</summary>
            <p>
              Número: {card.number} · Nome: {card.holderName}
              <br />
              Validade: {demoExpiry(card)} · Código: {card.cvv}
            </p>
          </details>
          {now > card.validUntil && (
            <p className="form-error" role="alert">
              Este DreamCard expirou. Gere outro cartão fictício para continuar.
            </p>
          )}
          <p className="field-help">
            Validade para preencher: <strong>{demoExpiry(card)}</strong>. Vire o
            cartão para consultar o código.
          </p>
          <div className="checkout-form-grid">
            {[
              ["number", "Número do DreamCard", 19, "0000 0000 0000 0000"],
              ["holderName", "Nome no cartão", 80, card.holderName],
              ["expiry", "Validade", 5, "MM/AA"],
              ["cvv", "Código de demonstração", 3, "000"],
            ].map(([key, label, max, placeholder]) => (
              <label key={key}>
                {label}
                <input
                  value={fields[key]}
                  maxLength={max}
                  placeholder={placeholder}
                  autoComplete="off"
                  inputMode={key === "holderName" ? "text" : "numeric"}
                  disabled={disabled}
                  onBlur={() => setTouched(true)}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (key === "number")
                      value = value
                        .replace(/\D/g, "")
                        .slice(0, 16)
                        .replace(/(.{4})(?=.)/g, "$1 ");
                    if (key === "cvv") value = value.replace(/\D/g, "");
                    if (key === "expiry")
                      value = value
                        .replace(/\D/g, "")
                        .slice(0, 4)
                        .replace(/^(\d{2})(\d)/, "$1/$2");
                    setFields({ ...fields, [key]: value });
                  }}
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            className="text-button"
            disabled={disabled}
            onClick={fill}
          >
            Preencher com meu DreamCard
          </button>
          <p className={valid ? "checkout-valid" : "field-help"} role="status">
            {valid
              ? "DreamCard conferido. Pronto para revisar."
              : touched
                ? "Confira os campos com os dados do cartão gerado acima."
                : "Preencha os quatro campos para continuar."}
          </p>
        </>
      )}
    </div>
  );
}
