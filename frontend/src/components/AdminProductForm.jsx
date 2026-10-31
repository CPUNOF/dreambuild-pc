import { useState } from "react";
import { categoryNames, hardwareFields } from "../data/hardwareFields.js";
import { apiRequest } from "../api/client.js";
const slugify = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
const nowLocal = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
const toLocal = (value) =>
  value
    ? new Date(Date.parse(value) - new Date(value).getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : nowLocal();
const newOffer = () => ({
  store: "kabum",
  paymentMethod: "pix",
  availability: "in_stock",
  price: "",
  sourceUrl: "",
  consulted: nowLocal(),
});

export default function AdminProductForm({ product, onDone, onCancel }) {
  const [form, setForm] = useState(() => ({
    name: product?.name || "",
    fullName: product?.fullName || "",
    brand: product?.brand || "",
    model: product?.model || "",
    category: product?.category || "cpu",
    slug: product?.slug || "",
    image: product?.image || "",
    description: product?.description || "",
    compatibilityNote: product?.compatibilityNote || "",
    manufacturerUrl: product?.manufacturerUrl || "",
    gallery: product?.gallery || [],
    highlights: (product?.highlights || []).join("\n"),
    specifications: (product?.specifications || [])
      .map((row) => row.join(": "))
      .join("\n"),
    hardware: product?.hardware || {},
    simulationScore: product?.simulationScore ?? "",
    offers: (product?.offers || []).map((offer) => ({
      ...offer,
      price:
        offer.priceCents === null ? "" : (offer.priceCents / 100).toFixed(2),
      consulted: toLocal(offer.checkedAt),
    })),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const change = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const field = (label, key, type = "text", required = true) => (
    <label className="field-label">
      {label}
      <input
        type={type}
        value={form[key]}
        required={required}
        disabled={busy || (key === "slug" && Boolean(product))}
        onChange={(event) => change(key, event.target.value)}
      />
    </label>
  );
  function updateOffer(index, key, value) {
    setForm((current) => ({
      ...current,
      offers: current.offers.map((offer, i) =>
        i === index ? { ...offer, [key]: value } : offer,
      ),
    }));
  }
  async function submit(event) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const specifications = form.specifications
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          const position = line.indexOf(":");
          if (position < 1)
            throw new Error(
              "Na ficha técnica, use uma característica por linha no formato Nome: valor.",
            );
          return [
            line.slice(0, position).trim(),
            line.slice(position + 1).trim(),
          ];
        });
      const offers = form.offers.map(({ price, consulted, ...offer }) => ({
        ...offer,
        priceCents: price === "" ? null : Math.round(Number(price) * 100),
        checkedAt: new Date(consulted).toISOString(),
      }));
      const hardware = Object.fromEntries(
        Object.entries(form.hardware).map(([key, value]) => {
          const type = hardwareFields[form.category].find(
            (field) => field[0] === key,
          )?.[2];
          return [
            key,
            type === "number"
              ? Number(value)
              : type === "list"
                ? Array.isArray(value)
                  ? value
                  : String(value)
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean)
                : type === "json" && typeof value === "string"
                  ? JSON.parse(value)
                  : value,
          ];
        }),
      );
      const payload = {
        ...form,
        simulationScore:
          form.simulationScore === "" ? null : Number(form.simulationScore),
        hardware,
        slug: form.slug || slugify(form.name),
        categoryName: categoryNames[form.category],
        fullName: form.fullName || form.name,
        highlights: form.highlights
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean),
        specifications,
        offers,
        gallery: form.gallery.length
          ? form.gallery
          : [{ src: form.image, alt: form.fullName || form.name }],
        checkedAt: new Date().toISOString().slice(0, 10),
      };
      await apiRequest(
        product ? `/admin/components/${product.id}` : "/admin/components",
        { method: product ? "PUT" : "POST", body: payload },
      );
      await onDone();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="admin-editor" onSubmit={submit}>
      <div className="admin-section-heading">
        <h2>{product ? "Editar produto" : "Cadastrar produto"}</h2>
        <button
          type="button"
          className="secondary-button"
          onClick={onCancel}
          disabled={busy}
        >
          Cancelar
        </button>
      </div>
      <div className="form-grid">
        {field("Nome na vitrine", "name")}
        {field("Nome completo", "fullName", "text", false)}
        {field("Fabricante", "brand")}
        {field("Código exato do modelo", "model")}
        <label className="field-label">
          Categoria
          <select
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                category: event.target.value,
                hardware: {},
              }))
            }
            disabled={busy}
          >
            {Object.entries(categoryNames).map(([key, label]) => (
              <option value={key} key={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {field(
          product
            ? "Endereço do produto (fixo)"
            : "Endereço do produto (opcional, gerado pelo nome)",
          "slug",
          "text",
          false,
        )}
        {field("Imagem principal: URL HTTPS ou caminho /hardware/", "image")}
        {field("Página oficial do fabricante", "manufacturerUrl", "url")}
      </div>
      <label className="field-label">
        Descrição
        <textarea
          rows={4}
          value={form.description}
          onChange={(event) => change("description", event.target.value)}
          required
          disabled={busy}
        />
      </label>
      <label className="field-label">
        Observações de compatibilidade
        <textarea
          rows={3}
          value={form.compatibilityNote}
          onChange={(event) => change("compatibilityNote", event.target.value)}
          required
          disabled={busy}
        />
      </label>
      <div className="form-grid">
        <label className="field-label">
          Destaques: um por linha
          <textarea
            rows={4}
            value={form.highlights}
            onChange={(event) => change("highlights", event.target.value)}
            disabled={busy}
          />
        </label>
        <label className="field-label">
          Ficha técnica: Característica: valor
          <textarea
            rows={6}
            value={form.specifications}
            onChange={(event) => change("specifications", event.target.value)}
            required
            disabled={busy}
          />
        </label>
      </div>
      <details className="admin-details">
        <summary>Fotos da galeria ({form.gallery.length})</summary>
        <p className="field-help">
          Sem fotos adicionais, a imagem principal será usada. Inclua somente
          imagens da variante correta.
        </p>
        {form.gallery.map((image, index) => (
          <div className="gallery-form-row" key={index}>
            <label className="field-label">
              URL da imagem
              <input
                value={image.src}
                disabled={busy}
                onChange={(event) =>
                  change(
                    "gallery",
                    form.gallery.map((item, i) =>
                      i === index ? { ...item, src: event.target.value } : item,
                    ),
                  )
                }
              />
            </label>
            <label className="field-label">
              Descrição da foto
              <input
                value={image.alt}
                disabled={busy}
                onChange={(event) =>
                  change(
                    "gallery",
                    form.gallery.map((item, i) =>
                      i === index ? { ...item, alt: event.target.value } : item,
                    ),
                  )
                }
              />
            </label>
            <button
              type="button"
              className="text-button"
              disabled={busy}
              onClick={() =>
                change(
                  "gallery",
                  form.gallery.filter((_, i) => i !== index),
                )
              }
            >
              Remover foto
            </button>
          </div>
        ))}
        <button
          className="secondary-button"
          type="button"
          disabled={busy || form.gallery.length >= 12}
          onClick={() =>
            change("gallery", [...form.gallery, { src: "", alt: "" }])
          }
        >
          Adicionar foto
        </button>
      </details>
      <details className="admin-details">
        <summary>Dados usados pelo montador</summary>
        <p className="field-help">
          Preencha com a ficha do fabricante. Campo vazio significa dado ainda
          não informado.
        </p>
        <div className="form-grid">
          {hardwareFields[form.category].map(([key, label, type]) => (
            <label className="field-label" key={key}>
              {label}
              <input
                type={type === "number" ? "number" : "text"}
                min={0}
                step="any"
                value={
                  type === "json" && typeof form.hardware[key] === "object"
                    ? JSON.stringify(form.hardware[key])
                    : Array.isArray(form.hardware[key])
                      ? form.hardware[key].join(", ")
                      : (form.hardware[key] ?? "")
                }
                disabled={busy}
                onChange={(event) => {
                  const value = event.target.value;
                  const next = { ...form.hardware };
                  if (!value) delete next[key];
                  else next[key] = value;
                  change("hardware", next);
                }}
              />
            </label>
          ))}
        </div>
      </details>
      <details className="admin-details" open>
        <summary>Ofertas cadastradas ({form.offers.length})</summary>
        <p className="field-help">
          Confira o mesmo código de modelo. Preço em reais, data e fonte são
          obrigatórios para ofertas disponíveis. O valor não inclui frete.
        </p>
        {form.offers.map((offer, index) => (
          <fieldset className="offer-form" key={index}>
            <legend>Oferta {index + 1}</legend>
            <div className="form-grid">
              <label className="field-label">
                Loja
                <select
                  value={offer.store}
                  disabled={busy}
                  onChange={(event) =>
                    updateOffer(index, "store", event.target.value)
                  }
                >
                  <option value="kabum">KaBuM!</option>
                  <option value="pichau">Pichau</option>
                  <option value="terabyte">Terabyte</option>
                </select>
              </label>
              <label className="field-label">
                Pagamento
                <select
                  value={offer.paymentMethod}
                  disabled={busy}
                  onChange={(event) =>
                    updateOffer(index, "paymentMethod", event.target.value)
                  }
                >
                  <option value="pix">PIX</option>
                  <option value="cash">Boleto / à vista</option>
                  <option value="card">Cartão, valor total</option>
                </select>
              </label>
              <label className="field-label">
                Disponibilidade
                <select
                  value={offer.availability}
                  disabled={busy}
                  onChange={(event) =>
                    updateOffer(index, "availability", event.target.value)
                  }
                >
                  <option value="in_stock">Disponível na consulta</option>
                  <option value="out_of_stock">Sem estoque</option>
                  <option value="unknown">Não confirmada</option>
                </select>
              </label>
              <label className="field-label">
                Preço (R$)
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required={offer.availability === "in_stock"}
                  value={offer.price}
                  disabled={busy}
                  onChange={(event) =>
                    updateOffer(index, "price", event.target.value)
                  }
                />
              </label>
              <label className="field-label">
                Link do produto na loja
                <input
                  type="url"
                  required
                  value={offer.sourceUrl}
                  disabled={busy}
                  onChange={(event) =>
                    updateOffer(index, "sourceUrl", event.target.value)
                  }
                />
              </label>
              <label className="field-label">
                Data e hora da consulta
                <input
                  type="datetime-local"
                  required
                  value={offer.consulted}
                  disabled={busy}
                  onChange={(event) =>
                    updateOffer(index, "consulted", event.target.value)
                  }
                />
              </label>
            </div>
            <button
              className="text-button"
              type="button"
              disabled={busy}
              onClick={() =>
                change(
                  "offers",
                  form.offers.filter((_, i) => i !== index),
                )
              }
            >
              Remover oferta
            </button>
          </fieldset>
        ))}
        <button
          type="button"
          className="secondary-button"
          disabled={busy || form.offers.length >= 9}
          onClick={() => change("offers", [...form.offers, newOffer()])}
        >
          Adicionar oferta
        </button>
      </details>
      {["cpu", "gpu", "ram"].includes(form.category) && (
        <label className="field-label">
          Índice didático da bancada (opcional, 1 a 100)
          <input
            type="number"
            min="1"
            max="100"
            step="0.1"
            value={form.simulationScore}
            disabled={busy}
            onChange={(event) => change("simulationScore", event.target.value)}
          />
          <span className="field-help">
            Parâmetro de simulação; não representa desempenho medido. Vazio
            mantém somente a referência didática das três peças iniciais.
          </span>
        </label>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="primary-button" type="submit" disabled={busy}>
        {busy ? "Salvando..." : "Salvar produto"}
      </button>
    </form>
  );
}
