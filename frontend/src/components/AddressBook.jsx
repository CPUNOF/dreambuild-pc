import { useEffect, useState } from "react";
import { MapPin, Plus, Pencil, Trash2, Check } from "lucide-react";
import { apiRequest } from "../api/client.js";
const empty = {
  label: "",
  recipient: "",
  postalCode: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "SP",
};
const fields = [
  ["label", "Nome do endereço", "Casa", 30],
  ["recipient", "Destinatário", "Cliente de demonstração", 80],
  ["postalCode", "CEP", "01001-000", 9],
  ["street", "Rua / avenida", "Rua de demonstração", 100],
  ["number", "Número", "100", 12],
  ["complement", "Complemento (opcional)", "Apartamento 10", 80],
  ["district", "Bairro", "Centro", 60],
  ["city", "Cidade", "São Paulo", 60],
];
export function AddressText({ address }) {
  return (
    <>
      <strong>
        {address.label} · {address.recipient}
      </strong>
      <span>
        {address.street}, {address.number}
        {address.complement ? ` · ${address.complement}` : ""}
      </span>
      <span>
        {address.district} · {address.city}/{address.state} · CEP{" "}
        {address.postalCode}
      </span>
    </>
  );
}
export default function AddressBook({
  selected,
  onChoose,
  manage = false,
  disabled = false,
}) {
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(null),
    [editing, setEditing] = useState(null),
    [form, setForm] = useState(empty),
    [save, setSave] = useState(true),
    [busy, setBusy] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    apiRequest("/account/addresses")
      .then((data) => {
        if (!active) return;
        setItems(data);
        if (!selected)
          onChoose?.(data.find((a) => a.isDefault) || data[0] || null);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  async function mutate(path, method, body) {
    setBusy(true);
    setError(null);
    try {
      const data = await apiRequest(path, { method, body });
      setItems(data);
      return data;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setBusy(false);
    }
  }
  function start(address) {
    setEditing(address?.id || "new");
    setForm(address || { ...empty });
    setSave(true);
    setError(null);
  }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    if (!manage && !save && editing === "new") {
      onChoose?.({ ...form, postalCode: form.postalCode.replace(/\D/g, "") });
      setEditing(null);
      return;
    }
    const data = await mutate(
      `/account/addresses${editing === "new" ? "" : `/${editing}`}`,
      editing === "new" ? "POST" : "PUT",
      form,
    );
    if (data) {
      onChoose?.(
        data.find((a) => a.id === editing) ||
          data.find((a) => !items.some((old) => old.id === a.id)) ||
          data.find((a) => a.isDefault),
      );
      setEditing(null);
    }
  }
  async function remove(address) {
    const data = await mutate(`/account/addresses/${address.id}`, "DELETE");
    if (data && selected?.id === address.id) onChoose?.(null);
  }
  return (
    <div className="address-book" aria-busy={loading || busy}>
      <p className="field-help">
        Endereços para simulação. Use dados fictícios; nenhum produto será
        enviado.
      </p>
      {error && (
        <div role="alert" className="form-error">
          {error}
          <button
            type="button"
            className="text-button"
            onClick={() => setRetry((n) => n + 1)}
          >
            Tentar novamente
          </button>
        </div>
      )}
      {loading ? (
        <p role="status">Carregando seus endereços...</p>
      ) : (
        <>
          <div className="address-options">
            {items.map((address) => (
              <article
                key={address.id}
                className={selected?.id === address.id ? "is-selected" : ""}
              >
                {manage ? (
                  <div className="address-copy">
                    <MapPin size={18} />
                    <div>
                      <AddressText address={address} />
                    </div>
                  </div>
                ) : (
                  <label className="address-choice">
                    <input
                      type="radio"
                      name="delivery-address"
                      checked={selected?.id === address.id}
                      disabled={disabled || busy}
                      onChange={() => onChoose(address)}
                    />
                    <div>
                      <AddressText address={address} />
                    </div>
                  </label>
                )}
                <div className="address-actions">
                  {address.isDefault ? (
                    <small>
                      <Check size={13} /> Padrão
                    </small>
                  ) : (
                    <button
                      type="button"
                      disabled={disabled || busy}
                      onClick={() =>
                        mutate(
                          `/account/addresses/${address.id}/default`,
                          "PUT",
                        )
                      }
                    >
                      Tornar padrão
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={disabled || busy}
                    onClick={() => start(address)}
                  >
                    <Pencil size={13} /> Editar
                  </button>
                  <button
                    type="button"
                    disabled={disabled || busy}
                    onClick={() => remove(address)}
                  >
                    <Trash2 size={13} /> Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!items.length && !editing && (
            <p>Nenhum endereço salvo. Adicione um para continuar.</p>
          )}
          {!manage && selected && !selected.id && (
            <div className="address-copy address-temporary">
              <MapPin size={18} />
              <div>
                <AddressText address={selected} />
                <small>Somente neste pedido</small>
              </div>
            </div>
          )}
          {!editing ? (
            <button
              type="button"
              className="secondary-button"
              disabled={disabled || busy}
              onClick={() => start(null)}
            >
              <Plus size={16} /> Adicionar endereço
            </button>
          ) : (
            <form className="address-form" onSubmit={submit}>
              <h3>
                {editing === "new"
                  ? "Novo endereço de demonstração"
                  : "Editar endereço"}
              </h3>
              <button
                className="text-button"
                type="button"
                onClick={() =>
                  setForm({
                    label: "Casa de demonstração",
                    recipient: "Cliente DreamBuild",
                    postalCode: "01001000",
                    street: "Rua de demonstração",
                    number: "100",
                    complement: "",
                    district: "Centro",
                    city: "São Paulo",
                    state: "SP",
                  })
                }
              >
                Preencher exemplo fictício
              </button>
              <div className="checkout-form-grid">
                {fields.map(([name, label, placeholder, max]) => (
                  <label key={name}>
                    {label}
                    <input
                      name={name}
                      value={form[name]}
                      placeholder={placeholder}
                      maxLength={max}
                      minLength={name === "number" ? 1 : 2}
                      required={name !== "complement"}
                      inputMode={name === "postalCode" ? "numeric" : "text"}
                      pattern={
                        name === "postalCode" ? "[0-9]{5}-?[0-9]{3}" : undefined
                      }
                      autoComplete="off"
                      disabled={disabled || busy}
                      onChange={(e) =>
                        setForm({ ...form, [name]: e.target.value })
                      }
                    />
                  </label>
                ))}
                <label>
                  Estado
                  <select
                    value={form.state}
                    disabled={disabled || busy}
                    onChange={(e) =>
                      setForm({ ...form, state: e.target.value })
                    }
                  >
                    {"AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO"
                      .split(" ")
                      .map((uf) => (
                        <option key={uf}>{uf}</option>
                      ))}
                  </select>
                </label>
              </div>
              {!manage && editing === "new" && (
                <label className="checkout-checkbox">
                  <input
                    type="checkbox"
                    checked={save}
                    onChange={(e) => setSave(e.target.checked)}
                  />
                  Salvar este endereço na minha conta
                </label>
              )}
              <div className="checkout-actions">
                <button className="primary-button" disabled={busy || disabled}>
                  {busy
                    ? "Salvando..."
                    : manage
                      ? "Salvar endereço"
                      : "Usar este endereço"}
                </button>
                <button
                  type="button"
                  className="text-button"
                  disabled={busy}
                  onClick={() => setEditing(null)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
