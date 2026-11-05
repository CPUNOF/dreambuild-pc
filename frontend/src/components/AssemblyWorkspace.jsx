import { ArrowLeft, ArrowRight, Check, Plus, Wrench, X } from "lucide-react";
import { categoryNames } from "../data/hardwareFields.js";
import { money } from "../data/offers.js";
import { inventoryState } from "../../../shared/inventory.js";
import ComponentFacts from "./ComponentFacts.jsx";
import { useEffect, useRef } from "react";

export const assemblySteps = [
  "cpu",
  "mobo",
  "ram",
  "gpu",
  "storage",
  "psu",
  "case",
  "cooler",
];
const guidance = {
  cpu: "O processador define a plataforma. Escolha a placa-mãe compatível na próxima etapa.",
  mobo: "Confira o socket e a geração de memória. Os slots desta placa aparecem junto da escolha.",
  ram: "Escolha o kit e ajuste a quantidade aqui. Um kit pode ocupar mais de um slot da placa-mãe.",
  gpu: "Compare a memória de vídeo e confira os requisitos de fonte e espaço no gabinete.",
  storage:
    "Adicione SSDs ou HDs e ajuste as unidades. A distribuição das conexões acompanha cada escolha.",
  psu: "A fonte deve atender à potência recomendada e aos conectores do conjunto. Consulte a análise antes de concluir.",
  case: "Confira o formato da placa-mãe, o espaço para a GPU e a altura do cooler ou tamanho do radiador.",
  cooler:
    "O cooler separado pode ser opcional. Confira a necessidade da CPU e os sockets suportados.",
};

export default function AssemblyWorkspace({
  products,
  partIds,
  disabled,
  onPick,
  onRemove,
  activeCategory,
  onActiveCategory,
  children,
  resources,
  onFinish,
  completionError,
}) {
  const category = activeCategory || "cpu",
    step = assemblySteps.indexOf(category);
  const product = products.find((p) => p.id === partIds[category]);
  const required = assemblySteps.filter(
    (c) => c !== "cooler" || !resources?.cooling.included,
  );
  const count = required.filter((c) => partIds[c]).length;
  const stock = inventoryState(product?.inventory);
  const navigation = useRef(null);
  useEffect(() => {
    if (completionError)
      document
        .querySelector(".assembly-completion .form-error")
        ?.scrollIntoView?.({ block: "nearest" });
  }, [completionError]);
  useEffect(() => {
    const element = navigation.current;
    const reveal = () => {
      const active = element
        .querySelector('[aria-current="step"]')
        ?.closest(".assembly-step");
      if (active && element.scrollWidth > element.clientWidth)
        element.scrollLeft = active.offsetLeft - element.offsetLeft - 12;
    };
    reveal();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(reveal);
    observer.observe(element);
    return () => observer.disconnect();
  }, [category]);
  function select(next, open = false) {
    onActiveCategory(next);
    if (open) onPick(next);
  }
  return (
    <section className="workbench-v2" aria-label="Montagem do PC por etapas">
      <header className="workspace-heading">
        <div>
          <p className="section-kicker">SUA BANCADA</p>
          <h2>Monte seu próximo PC.</h2>
        </div>
        <span className="workspace-progress" role="status">
          {count}/{required.length} etapas obrigatórias{" "}
          <small>
            {resources?.cooling.included
              ? "Cooler extra é opcional"
              : "Confira a refrigeração da CPU"}
          </small>
        </span>
      </header>
      <div
        className="assembly-progress-track"
        role="progressbar"
        aria-label="Categorias selecionadas"
        aria-valuemin={0}
        aria-valuemax={required.length}
        aria-valuenow={count}
      >
        <span style={{ width: `${(count / required.length) * 100}%` }} />
      </div>
      <div className="workspace-columns">
        <nav
          ref={navigation}
          className="assembly-steps"
          aria-label="Etapas da montagem"
        >
          {assemblySteps.map((c, index) => {
            const selected = products.find((p) => p.id === partIds[c]);
            const optional = c === "cooler" && resources?.cooling.included;
            return (
              <div
                className={`assembly-step ${category === c ? "is-active" : ""}`}
                key={c}
              >
                <button
                  type="button"
                  aria-current={category === c ? "step" : undefined}
                  disabled={disabled}
                  onClick={() => select(c, !selected)}
                >
                  <span
                    className={`assembly-step-number ${selected ? "is-done" : ""}`}
                  >
                    {selected ? <Check size={14} /> : index + 1}
                  </span>
                  {selected && (
                    <img src={selected.image} alt="" width={38} height={38} />
                  )}
                  <span>
                    <strong>{categoryNames[c]}</strong>
                    <small>
                      {selected
                        ? selected.name
                        : optional
                          ? "Opcional · CPU com cooler"
                          : "Escolher componente"}
                    </small>
                  </span>
                </button>
                {selected && (
                  <button
                    className="assembly-step-remove"
                    type="button"
                    aria-label={`Remover ${categoryNames[c]}`}
                    disabled={disabled}
                    onClick={() => onRemove(c)}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </nav>
        <div className="assembly-editor">
          <header className="assembly-editor-heading">
            <div>
              <p className="section-kicker">ETAPA {step + 1} DE 8</p>
              <h3>{categoryNames[category]}</h3>
            </div>
            <span>
              {product
                ? "Na sua montagem"
                : category === "cooler" && resources?.cooling.included
                  ? "Opcional"
                  : "Escolha um modelo"}
            </span>
          </header>
          <footer className="assembly-step-controls">
            <button
              type="button"
              className="secondary-button"
              disabled={disabled || step === 0}
              onClick={() => select(assemblySteps[step - 1])}
            >
              <ArrowLeft size={16} /> Voltar
            </button>
            <span>
              {step + 1} de 8 · {categoryNames[category]}
            </span>
            <button
              type="button"
              className="primary-button"
              disabled={disabled}
              onClick={() =>
                step === 7
                  ? onFinish?.("cart")
                  : select(assemblySteps[step + 1])
              }
            >
              {step === 7 ? "Finalizar e ir ao carrinho" : "Próxima peça"}{" "}
              <ArrowRight size={16} />
            </button>
          </footer>
          <p className="assembly-guidance">{guidance[category]}</p>
          {product && !["ram", "storage"].includes(category) && (
            <article className="assembly-product-row">
              <img
                className="assembly-product-photo"
                src={product.image}
                alt={product.name}
                width={100}
                height={100}
              />
              <div className="assembly-product-info">
                <small>{product.brand}</small>
                <h4>{product.name}</h4>
                <ComponentFacts product={product} />
                <button
                  className="text-button"
                  type="button"
                  onClick={() => onPick(category)}
                  disabled={disabled}
                >
                  Trocar modelo
                </button>
              </div>
              <div className="assembly-product-price">
                <small>Compra simulada</small>
                <strong>
                  {stock.configured
                    ? money(stock.unitPriceCents)
                    : "Preço pendente"}
                </strong>
                <small>{stock.quantity} unidades em estoque</small>
              </div>
              <button
                className="assembly-remove"
                type="button"
                aria-label={`Remover ${product.name}`}
                onClick={() => onRemove(category)}
                disabled={disabled}
              >
                <X size={18} />
              </button>
            </article>
          )}
          {!product && !["ram", "storage"].includes(category) && (
            <div className="assembly-empty">
              <Wrench size={30} />
              <h4>
                {category === "cooler" && resources?.cooling.included
                  ? "Seu processador já inclui cooler."
                  : `Vamos escolher ${categoryNames[category].toLowerCase()}?`}
              </h4>
              <p>
                Veja fotos, especificações e compatibilidade antes de
                selecionar.
              </p>
              <button
                className="primary-button"
                type="button"
                onClick={() => onPick(category)}
                disabled={disabled}
              >
                <Plus size={17} />
                {category === "cooler" && resources?.cooling.included
                  ? "Ver coolers opcionais"
                  : `Escolher ${categoryNames[category].toLowerCase()}`}
              </button>
            </div>
          )}
          {children}
          {step === 7 && (
            <section
              className="assembly-completion"
              aria-label="Finalizar montagem"
            >
              <h3>Qual é o próximo passo do seu PC?</h3>
              <p>
                Envie ao carrinho, teste o desempenho ou publique no ranking. A
                compatibilidade é verificada antes de continuar.
              </p>
              {completionError && (
                <p className="form-error" role="alert">
                  {completionError}
                </p>
              )}
              <div>
                <button
                  type="button"
                  className="primary-button"
                  disabled={disabled}
                  onClick={() => onFinish?.("cart")}
                >
                  Adicionar PC ao carrinho
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={disabled}
                  onClick={() => onFinish?.("benchmark")}
                >
                  Testar desempenho
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={disabled}
                  onClick={() => onFinish?.("publish")}
                >
                  Publicar no ranking
                </button>
              </div>
            </section>
          )}
          {product && !["ram", "storage"].includes(category) && (
            <p className="assembly-compatibility-note">
              {product.compatibilityNote}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
