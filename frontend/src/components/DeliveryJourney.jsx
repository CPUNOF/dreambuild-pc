import { useEffect, useState } from "react";
import { RotateCcw, Check } from "lucide-react";
const labels = ["Pedido aprovado", "Peças separadas", "A caminho", "Chegou!"];
export default function DeliveryJourney() {
  const [run, setRun] = useState(0),
    [step, setStep] = useState(0);
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    setStep(reduced ? 3 : 0);
    if (reduced) return;
    const timers = [1200, 2800, 6000].map((time, index) =>
      setTimeout(() => setStep(index + 1), time),
    );
    return () => timers.forEach(clearTimeout);
  }, [run, reduced]);
  return (
    <section
      className="delivery-journey"
      aria-label="Prévia animada de entrega simulada"
    >
      <header>
        <div>
          <small>PRÉVIA DE ENTREGA · SIMULAÇÃO</small>
          <strong>Próxima parada: sua casa.</strong>
        </div>
        <button
          type="button"
          onClick={() => setRun((value) => value + 1)}
          aria-label="Repetir animação de entrega"
        >
          <RotateCcw size={15} />
        </button>
      </header>
      <svg
        key={run}
        className="delivery-map"
        viewBox="0 0 480 130"
        aria-hidden="true"
      >
        <path
          d="M35 104H440"
          stroke="currentColor"
          strokeOpacity=".12"
          strokeWidth="3"
        />
        <path
          d="M88 98H400"
          stroke="currentColor"
          strokeOpacity=".2"
          strokeWidth="2"
          strokeDasharray="7 7"
        />
        <g className="delivery-depot">
          <path
            d="M18 55 48 39 78 55V99H18Z"
            fill="currentColor"
            opacity=".1"
          />
          <path
            d="M18 55 48 39 78 55M24 59V99H72V59"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M37 99V70H59V99M37 77H59M37 84H59"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <text x="48" y="120" textAnchor="middle">
            DreamBuild
          </text>
        </g>
        <g className="delivery-house">
          <path
            d="M400 68 429 43 458 68"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M406 66V99H452V66" fill="currentColor" opacity=".12" />
          <path
            d="M406 66V99H452V66M425 99V79H436V99M411 73H418V81H411Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M435 45V36H443V52"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <text x="429" y="120" textAnchor="middle">
            Sua casa
          </text>
        </g>
        <g transform="translate(73 62)">
          <g className="delivery-vehicle">
            <ellipse cx="30" cy="40" rx="32" ry="4" fill="#000" opacity=".12" />
            <rect x="0" y="1" width="39" height="31" rx="4" fill="#e9662c" />
            <path d="M39 12H51L62 25V33H39Z" fill="#f68b4b" />
            <path d="M43 15H50L57 24H43Z" fill="#cce7f2" />
            <path
              d="M8 12H30M8 17H24"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <rect x="1" y="30" width="60" height="5" rx="2" fill="#273b4f" />
            {[12, 49].map((x) => (
              <g key={x}>
                <circle cx={x} cy="35" r="7" fill="#233346" />
                <circle cx={x} cy="35" r="3" fill="#dce7ee" />
              </g>
            ))}
          </g>
        </g>
        <g className="delivery-arrived" transform="translate(455 36)">
          <circle r="12" fill="#1b9a66" />
          <path
            d="m-5 0 3 4 7-8"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      </svg>
      <ol className="delivery-steps">
        {labels.map((label, index) => (
          <li key={label} className={index <= step ? "is-done" : ""}>
            <span>{index < step ? <Check size={10} /> : index + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <p className="sr-only" role="status">
        Prévia ilustrativa: {labels[step]}. Nenhum envio real.
      </p>
    </section>
  );
}
