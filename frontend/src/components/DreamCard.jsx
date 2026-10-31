import { useState } from "react";
import { Wifi, RotateCcw, ShieldCheck } from "lucide-react";
export default function DreamCard({ card }) {
  const [back, setBack] = useState(false);
  return (
    <div className="dreamcard-presentation">
      <div className={`dreamcard-object ${back ? "is-flipped" : ""}`}>
        <div className="dreamcard-face dreamcard-front">
          <div className="dreamcard-top">
            <strong>
              dream<span>card</span>
            </strong>
            <small>YOUR NEXT UPGRADE</small>
          </div>
          <div className="dreamcard-hardware">
            <svg viewBox="0 0 45 34" width="38" height="29" aria-hidden="true">
              <rect x="1" y="1" width="43" height="32" rx="6" fill="#d2b783" />
              <path
                d="M16 1v10H1m43 0H29V1M1 23h15v10m13 0V23h15M16 11h13v12H16Z"
                fill="none"
                stroke="#8e7449"
              />
            </svg>
            <Wifi size={24} />
          </div>
          <strong className="dreamcard-number">
            {card
              ? card.number.match(/.{1,4}/g).join(" ")
              : "0000 •••• •••• ••••"}
          </strong>
          <div className="dreamcard-bottom">
            <span>
              <small>TITULAR DA EXPERIÊNCIA</small>
              <b>{card?.holderName || "SEU PRÓXIMO SETUP"}</b>
            </span>
            <span className="dreamcard-symbol" aria-hidden="true">
              <i />
              <i />
            </span>
          </div>
          <span className="dreamcard-demo">
            DEMONSTRAÇÃO · SEM VALOR BANCÁRIO
          </span>
        </div>
        <div className="dreamcard-face dreamcard-back">
          <div className="dreamcard-magnetic" />
          <small>CARTÃO GERADO PARA ESTA SIMULAÇÃO</small>
          <div className="dreamcard-signature">
            <span>{card?.holderName || "DreamBuild"}</span>
            <strong>{card?.cvv || "•••"}</strong>
          </div>
          <p>
            Este é um cartão fictício do projeto DreamBuild PC. Não realiza
            pagamentos nem utiliza dados bancários.
          </p>
          <ShieldCheck size={25} />
        </div>
      </div>
      <button
        type="button"
        className="dreamcard-flip"
        onClick={() => setBack((v) => !v)}
        aria-pressed={back}
      >
        <RotateCcw size={13} />
        {back ? "Ver frente do DreamCard" : "Virar meu DreamCard"}
      </button>
      <p className="dreamcard-caption">
        Seu próximo upgrade começa com uma escolha.
      </p>
    </div>
  );
}
