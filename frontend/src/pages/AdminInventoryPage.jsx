import { useEffect, useRef, useState } from "react";
import {
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  RefreshCw,
  X,
  PackageCheck,
  Search,
} from "lucide-react";
import AdminNav from "../components/AdminNav.jsx";
import { apiRequest, listRecords } from "../api/client.js";
import { money, bestOffer } from "../data/offers.js";
import { categoryNames } from "../data/hardwareFields.js";
import { inventoryState } from "../../../shared/inventory.js";
import "../inventory.css";

const types = {
  entry: "Receber produtos",
  exit: "Registrar saída",
  count: "Conferir inventário",
  settings: "Preço e alerta",
};
const movementNames = {
  entry: "Entrada",
  exit: "Saída manual",
  count: "Inventário",
  settings: "Configuração",
  sale: "Venda simulada",
};
const emptyStock = {
  quantity: 0,
  unitPriceCents: null,
  version: 0,
  reorderPoint: 3,
  configured: false,
};
const searchValue = (text) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
export default function AdminInventoryPage({ products, refreshCatalog }) {
  const [records, setRecords] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(null),
    [message, setMessage] = useState(null);
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState("all"),
    [filter, setFilter] = useState("all"),
    [page, setPage] = useState(0);
  const [dialog, setDialog] = useState(null),
    [form, setForm] = useState(null),
    [saving, setSaving] = useState(false),
    [formError, setFormError] = useState(null);
  const modal = useRef(null),
    revision = useRef(0);
  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRecords(await listRecords("/admin/inventory"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (dialog && modal.current && !modal.current.open)
      modal.current.showModal();
  }, [Boolean(dialog)]);
  const byId = new Map(records.map((s) => [s.componentId, s]));
  const rows = products.map((product) => ({
    product,
    stock: byId.get(product.id) || emptyStock,
  }));
  const configured = rows.filter((r) => r.stock.configured),
    units = configured.reduce((sum, r) => sum + r.stock.quantity, 0);
  const low = configured.filter(
    (r) => r.stock.quantity > 0 && r.stock.quantity <= r.stock.reorderPoint,
  ).length;
  const zero = configured.filter((r) => r.stock.quantity === 0).length;
  const filtered = rows.filter(
    ({ product, stock }) =>
      (category === "all" || product.category === category) &&
      searchValue(`${product.name} ${product.model} ${product.brand}`).includes(
        searchValue(search),
      ) &&
      (filter === "all" ||
        (filter === "unconfigured" && !stock.configured) ||
        (filter === "zero" && stock.configured && stock.quantity === 0) ||
        (filter === "low" &&
          stock.configured &&
          stock.quantity > 0 &&
          stock.quantity <= stock.reorderPoint)),
  );
  const lastPage = Math.max(0, Math.ceil(filtered.length / 25) - 1),
    currentPage = Math.min(page, lastPage),
    visible = filtered.slice(currentPage * 25, currentPage * 25 + 25);
  function close() {
    if (saving) return;
    revision.current++;
    setDialog(null);
    setForm(null);
    setFormError(null);
  }
  async function open(product, type = "entry") {
    const version = ++revision.current;
    setDialog({ product, loading: true, stock: emptyStock, movements: [] });
    setForm(null);
    setFormError(null);
    try {
      const detail = await apiRequest(`/admin/inventory/${product.id}`);
      if (version !== revision.current) return;
      setDialog({
        product,
        loading: false,
        ...detail,
        stock: detail.inventory,
      });
      setForm({
        type,
        quantity:
          type === "settings"
            ? "0"
            : type === "count"
              ? String(detail.inventory.quantity)
              : "1",
        price: (
          (detail.inventory.unitPriceCents ||
            bestOffer(product)?.priceCents ||
            0) / 100
        ).toFixed(2),
        reorderPoint: String(detail.inventory.reorderPoint),
        reason: "",
        expectedVersion: detail.inventory.version,
        idempotencyKey: crypto.randomUUID(),
      });
    } catch (e) {
      if (version === revision.current) {
        setDialog((d) => ({ ...d, loading: false }));
        setFormError(e.message);
      }
    }
  }
  function change(key, value) {
    setForm((f) => ({
      ...f,
      [key]: value,
      idempotencyKey: crypto.randomUUID(),
      ...(key === "type"
        ? {
            quantity:
              value === "settings"
                ? "0"
                : value === "count"
                  ? String(dialog.stock.quantity)
                  : "1",
          }
        : {}),
    }));
  }
  async function save(event) {
    event.preventDefault();
    if (saving || !form) return;
    setSaving(true);
    setFormError(null);
    try {
      const result = await apiRequest(
        `/admin/inventory/${dialog.product.id}/movements`,
        {
          method: "POST",
          body: {
            type: form.type,
            quantity: Number(form.quantity),
            unitPriceCents: Math.round(Number(form.price) * 100),
            reorderPoint: Number(form.reorderPoint),
            reason: form.reason,
            expectedVersion: form.expectedVersion,
            idempotencyKey: form.idempotencyKey,
          },
        },
      );
      setRecords((previous) => [
        ...previous.filter((s) => s.componentId !== dialog.product.id),
        result.inventory,
      ]);
      setMessage(
        `${dialog.product.name}: saldo de ${result.inventory.quantity} unidade(s). ${result.replayed ? "A tentativa já estava registrada." : "Movimentação registrada."}`,
      );
      revision.current++;
      setDialog(null);
      setForm(null);
      try {
        await refreshCatalog();
      } catch {
        setError(
          "O saldo foi salvo. Atualize a vitrine para conferir a disponibilidade.",
        );
      }
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="admin-page inventory-page">
      <AdminNav />
      <header className="inventory-heading">
        <div>
          <p className="inventory-eyebrow">OPERAÇÃO DREAMBUILD</p>
          <h1>Estoque de produtos</h1>
          <p>Saldo próprio, preço simulado e histórico de cada peça.</p>
        </div>
        <button className="secondary-button" disabled={loading} onClick={load}>
          <RefreshCw size={16} /> Atualizar saldos
        </button>
      </header>
      <div className="inventory-metrics" aria-label="Resumo do estoque">
        <div>
          <Boxes size={21} />
          <span>Produtos cadastrados</span>
          <strong>
            {configured.length}
            <small> / {products.length}</small>
          </strong>
        </div>
        <div>
          <PackageCheck size={21} />
          <span>Unidades disponíveis</span>
          <strong>{units}</strong>
        </div>
        <div className="inventory-warning">
          <ArrowUpFromLine size={21} />
          <span>Abaixo do alerta</span>
          <strong>{low}</strong>
        </div>
        <div>
          <History size={21} />
          <span>Produtos sem saldo</span>
          <strong>{zero}</strong>
        </div>
      </div>
      <p className="inventory-explanation">
        Estoque acadêmico da DreamBuild. As ofertas externas continuam na
        comparação de lojas. Produtos sem cadastro começam com saldo zero.
      </p>
      {message && (
        <p className="form-success" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="inventory-controls">
        <label className="inventory-search">
          <Search size={18} />
          <span className="sr-only">Buscar no estoque</span>
          <input
            type="search"
            placeholder="Buscar por produto, marca ou modelo"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <label>
          Categoria
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(0);
            }}
          >
            <option value="all">Todas as categorias</option>
            {Object.entries(categoryNames).map(([id, name]) => (
              <option value={id} key={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Situação
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(0);
            }}
          >
            <option value="all">Todo o estoque</option>
            <option value="low">Estoque baixo</option>
            <option value="zero">Sem saldo</option>
            <option value="unconfigured">Sem cadastro</option>
          </select>
        </label>
      </div>
      <div className="inventory-table-wrap" aria-busy={loading}>
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Saldo</th>
              <th>Preço DreamBuild</th>
              <th>Situação</th>
              <th>
                <span className="sr-only">Gerenciar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map(({ product, stock }) => (
              <tr key={product.id}>
                <td>
                  <div className="inventory-product">
                    <img
                      src={product.image}
                      alt=""
                      loading="lazy"
                      width={56}
                      height={56}
                    />
                    <div>
                      <strong>{product.name}</strong>
                      <small>
                        {product.model} · {product.categoryName}
                      </small>
                    </div>
                  </div>
                </td>
                <td>
                  <strong className="inventory-quantity">
                    {stock.quantity}
                  </strong>
                  <small className="inventory-units"> un.</small>
                </td>
                <td>
                  {stock.unitPriceCents
                    ? money(stock.unitPriceCents)
                    : "A cadastrar"}
                </td>
                <td>
                  <span
                    className={`inventory-status ${!stock.configured ? "unconfigured" : stock.quantity === 0 ? "empty" : stock.quantity <= stock.reorderPoint ? "low" : "available"}`}
                  >
                    {!stock.configured
                      ? "Sem cadastro"
                      : stock.quantity === 0
                        ? "Sem saldo"
                        : stock.quantity <= stock.reorderPoint
                          ? "Estoque baixo"
                          : "Disponível"}
                  </span>
                </td>
                <td>
                  <button
                    className="secondary-button inventory-manage"
                    onClick={() => open(product)}
                    aria-label={`Gerenciar estoque de ${product.name}`}
                  >
                    <ArrowDownToLine size={16} /> Gerenciar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && !loading && (
          <p className="inventory-empty">
            Nenhum produto corresponde aos filtros.
          </p>
        )}
        {loading && (
          <p className="inventory-loading" role="status">
            Conferindo saldos no banco...
          </p>
        )}
      </div>
      <nav className="inventory-pagination" aria-label="Páginas do estoque">
        <span>
          {filtered.length} produtos · página {currentPage + 1} de{" "}
          {lastPage + 1}
        </span>
        <div>
          <button
            className="secondary-button"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
          >
            Anterior
          </button>
          <button
            className="secondary-button"
            disabled={currentPage === lastPage}
            onClick={() => setPage(currentPage + 1)}
          >
            Próxima
          </button>
        </div>
      </nav>
      {dialog && (
        <dialog
          ref={modal}
          className="inventory-dialog"
          aria-labelledby="inventory-dialog-title"
          onCancel={(e) => {
            e.preventDefault();
            close();
          }}
        >
          <header>
            <div>
              <p className="inventory-eyebrow">MOVIMENTAÇÃO DE ESTOQUE</p>
              <h2 id="inventory-dialog-title">{dialog.product.name}</h2>
            </div>
            <button
              type="button"
              className="inventory-close"
              disabled={saving}
              onClick={close}
              aria-label="Fechar movimentação"
            >
              <X size={22} />
            </button>
          </header>
          {dialog.loading ? (
            <p role="status">Consultando saldo e movimentações...</p>
          ) : (
            <>
              <div className="inventory-current">
                <img src={dialog.product.image} alt="" width={70} height={70} />
                <div>
                  <span>Saldo atual</span>
                  <strong>
                    {dialog.stock.quantity} <small>unidades</small>
                  </strong>
                </div>
              </div>
              {form && (
                <form onSubmit={save}>
                  <fieldset disabled={saving}>
                    <legend className="sr-only">Dados da movimentação</legend>
                    <label>
                      Operação
                      <select
                        value={form.type}
                        onChange={(e) => change("type", e.target.value)}
                      >
                        {Object.entries(types).map(([id, label]) => (
                          <option key={id} value={id}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="inventory-form-grid">
                      {form.type !== "settings" && (
                        <label>
                          {form.type === "count"
                            ? "Quantidade contada (saldo final)"
                            : "Quantidade a movimentar"}
                          <input
                            required
                            type="number"
                            min={form.type === "count" ? 0 : 1}
                            max="1000000"
                            step="1"
                            value={form.quantity}
                            onChange={(e) => change("quantity", e.target.value)}
                          />
                        </label>
                      )}
                      <label>
                        Preço simulado da unidade (R$)
                        <input
                          required
                          type="number"
                          min="0.01"
                          max="10000000"
                          step="0.01"
                          value={form.price}
                          onChange={(e) => change("price", e.target.value)}
                        />
                      </label>
                      <label>
                        Alertar quando restarem
                        <input
                          required
                          type="number"
                          min="0"
                          max="1000000"
                          step="1"
                          value={form.reorderPoint}
                          onChange={(e) =>
                            change("reorderPoint", e.target.value)
                          }
                        />
                      </label>
                    </div>
                    <label>
                      Motivo
                      <textarea
                        required
                        minLength={3}
                        maxLength={200}
                        rows={2}
                        value={form.reason}
                        onChange={(e) => change("reason", e.target.value)}
                        placeholder="Ex.: recebimento para demonstração, avaria ou contagem física"
                      />
                    </label>
                    <p className="field-help">
                      O preço informado será usado na compra acadêmica da
                      DreamBuild. Referências de outras lojas permanecem
                      separadas.
                    </p>
                  </fieldset>
                  {formError && (
                    <div className="form-error" role="alert">
                      {formError}{" "}
                      <button
                        type="button"
                        className="text-button"
                        disabled={saving}
                        onClick={() => open(dialog.product, form.type)}
                      >
                        Consultar saldo novamente
                      </button>
                    </div>
                  )}
                  <footer>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={saving}
                      onClick={close}
                    >
                      Cancelar
                    </button>
                    <button className="primary-button" disabled={saving}>
                      {saving ? "Registrando..." : "Confirmar movimentação"}
                    </button>
                  </footer>
                </form>
              )}
              {!form && formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}
              <section className="inventory-history">
                <h3>
                  <History size={18} /> Últimas movimentações
                </h3>
                {!dialog.movements?.length ? (
                  <p>Nenhuma movimentação registrada para esta peça.</p>
                ) : (
                  <ol>
                    {dialog.movements.map((m) => (
                      <li key={m.id}>
                        <div>
                          <strong>{movementNames[m.type] || m.type}</strong>
                          <time>
                            {new Date(m.createdAt).toLocaleString("pt-BR")}
                          </time>
                        </div>
                        <span className={m.delta > 0 ? "positive" : ""}>
                          {m.delta > 0 ? "+" : ""}
                          {m.delta} un. · saldo {m.after}
                        </span>
                        <p>{m.reason}</p>
                        <small>
                          {m.actorName ||
                            (m.type === "sale"
                              ? "Pedido aprovado"
                              : "Administração")}
                          {m.orderId
                            ? ` · pedido #${m.orderId.slice(-8).toUpperCase()}`
                            : ""}
                        </small>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </>
          )}
        </dialog>
      )}
    </section>
  );
}
