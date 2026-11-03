import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import AdminProductForm from "../components/AdminProductForm.jsx";
import { apiRequest } from "../api/client.js";
import AdminNav from "../components/AdminNav.jsx";
import { Link } from "react-router";
export default function AdminPage({ products, refreshCatalog }) {
  const [editing, setEditing] = useState(undefined);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [metrics, setMetrics] = useState(null);
  useEffect(() => {
    let active = true;
    apiRequest("/admin/metrics")
      .then((result) => {
        if (active) setMetrics(result);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [products.length]);
  async function saved() {
    await refreshCatalog();
    setEditing(undefined);
    setMessage("Produto salvo no catálogo.");
    setError(null);
  }
  async function remove(product) {
    if (
      !window.confirm(
        `Remover ${product.name} do catálogo? Montagens antigas continuarão com seu registro histórico.`,
      )
    )
      return;
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/admin/components/${product.id}`, { method: "DELETE" });
      await refreshCatalog();
      setMessage("Produto removido.");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading">
        <div>
          <p>ADMINISTRAÇÃO</p>
          <h1>Catálogo e ofertas</h1>
          <p>Gerencie os produtos e registre consultas às lojas.</p>
        </div>
        <Link className="secondary-button" to="/admin/estoque">
          Gerenciar estoque DreamBuild
        </Link>
        {editing === undefined && (
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setEditing(null);
              setMessage(null);
            }}
          >
            <Plus size={17} aria-hidden="true" />
            Novo produto
          </button>
        )}
      </div>
      <div className="admin-metrics">
        {[
          ["components", "Peças"],
          ["users", "Contas"],
          ["builds", "Montagens"],
          ["simulated_orders", "Pedidos simulados"],
          ["games_benchmark", "Cenários"],
        ].map(([key, label]) => (
          <div key={key}>
            <span>{label}</span>
            <strong>{metrics?.[key] ?? "—"}</strong>
          </div>
        ))}
      </div>
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
      {editing !== undefined ? (
        <AdminProductForm
          key={editing?.id || "new"}
          product={editing}
          onDone={saved}
          onCancel={() => setEditing(undefined)}
        />
      ) : (
        <div className="admin-product-list">
          {products.map((product) => (
            <article key={product.id}>
              <img src={product.image} alt="" width={64} height={64} />
              <div>
                <span>{product.categoryName}</span>
                <h2>{product.name}</h2>
                <p>
                  {product.model} · {(product.offers || []).length} oferta(s)
                </p>
              </div>
              <div className="admin-row-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={busy}
                  onClick={() => {
                    setEditing(product);
                    setMessage(null);
                  }}
                >
                  <Pencil size={15} aria-hidden="true" />
                  Editar
                </button>
                <button
                  type="button"
                  className="text-button danger-text"
                  disabled={busy}
                  onClick={() => remove(product)}
                  aria-label={`Remover ${product.name}`}
                >
                  <Trash2 size={17} aria-hidden="true" />
                  <span>Remover</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
