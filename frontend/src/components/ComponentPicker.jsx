import { useEffect, useRef, useState } from "react";
import {
  Search,
  X,
  Check,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { categoryNames } from "../data/hardwareFields.js";
import { money } from "../data/offers.js";
import { platformOf, psuFit } from "../data/componentSelection.js";
import { saleOffer, inventoryState } from "../../../shared/inventory.js";
import {
  assemblyIssues,
  assemblyReadiness,
  issuesForCategory,
} from "../../../shared/assemblyCompatibility.js";
export default function ComponentPicker({
  category,
  products,
  selectedId,
  onChoose,
  onClose,
  onRemove,
  onResetPlatform,
  powerAnalysis,
  parts,
  quantities = {},
  addingStorage = false,
  onRefresh,
}) {
  const [refreshing, setRefreshing] = useState(false),
    [refreshError, setRefreshError] = useState("");
  const dialog = useRef(null),
    [socket, setSocket] = useState(() =>
      category === "cooler"
        ? parts.find((p) => p.category === "cpu")?.hardware?.socket || "Todos"
        : "Todos",
    ),
    [query, setQuery] = useState(""),
    [platform, setPlatform] = useState(() => {
      const cpu = parts.find((p) => p.category === "cpu");
      return category === "mobo" &&
        cpu &&
        ["AMD", "Intel"].includes(platformOf(cpu))
        ? platformOf(cpu)
        : "Todas";
    }),
    [brand, setBrand] = useState("Todas"),
    [stock, setStock] = useState(false),
    [safe, setSafe] = useState(false);
  useEffect(() => {
    if (category === "psu")
      setSafe(Boolean(powerAnalysis?.recommendedPsuWatts));
  }, [category, powerAnalysis?.recommendedPsuWatts]);
  useEffect(() => {
    const element = dialog.current,
      previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = previous;
    };
  }, []);
  const pool = products.filter((p) => p.category === category),
    platforms = [...new Set(pool.map(platformOf))].sort(),
    brands = [...new Set(pool.map((p) => p.brand))].sort();
  const normalize = (text) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  function compatibility(product) {
    const candidateParts = addingStorage
      ? [...parts.filter((p) => p.id !== product.id), product]
      : [...parts.filter((p) => p.category !== category), product];
    const candidateQuantities = { ...quantities };
    if (addingStorage && parts.some((p) => p.id === product.id))
      candidateQuantities[product.id] = (quantities[product.id] ?? 1) + 1;
    const issues = issuesForCategory(
      assemblyIssues(candidateParts, candidateQuantities),
      category,
    );
    if (
      category === "psu" &&
      psuFit(product, powerAnalysis, parts, { allowPendingCase: true })
        .status === "fail"
    )
      issues.push({
        code: "PSU_FIT",
        message: "A fonte não atende ao conjunto.",
      });
    return issues;
  }
  const filtered = pool
    .filter(
      (p) =>
        (platform === "Todas" || platformOf(p) === platform) &&
        (socket === "Todos" ||
          p.hardware?.supportedSockets?.some(
            (s) =>
              s.replace(/[\s-]/g, "").toUpperCase() ===
              socket.replace(/[\s-]/g, "").toUpperCase(),
          )) &&
        (brand === "Todas" || p.brand === brand) &&
        (!stock || saleOffer(p)) &&
        normalize(p.fullName + " " + p.model).includes(normalize(query)) &&
        (!safe ||
          ["pass", "pending-case"].includes(
            psuFit(p, powerAnalysis, parts, { allowPendingCase: true }).status,
          )),
    )
    .filter(
      (p) => assemblyReadiness(p).length === 0 && compatibility(p).length === 0,
    )
    .sort(
      (a, b) => Number(Boolean(saleOffer(b))) - Number(Boolean(saleOffer(a))),
    );
  return (
    <dialog
      ref={dialog}
      className="component-picker"
      onCancel={onClose}
      aria-labelledby="picker-title"
    >
      <header className="picker-heading">
        <div>
          <p className="section-kicker">ESCOLHA PARA SUA BANCADA</p>
          <h2 id="picker-title">Selecionar {categoryNames[category]}</h2>
        </div>
        <button onClick={onClose} aria-label="Fechar seletor de peças">
          <X size={23} />
        </button>
      </header>
      <div className="picker-search">
        <Search size={19} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busque modelo, marca ou código"
          aria-label="Buscar peça para montagem"
        />
      </div>
      <div className="picker-filters">
        {onRefresh && (
          <div className="picker-reset-tools">
            <button
              type="button"
              disabled={refreshing}
              onClick={async () => {
                setRefreshing(true);
                setRefreshError("");
                try {
                  await onRefresh();
                } catch {
                  setRefreshError(
                    "Não foi possível atualizar o catálogo. Tente novamente.",
                  );
                } finally {
                  setRefreshing(false);
                }
              }}
            >
              {refreshing ? "Atualizando…" : "Atualizar catálogo"}
            </button>
            <span>Atualiza as fichas sem apagar sua bancada.</span>
          </div>
        )}
        {refreshError && <p role="alert">{refreshError}</p>}
        {(selectedId ||
          ["cpu", "mobo", "ram", "cooler"].includes(category)) && (
          <div className="picker-reset-tools">
            {selectedId && (
              <button type="button" onClick={onRemove}>
                Remover {categoryNames[category]}
              </button>
            )}
            {["cpu", "mobo", "ram", "cooler"].includes(category) &&
              parts.some((p) =>
                ["cpu", "mobo", "ram", "cooler"].includes(p.category),
              ) && (
                <button type="button" onClick={onResetPlatform}>
                  Limpar plataforma para trocar AMD/Intel ou DDR
                </button>
              )}
          </div>
        )}
        {["cpu", "mobo", "gpu", "ram", "cooler"].includes(category) && (
          <div
            role="group"
            aria-label={
              category === "gpu"
                ? "Fabricante do chip gráfico"
                : "Plataforma ou tipo de componente"
            }
          >
            {["Todas", ...platforms].map((name) => (
              <button
                key={name}
                aria-pressed={platform === name}
                onClick={() => setPlatform(name)}
              >
                {name}
              </button>
            ))}
          </div>
        )}
        <div className="picker-filter-options">
          {category === "cooler" && (
            <label>
              Socket do cooler{" "}
              <select
                aria-label="Filtrar socket do cooler"
                value={socket}
                onChange={(e) => setSocket(e.target.value)}
              >
                {[
                  ...new Set([
                    "Todos",
                    ...products
                      .filter((p) => p.category === "cooler")
                      .flatMap((p) => p.hardware?.supportedSockets || []),
                    ...(parts.find((p) => p.category === "cpu")?.hardware
                      ?.socket
                      ? [
                          parts.find((p) => p.category === "cpu").hardware
                            .socket,
                        ]
                      : []),
                  ]),
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          )}
          <label>
            Marca{" "}
            <select
              aria-label="Filtrar marca"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            >
              <option>Todas</option>
              {brands.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={stock}
              onChange={(e) => setStock(e.target.checked)}
            />
            Disponíveis para compra
          </label>
        </div>
      </div>
      {category === "psu" && (
        <aside className="picker-power">
          <ShieldCheck size={23} />
          <div>
            <strong>
              {powerAnalysis?.recommendedPsuWatts
                ? `Recomendação do conjunto: ${powerAnalysis.recommendedPsuWatts} W ou mais`
                : "Ainda não há dados suficientes para dimensionar a fonte"}
            </strong>
            <p>
              Além dos watts, confira conectores da GPU, EPS/ATX da placa-mãe,
              quantidade de cabos e espaço no gabinete.
            </p>
            <label>
              <input
                type="checkbox"
                checked={safe}
                disabled={!powerAnalysis?.recommendedPsuWatts}
                onChange={(e) => setSafe(e.target.checked)}
              />
              Mostrar apenas fontes que atendem aos critérios cadastrados
            </label>
          </div>
        </aside>
      )}
      <p className="picker-count" role="status">
        {filtered.length} modelos compatíveis · selecione uma foto para usar a
        peça
      </p>
      <p className="field-help">
        A bancada exibe modelos com ficha técnica suficiente para conferir o
        conjunto. Os demais continuam disponíveis no catálogo da loja.
      </p>
      {parts.length > 0 && (
        <aside className="picker-context">
          <div>
            <strong>Compatível com sua seleção atual</strong>
            <small>
              {parts
                .filter((p) => ["cpu", "mobo", "ram"].includes(p.category))
                .map((p) =>
                  [p.categoryName, p.hardware?.socket, p.hardware?.ramType]
                    .filter(Boolean)
                    .join(" · "),
                )
                .join(" / ") ||
                "Os critérios das peças selecionadas são aplicados automaticamente."}
            </small>
          </div>
          {["cpu", "mobo", "ram", "cooler"].includes(category) && (
            <button
              type="button"
              className="text-button"
              onClick={onResetPlatform}
            >
              Trocar plataforma
            </button>
          )}
        </aside>
      )}
      <div className="picker-results">
        {filtered.map((product) => {
          const offer = saleOffer(product),
            stockState = inventoryState(product.inventory),
            selected = selectedId === product.id,
            fit =
              category === "psu"
                ? psuFit(product, powerAnalysis, parts, {
                    allowPendingCase: true,
                  })
                : null;
          return (
            <button
              key={product.id}
              className={`picker-product ${selected ? "is-selected" : ""}`}
              aria-label={`Selecionar ${product.name}`}
              aria-pressed={selected}
              onClick={() => onChoose(product.id)}
            >
              <span className="picker-product-photo">
                <img
                  src={product.image}
                  alt=""
                  width="240"
                  height="180"
                  loading="lazy"
                  draggable="false"
                />
                {selected && (
                  <span>
                    <Check size={15} />
                    Na sua bancada
                  </span>
                )}
              </span>
              <span className="picker-product-info">
                <small>
                  {product.brand}
                  {product.brand.toLowerCase() !==
                    platformOf(product).toLowerCase() &&
                    ` · ${platformOf(product)}`}
                </small>
                <strong>{product.name}</strong>
                <span className="picker-facts">
                  {[
                    product.hardware?.socket,
                    product.hardware?.ramType,
                    product.hardware?.capacityGb &&
                      `${product.hardware.capacityGb} GB`,
                    product.hardware?.modules &&
                      `${product.hardware.modules} módulo(s)`,
                    product.hardware?.wattage &&
                      `${product.hardware.wattage} W`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                {category === "cooler" && (
                  <span className="picker-sku">
                    Sockets confirmados:{" "}
                    {product.hardware?.supportedSockets?.join(", ") ||
                      "Ainda não informados"}
                  </span>
                )}
                <span className="picker-sku">{product.model}</span>
                <span
                  className={`stock-status ${offer ? "in-stock" : "out-stock"}`}
                >
                  {offer
                    ? `Estoque DreamBuild · ${stockState.quantity} un.`
                    : "Sem saldo para compra · disponível para análise"}
                </span>
                <b>
                  {stockState.configured
                    ? money(stockState.unitPriceCents)
                    : "Preço pendente"}
                </b>
                <small>Preço acadêmico simulado</small>
                {fit && (
                  <span className={`picker-fit fit-${fit.status}`}>
                    <AlertTriangle size={13} />
                    {fit.label}
                  </span>
                )}
                <span className="picker-select-label">
                  {selected
                    ? "Manter esta peça"
                    : offer
                      ? "Usar na montagem"
                      : "Usar para análise"}
                  <ArrowRight size={15} />
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {!filtered.length && (
        <div className="empty-state">
          <h3>Nenhuma peça compatível com estes filtros.</h3>
          <p>
            Peças incompatíveis ficam ocultas. Revise os filtros ou troque a
            plataforma para escolher outro conjunto de CPU, placa-mãe e memória.
          </p>
          <p>
            Modelos com ficha técnica incompleta também ficam fora da bancada
            para evitar uma montagem que trava só na finalização.
          </p>
          {["cpu", "mobo", "ram", "cooler"].includes(category) && (
            <button
              type="button"
              className="secondary-button"
              onClick={onResetPlatform}
            >
              Trocar plataforma e escolher novamente
            </button>
          )}
        </div>
      )}
    </dialog>
  );
}
