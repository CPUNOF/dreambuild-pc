import { useEffect, useState } from "react";
import { ArrowLeftRight, Copy, Laptop, Monitor } from "lucide-react";
import { money, consultationDate } from "../data/offers.js";
import { publicBattleUrl } from "../data/publicLinks.js";

export default function BattleSetupPicker({
  systems,
  a,
  b,
  onChoose,
  onSwap,
  params,
}) {
  const [copied, setCopied] = useState(false),
    [error, setError] = useState("");
  const signature = params.toString();
  useEffect(() => {
    setCopied(false);
    setError("");
  }, [signature, a?.id, b?.id]);
  const privateSetup = [a, b].some(
    (s) => s?.type === "custom" && !s.publicCommunity,
  );
  async function share() {
    try {
      await navigator.clipboard.writeText(publicBattleUrl(params, a.id, b.id));
      setCopied(true);
      setError("");
    } catch {
      setError(
        "Não foi possível copiar automaticamente. Você também pode copiar o endereço do navegador.",
      );
    }
  }
  return (
    <section
      className="battle-setup-picker"
      id="escolher-setup"
      aria-label="Escolher os competidores"
    >
      <header>
        <div>
          <p className="section-kicker">ESCOLHA OS DOIS SETUPS</p>
          <h2>Quem entra no duelo?</h2>
        </div>
        <div>
          <button type="button" className="secondary-button" onClick={onSwap}>
            <ArrowLeftRight size={16} /> Inverter A e B
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={share}
            disabled={privateSetup}
          >
            <Copy size={16} />
            {copied ? "Link do duelo copiado!" : "Compartilhar duelo"}
          </button>
        </div>
      </header>
      <div className="battle-setup-pair">
        {[
          ["a", a],
          ["b", b],
        ].map(
          ([side, system]) =>
            system && (
              <article className={`battle-setup-side side-${side}`} key={side}>
                <div className="battle-setup-select">
                  <span>LADO {side.toUpperCase()}</span>
                  <label>
                    Competidor do lado {side.toUpperCase()}
                    <select
                      value={system.id}
                      onChange={(event) => {
                        onChoose(side, event.target.value);
                        setCopied(false);
                      }}
                    >
                      {["desktop", "laptop", "custom"].map((type) => (
                        <optgroup
                          key={type}
                          label={
                            type === "laptop"
                              ? "Notebooks gamer"
                              : type === "custom"
                                ? "Montagens da comunidade e da conta"
                                : "PCs montados"
                          }
                        >
                          {systems
                            .filter(
                              (s) =>
                                s.type === type ||
                                (type === "desktop" &&
                                  !["laptop", "custom"].includes(s.type)),
                            )
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="battle-setup-specs">
                  <img
                    src={system.image}
                    alt={system.name}
                    width={96}
                    height={96}
                    loading="lazy"
                  />
                  <div>
                    <small>
                      {system.type === "laptop" ? (
                        <Laptop size={13} />
                      ) : (
                        <Monitor size={13} />
                      )}{" "}
                      {system.type === "laptop"
                        ? "Notebook gamer"
                        : system.type === "custom"
                          ? "Montagem personalizada"
                          : "PC montado"}
                    </small>
                    <h3>{system.name}</h3>
                    <dl>
                      {[
                        ["CPU", system.cpu],
                        ["GPU", system.gpu],
                        ["RAM", system.ram],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{value || "Não informado"}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
                <footer>
                  <strong>
                    {Number.isSafeInteger(system.priceCents)
                      ? money(system.priceCents)
                      : "Cotação incompleta"}
                  </strong>
                  <span>
                    {system.priceKind === "academic"
                      ? "Preço acadêmico simulado · "
                      : ""}
                    {system.priceCheckedAt
                      ? consultationDate(system.priceCheckedAt)
                      : "Data da cotação não informada"}
                    {system.available === false
                      ? " · Sem estoque na fonte"
                      : ""}
                  </span>
                </footer>
              </article>
            ),
        )}
      </div>
      {privateSetup && (
        <p className="field-help">
          Publique voluntariamente sua montagem no ranking para compartilhar um
          duelo que outras pessoas consigam abrir.
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
