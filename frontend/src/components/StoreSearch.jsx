import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowUpRight, Search } from "lucide-react";
import { inventoryState } from "../../../shared/inventory.js";
import { money } from "../data/offers.js";
import { platformOf } from "../data/componentSelection.js";
const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();

export default function StoreSearch({
  products,
  value,
  onChange,
  onSubmit,
  loading = false,
}) {
  const [open, setOpen] = useState(false),
    [active, setActive] = useState(-1);
  const root = useRef(null),
    input = useRef(null),
    listId = useId(),
    navigate = useNavigate();
  const term = normalize(value);
  const matches = useMemo(() => {
    if (!term) return [];
    const tokens = term.split(/\s+/);
    return products
      .filter((p) => {
        const text = normalize(
          [
            p.brand,
            p.name,
            p.fullName,
            p.model,
            p.categoryName,
            platformOf(p),
          ].join(" "),
        );
        return tokens.every((token) => text.includes(token));
      })
      .sort(
        (a, b) =>
          Number(normalize(b.name).startsWith(term)) -
            Number(normalize(a.name).startsWith(term)) ||
          Number(inventoryState(b.inventory).quantity > 0) -
            Number(inventoryState(a.inventory).quantity > 0),
      );
  }, [products, term]);
  const discovery = !value.trim();
  const recommended = useMemo(
    () =>
      ["gpu", "cpu", "ram", "storage"]
        .map((category) =>
          products.find(
            (p) =>
              p.category === category &&
              inventoryState(p.inventory).configured &&
              inventoryState(p.inventory).quantity > 0,
          ),
        )
        .filter(Boolean),
    [products],
  );
  const suggestions = discovery ? recommended : matches.slice(0, 6),
    expanded = open;
  useEffect(() => {
    setActive(-1);
  }, [value, products]);
  useEffect(() => {
    if (active >= 0)
      document
        .getElementById(`${listId}-${active}`)
        ?.scrollIntoView?.({ block: "nearest" });
  }, [active, listId]);
  useEffect(() => {
    if (!expanded) return;
    const close = (e) => {
      if (!root.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [expanded]);
  function choose(product) {
    setOpen(false);
    setActive(-1);
    input.current?.blur();
    navigate(`/produto/${product.slug}`);
  }
  function submit() {
    setOpen(false);
    setActive(-1);
    input.current?.blur();
    onSubmit();
  }
  function keyboard(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setActive(-1);
      return;
    }
    if (event.key === "ArrowDown" && suggestions.length) {
      event.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % suggestions.length);
    }
    if (event.key === "ArrowUp" && suggestions.length) {
      event.preventDefault();
      setOpen(true);
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    }
    if (
      event.key === "Enter" &&
      expanded &&
      active >= 0 &&
      suggestions[active]
    ) {
      event.preventDefault();
      choose(suggestions[active]);
    }
  }
  return (
    <form
      ref={root}
      className="store-search"
      role="search"
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <label className="sr-only" htmlFor="hardware-search">
        Buscar produtos
      </label>
      <input
        ref={input}
        id="hardware-search"
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={
          expanded && active >= 0 ? `${listId}-${active}` : undefined
        }
        autoComplete="off"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={keyboard}
        placeholder="Busque por peça, modelo ou marca"
      />
      <button type="submit" aria-label="Buscar produtos">
        <Search size={22} aria-hidden="true" />
      </button>
      {expanded && (
        <div
          className={`search-suggestions ${discovery ? "search-discovery" : ""}`}
        >
          <header>
            <span>
              {loading
                ? "Carregando catálogo…"
                : discovery
                  ? "Encontre seu próximo upgrade"
                  : `${matches.length} ${matches.length === 1 ? "produto encontrado" : "produtos encontrados"}`}
            </span>
            <small>Produtos e modelos</small>
          </header>
          {discovery && (
            <div className="search-category-shortcuts">
              <strong>Explore por categoria</strong>
              {[
                "Processador AMD",
                "Processador Intel",
                "Placa de vídeo",
                "Memória DDR4",
                "Memória DDR5",
                "SSD",
                "Water cooler",
              ].map((label) => (
                <button
                  key={label}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(label);
                    setActive(-1);
                    input.current?.focus();
                    setOpen(true);
                  }}
                >
                  <Search size={14} />
                  {label}
                </button>
              ))}
            </div>
          )}
          <ul id={listId} role="listbox" aria-label="Sugestões de produtos">
            {suggestions.map((product, index) => {
              const stock = inventoryState(product.inventory);
              return (
                <li
                  key={product.id}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={active === index}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(product)}
                  onPointerMove={() => setActive(index)}
                >
                  <img src={product.image} alt="" width={52} height={52} />
                  <span>
                    <strong>{product.name}</strong>
                    <small>
                      {product.categoryName} · {product.brand}
                    </small>
                    <small>
                      {stock.quantity > 0
                        ? `${stock.quantity} unidades no estoque simulado`
                        : "Sem saldo para compra"}
                    </small>
                  </span>
                  <span className="search-suggestion-price">
                    <b>
                      {stock.configured
                        ? money(stock.unitPriceCents)
                        : "Preço pendente"}
                    </b>
                    <small>Preço acadêmico</small>
                  </span>
                </li>
              );
            })}
          </ul>
          {!suggestions.length && !loading && (
            <p className="search-no-results" role="status">
              Nenhum modelo encontrado. Experimente o nome da peça, marca ou
              código do produto.
            </p>
          )}
          <a
            href="/#produtos"
            className="search-all-results"
            onClick={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            {discovery ? "Explorar todo o catálogo" : "Ver todos os resultados"}{" "}
            <ArrowUpRight size={15} />
          </a>
        </div>
      )}
    </form>
  );
}
