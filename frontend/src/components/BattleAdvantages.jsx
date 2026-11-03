import { ArrowLeftRight, BadgeDollarSign, Gauge, Scale } from "lucide-react";
import { money } from "../data/offers.js";

export default function BattleAdvantages({
  a,
  b,
  averages,
  gameCount,
  resolution,
  onSwap,
}) {
  if (a.id === b.id)
    return (
      <p className="form-error" role="status">
        Você escolheu o mesmo setup nos dois lados. Selecione outro modelo para
        comparar.
      </p>
    );
  const priced = [a.priceCents, b.priceCents].every(
    (p) => Number.isSafeInteger(p) && p > 0,
  );
  const side = (index) => (index === 0 ? "A" : "B");
  const priceWinner =
    priced && a.priceCents !== b.priceCents
      ? a.priceCents < b.priceCents
        ? 0
        : 1
      : null;
  const fpsWinner =
    averages && averages[0] !== averages[1]
      ? averages[0] > averages[1]
        ? 0
        : 1
      : null;
  const costs =
    priced && averages?.every((n) => n > 0)
      ? [a.priceCents / averages[0], b.priceCents / averages[1]]
      : null;
  const costWinner =
    costs && costs[0] !== costs[1] ? (costs[0] < costs[1] ? 0 : 1) : null;
  return (
    <section className="battle-advantages" aria-label="Vantagens dos setups">
      <header>
        <div>
          <p className="section-kicker">O QUE MUDA ENTRE ELES</p>
          <h3>Compare o que importa para você.</h3>
        </div>
        <button type="button" className="secondary-button" onClick={onSwap}>
          <ArrowLeftRight size={16} /> Trocar lados
        </button>
      </header>
      <div className="battle-advantage-grid">
        <article>
          <BadgeDollarSign size={22} />
          <span>Menor cotação cadastrada</span>
          <strong>
            {priceWinner === null
              ? priced
                ? "Mesmo valor"
                : "Cotação incompleta"
              : `Lado ${side(priceWinner)}`}
          </strong>
          <small>
            {priceWinner !== null
              ? `${money(Math.abs(a.priceCents - b.priceCents))} de diferença`
              : "Confira a data e a disponibilidade de cada oferta."}
          </small>
        </article>
        <article>
          <Gauge size={22} />
          <span>Média dos jogos em comum</span>
          <strong>
            {fpsWinner === null
              ? averages
                ? "Mesma média"
                : "Sem base comum"
              : `Lado ${side(fpsWinner)}`}
          </strong>
          <small>
            {averages
              ? `${gameCount} jogos · ${resolution} · referências/estimativas`
              : "Selecione jogos e condições compatíveis."}
          </small>
        </article>
        <article>
          <Scale size={22} />
          <span>Menor custo por FPS de referência</span>
          <strong>
            {costWinner === null
              ? costs
                ? "Mesmo custo"
                : "Dados insuficientes"
              : `Lado ${side(costWinner)}`}
          </strong>
          <small>
            {costs
              ? `A: ${money(Math.round(costs[0]))} · B: ${money(Math.round(costs[1]))} por FPS`
              : "Depende de preços completos e FPS comparáveis."}
          </small>
        </article>
      </div>
      <p>
        Comparação das condições cadastradas, com preços datados. Estimativas e
        testes de fontes externas não são medições feitas nestes PCs pelo site.
      </p>
    </section>
  );
}
