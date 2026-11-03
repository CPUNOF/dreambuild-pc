import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { Info, TriangleAlert } from "lucide-react";
import { categoryNames } from "../data/hardwareFields.js";
import { apiRequest } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { money } from "../data/offers.js";
import StoreComparison from "../components/StoreComparison.jsx";
import AssemblyWorkspace from "../components/AssemblyWorkspace.jsx";
import ComponentPicker from "../components/ComponentPicker.jsx";
import { selectionIssues } from "../../../shared/selectionCompatibility.js";
import {
  buildResources,
  buildComponentIds,
  includedCooling,
} from "../../../shared/buildResources.js";
import BuildResourcesPanel from "../components/BuildResourcesPanel.jsx";
import "../resources.css";
import "../shopping-experience.css";
import { inventoryQuote } from "../../../shared/inventory.js";
const categories = [
  "cpu",
  "mobo",
  "ram",
  "gpu",
  "storage",
  "psu",
  "case",
  "cooler",
];

export default function BuilderPage({ products, onCatalogRefresh }) {
  const auth = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sourceId = params.get("build");
  const addedId = params.get("adicionar");
  const publicId = params.get("publicacao");
  const resumeDraft = params.get("retomar") === "1";
  const [partIds, setPartIds] = useState({});
  const [activeCategory, setActiveCategory] = useState("cpu");
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [options, setOptions] = useState({ quantities: {}, storageIds: [] }),
    [addingStorage, setAddingStorage] = useState(false);
  const selectedParts = products.filter((p) =>
      buildComponentIds(partIds, options).includes(p.id),
    ),
    resources = buildResources(selectedParts, options.quantities);
  const [name, setName] = useState("Meu próximo PC");
  const storePreview = inventoryQuote(
    selectedParts.map((p) => ({
      componentId: p.id,
      quantity: options.quantities[p.id] ?? 1,
    })),
    selectedParts,
  );
  const [analysis, setAnalysis] = useState(null);
  const [payment, setPayment] = useState("pix");
  const [busy, setBusy] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [pickerCategory, setPickerCategory] = useState(null),
    [powerPreview, setPowerPreview] = useState(null);
  useEffect(() => {
    if (pickerCategory !== "psu") return;
    const controller = new AbortController();
    setPowerPreview(null);
    apiRequest("/builds/analyze", {
      method: "POST",
      body: { partIds, ...options, paymentMethod: payment },
      signal: controller.signal,
    })
      .then(setPowerPreview)
      .catch(() => {});
    return () => controller.abort();
  }, [pickerCategory, partIds, payment, options]);
  useEffect(() => {
    let active = true;
    setInitializing(true);
    setError(null);
    (async () => {
      const shared = publicId
        ? await apiRequest(`/community/builds/${publicId}`)
        : null;
      const source = shared
        ? {
            partIds: Object.fromEntries(
              shared.parts.map((p) => [p.category, p.id]),
            ),
            quantities: Object.fromEntries(
              shared.parts
                .filter((p) => ["ram", "storage"].includes(p.category))
                .map((p) => [p.id, p.quantity ?? 1]),
            ),
            storageIds: shared.parts
              .filter((p) => p.category === "storage")
              .slice(0, -1)
              .map((p) => p.id),
          }
        : sourceId || resumeDraft
          ? await apiRequest(sourceId ? `/builds/${sourceId}` : "/builds/draft")
          : { partIds: {} };
      if (!active) return;
      const next = { ...source.partIds };
      let storageIds = source.storageIds || [];
      if (addedId) {
        const added = products.find((product) => product.id === addedId);
        if (added) {
          const candidate = { ...next, [added.category]: added.id };
          const conflicts = selectionIssues(
            products.filter((p) => Object.values(candidate).includes(p.id)),
          );
          if (conflicts.length) setError(conflicts[0].message);
          else {
            next[added.category] = added.id;
            if (added.category === "storage") storageIds = [];
          }
        } else
          throw new Error("A peça escolhida não está disponível no catálogo.");
      }
      setPartIds(next);
      setOptions({
        quantities: Object.fromEntries(
          Object.entries(source.quantities || {}).filter(([id]) =>
            [next.ram, next.storage, ...storageIds].includes(id),
          ),
        ),
        storageIds,
      });
      setName(source.name || "Meu próximo PC");
      setSavedId(sourceId && !addedId && !publicId ? sourceId : null);
      setAnalysis(null);
      if (sourceId && !addedId && !publicId) {
        const mode = source.comparison?.paymentMethod || "pix";
        setPayment(mode);
        const result = await apiRequest("/builds/analyze", {
          method: "POST",
          body: {
            partIds: next,
            quantities: source.quantities,
            storageIds: source.storageIds,
            paymentMethod: mode,
          },
        });
        if (active) setAnalysis(result);
      }
    })()
      .catch((failure) => {
        if (active) setError(failure.message);
      })
      .finally(() => {
        if (active) setInitializing(false);
      });
    return () => {
      active = false;
    };
  }, [sourceId, addedId, resumeDraft, publicId]);
  const selectedCount = Object.values(partIds).filter(Boolean).length;
  function change(category, id) {
    const next = { ...partIds, [category]: id };
    const nextOptions = {
      storageIds: category === "storage" ? [] : options.storageIds,
      quantities: { ...options.quantities },
    };
    const ids = buildComponentIds(next, nextOptions);
    for (const key of Object.keys(nextOptions.quantities))
      if (!ids.includes(key)) delete nextOptions.quantities[key];
    const conflicts = selectionIssues(
      products.filter((p) => ids.includes(p.id)),
    );
    conflicts.push(
      ...buildResources(
        products.filter((p) => ids.includes(p.id)),
        nextOptions.quantities,
      ).issues,
    );
    if (id && conflicts.length) {
      setError(conflicts[0].message);
      return false;
    }
    setError(null);
    setPowerPreview(null);
    setPartIds((current) => ({ ...current, [category]: id }));
    setOptions(nextOptions);
    setAnalysis(null);
    setSavedId(null);
    setMessage(null);
    return true;
  }
  function applyOptions(next, nextIds = partIds) {
    const parts = products.filter((p) =>
        buildComponentIds(nextIds, next).includes(p.id),
      ),
      conflicts = [
        ...selectionIssues(parts),
        ...buildResources(parts, next.quantities).issues,
      ];
    if (conflicts.length) {
      setError(conflicts[0].message);
      return false;
    }
    setOptions(next);
    setPartIds(nextIds);
    setError(null);
    setAnalysis(null);
    setSavedId(null);
    setMessage(null);
    setPowerPreview(null);
    return true;
  }
  function quantity(id, n) {
    const next = { ...options, quantities: { ...options.quantities, [id]: n } };
    if (n < (options.quantities[id] ?? 1)) {
      setOptions(next);
      setAnalysis(null);
      setSavedId(null);
      setError(null);
      setMessage(null);
      setPowerPreview(null);
    } else applyOptions(next);
  }
  function addStorage(id) {
    if (!partIds.storage) return change("storage", id);
    if (id === partIds.storage || options.storageIds.includes(id))
      return applyOptions({
        ...options,
        quantities: {
          ...options.quantities,
          [id]: (options.quantities[id] ?? 1) + 1,
        },
      });
    return applyOptions({
      ...options,
      storageIds: [...options.storageIds, id],
    });
  }
  function removeStorage(id) {
    const all = [partIds.storage, ...options.storageIds].filter(
        (x) => x && x !== id,
      ),
      next = { ...partIds, storage: all[0] || "" },
      quantities = { ...options.quantities };
    delete quantities[id];
    setPartIds(next);
    setOptions({ quantities, storageIds: all.slice(1) });
    setAnalysis(null);
    setSavedId(null);
    setError(null);
    setMessage(null);
  }
  function pick(category) {
    setActiveCategory(category);
    setAddingStorage(false);
    setPickerCategory(category);
  }
  function clearSelection(platformOnly = false) {
    setOptions((current) =>
      platformOnly
        ? {
            ...current,
            quantities: Object.fromEntries(
              Object.entries(current.quantities).filter(
                ([id]) =>
                  products.find((p) => p.id === id)?.category === "storage",
              ),
            ),
          }
        : { quantities: {}, storageIds: [] },
    );
    if (!platformOnly) {
      setName("Meu próximo PC");
      navigate("/montar", { replace: true });
    }
    setPartIds((current) =>
      platformOnly
        ? Object.fromEntries(
            Object.entries(current).filter(
              ([category]) =>
                !["cpu", "mobo", "ram", "cooler"].includes(category),
            ),
          )
        : {},
    );
    setAnalysis(null);
    setSavedId(null);
    setError(null);
    setPowerPreview(null);
    setPickerCategory(null);
    setActiveCategory("cpu");
    setMessage(
      platformOnly
        ? "Plataforma removida. Escolha CPU, placa-mãe, RAM e cooler do novo conjunto."
        : "Bancada vazia. Escolha a primeira peça.",
    );
  }
  async function analyze() {
    setBusy(true);
    setError(null);
    try {
      setAnalysis(
        await apiRequest("/builds/analyze", {
          method: "POST",
          body: { partIds, ...options, paymentMethod: payment },
        }),
      );
      setMessage("Análise atualizada e rascunho guardado neste navegador.");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!auth.user) {
      navigate("/entrar", { state: { from: "/montar" } });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await apiRequest("/builds", {
        method: "POST",
        body: { name, partIds, ...options, paymentMethod: payment },
      });
      setSavedId(result.id);
      setAnalysis(result);
      setMessage("Montagem salva na sua conta.");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  function fill() {
    setOptions({ quantities: {}, storageIds: [] });
    const next = {};
    for (const category of categories) {
      const product = products.find((item) => item.category === category);
      if (product) next[category] = product.id;
    }
    setPartIds(next);
    setAnalysis(null);
    setSavedId(null);
    setMessage(null);
  }
  return (
    <section className="builder-page builder-shopping">
      <div className="page-heading">
        <div>
          <p>MONTADOR DE PC</p>
          <h1>Monte seu PC, com tudo no lugar.</h1>
          <p>
            Escolha uma etapa. Modelo, quantidade, slots e compatibilidade ficam
            juntos em cada peça.
          </p>
        </div>
        <Link className="secondary-button" to="/minhas-montagens">
          Minhas montagens
        </Link>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
          {!auth.user && sourceId && (
            <>
              {" "}
              <Link to="/entrar" state={{ from: `/montar?build=${sourceId}` }}>
                Entrar na conta
              </Link>
            </>
          )}
        </p>
      )}
      {message && (
        <p className="form-success" role="status">
          {message}
        </p>
      )}
      <div className="builder-reset-tools">
        <button
          type="button"
          className="secondary-button"
          disabled={busy || initializing || !selectedCount}
          onClick={() => clearSelection(false)}
        >
          Limpar bancada
        </button>
        <button
          type="button"
          className="secondary-button"
          disabled={
            busy ||
            initializing ||
            !["cpu", "mobo", "ram", "cooler"].some((c) => partIds[c])
          }
          onClick={() => clearSelection(true)}
        >
          Trocar plataforma
        </button>
        <Link className="text-button" to="/montar?retomar=1">
          Retomar rascunho salvo
        </Link>
        <small>
          Limpa a seleção atual; suas montagens salvas continuam em Minha conta.
        </small>
      </div>
      <div className="builder-layout">
        <div className="builder-selections">
          <AssemblyWorkspace
            products={products}
            partIds={partIds}
            disabled={busy || initializing}
            onPick={pick}
            onRemove={(category) =>
              category === "storage"
                ? removeStorage(partIds.storage)
                : change(category, "")
            }
            activeCategory={activeCategory}
            onActiveCategory={setActiveCategory}
            resources={resources}
          >
            <BuildResourcesPanel
              category={activeCategory}
              parts={selectedParts}
              quantities={options.quantities}
              resources={resources}
              onQuantity={quantity}
              onAddStorage={() => {
                setActiveCategory("storage");
                setAddingStorage(true);
                setPickerCategory("storage");
              }}
              onRemoveStorage={removeStorage}
              onPick={(category, action) =>
                action === "remove" ? change(category, "") : pick(category)
              }
              disabled={busy || initializing}
            />
          </AssemblyWorkspace>
        </div>
        <aside
          className={`build-summary ${summaryExpanded ? "is-expanded" : ""}`}
        >
          <button
            type="button"
            className="mobile-summary-toggle"
            aria-expanded={summaryExpanded}
            aria-controls="assembly-summary-content"
            onClick={() => setSummaryExpanded((open) => !open)}
          >
            <span>
              Subtotal acadêmico
              <strong>{money(storePreview.knownSubtotalCents)}</strong>
            </span>
            <span>
              {selectedCount} categorias ·{" "}
              {summaryExpanded ? "Recolher" : "Ver resumo"}
            </span>
          </button>
          <div className="build-summary-content" id="assembly-summary-content">
            <h2>Sua montagem</h2>
            <div className="live-build-total" aria-live="polite">
              <span>Subtotal acadêmico da seleção</span>
              <strong>
                {selectedCount
                  ? money(storePreview.knownSubtotalCents)
                  : money(0)}
              </strong>
              <small>
                {selectedParts.reduce(
                  (sum, p) => sum + (options.quantities[p.id] ?? 1),
                  0,
                )}{" "}
                unidade(s) · {selectedCount} categorias
                {storePreview.hasUnavailableProducts
                  ? " · há itens para revisar"
                  : ""}
              </small>
            </div>
            <label className="field-label">
              Nome da montagem
              <input
                value={name}
                maxLength={80}
                onChange={(event) => {
                  setName(event.target.value);
                  setSavedId(null);
                }}
                disabled={busy || initializing}
              />
            </label>
            <details className="builder-reference-prices">
              <summary>Comparar referências das lojas</summary>
              <label className="field-label">
                Forma de pagamento da referência
                <select
                  value={payment}
                  disabled={busy || initializing}
                  onChange={(event) => {
                    setPayment(event.target.value);
                    setAnalysis(null);
                  }}
                >
                  <option value="pix">PIX</option>
                  <option value="cash">Boleto / à vista</option>
                  <option value="card">Cartão, valor total</option>
                </select>
              </label>
              <div className="build-summary-price">
                <span>Menor total combinado, sem frete</span>
                <strong>
                  {analysis?.comparison.optimized.complete
                    ? money(analysis.comparison.optimized.totalCents)
                    : "Cotação incompleta"}
                </strong>
                <small>
                  {analysis
                    ? `${analysis.comparison.optimized.choices.filter((choice) => choice.offer).length} de ${selectedCount} peça(s) com oferta elegível.`
                    : "Faça a análise para consultar o conjunto."}
                </small>
              </div>
            </details>
            {analysis?.storeQuote && (
              <div className="build-summary-price">
                <span>Compra simulada na DreamBuild</span>
                <strong>
                  {analysis.storeQuote.totalCents === null
                    ? "Sem estoque integral"
                    : money(analysis.storeQuote.totalCents)}
                </strong>
                <small>
                  Saldo e preço próprios, separados das referências das lojas.
                </small>
              </div>
            )}
            <button
              className="primary-button"
              type="button"
              disabled={busy || initializing || selectedCount === 0}
              onClick={analyze}
            >
              {busy ? "Aguarde..." : "Analisar montagem"}
            </button>
            <button
              className="secondary-button"
              type="button"
              disabled={busy || initializing || selectedCount === 0}
              onClick={save}
            >
              {auth.user ? "Salvar montagem" : "Entrar para salvar"}
            </button>
            {savedId &&
              analysis?.compatible &&
              analysis?.storeQuote &&
              !analysis.storeQuote.hasUnavailableProducts && (
                <Link className="primary-button" to={`/finalizar/${savedId}`}>
                  Continuar para compra simulada
                </Link>
              )}
            {savedId && analysis?.compatible && (
              <Link className="secondary-button" to={`/bancada/${savedId}`}>
                Abrir bancada didática
              </Link>
            )}
            <p className="field-help">
              Salvar cria um registro na sua conta. A compra será inteiramente
              simulada. Nenhum valor será cobrado.
            </p>
          </div>
        </aside>
      </div>
      {analysis && (
        <>
          <section className="build-analysis" aria-labelledby="analysis-title">
            <div className="section-title-row">
              <div>
                <h2 id="analysis-title">Análise do conjunto</h2>
                <p>
                  {!analysis.complete
                    ? `Faltam: ${analysis.missingCategories.map((category) => categoryNames[category]).join(", ")}.`
                    : analysis.compatible
                      ? "Sem incompatibilidades nos critérios cadastrados. Confira também os avisos."
                      : "Há incompatibilidades que precisam ser corrigidas."}
                </p>
              </div>
              <span
                className={`analysis-badge ${analysis.compatible ? "is-compatible" : "needs-review"}`}
              >
                {analysis.compatible
                  ? "Critérios verificados"
                  : "Revisar montagem"}
              </span>
            </div>
            <div className="power-summary">
              <div>
                <span>Referências + reserva auxiliar</span>
                <strong>
                  {analysis.totalWatts === null
                    ? "Não calculado"
                    : `${analysis.totalWatts} W`}
                </strong>
              </div>
              <div>
                <span>Com margem de 25%</span>
                <strong>
                  {analysis.powerWithMarginWatts === null
                    ? "Não calculado"
                    : `${analysis.powerWithMarginWatts} W`}
                </strong>
              </div>
              <div>
                <span>Fonte recomendada nesta análise</span>
                <strong>
                  {analysis.recommendedPsuWatts === null
                    ? "Não calculado"
                    : `${analysis.recommendedPsuWatts} W`}
                </strong>
              </div>
            </div>
            <p className="analysis-method">
              Estimativa didática: maior referência cadastrada entre TDP e
              potência máxima da CPU + potência de referência da GPU + reserva
              de 50 W, com margem de 25%. Adotamos o maior valor entre esse
              cálculo e a recomendação cadastrada do fabricante da GPU. Sem essa
              recomendação, não indicamos uma fonte. Não é medição elétrica nem
              previsão exata de picos.
            </p>
            <ul className="analysis-notes">
              {analysis.notes.map((note) => (
                <li
                  key={note.code}
                  className={
                    note.level === "error"
                      ? "analysis-error"
                      : "analysis-warning"
                  }
                >
                  {note.level === "error" ? (
                    <TriangleAlert size={18} aria-hidden="true" />
                  ) : (
                    <Info size={18} aria-hidden="true" />
                  )}
                  <span>{note.message}</span>
                </li>
              ))}
            </ul>
          </section>
          <StoreComparison comparison={analysis.comparison} />
        </>
      )}
      {pickerCategory && (
        <ComponentPicker
          onRefresh={onCatalogRefresh}
          key={pickerCategory}
          category={pickerCategory}
          products={products}
          selectedId={partIds[pickerCategory]}
          parts={selectedParts}
          quantities={options.quantities}
          addingStorage={addingStorage}
          powerAnalysis={analysis || powerPreview}
          onClose={() => setPickerCategory(null)}
          onRemove={() => {
            change(pickerCategory, "");
            setPickerCategory(null);
          }}
          onResetPlatform={() => clearSelection(true)}
          onChoose={(id) => {
            if (addingStorage ? addStorage(id) : change(pickerCategory, id))
              setPickerCategory(null);
          }}
        />
      )}
    </section>
  );
}
