import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { CheckCircle2, Printer, Download } from "lucide-react";
import { apiRequest, listRecords } from "../api/client.js";
import { consultationDate, money } from "../data/offers.js";
import StoreComparison from "../components/StoreComparison.jsx";
import SetupCard from "../components/SetupCard.jsx";
import DeliveryJourney from "../components/DeliveryJourney.jsx";
import { AddressText } from "../components/AddressBook.jsx";
import "../checkout.css";

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    listRecords("/orders/my", controller.signal)
      .then(setOrders)
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);
  return (
    <section className="records-page">
      <div className="page-heading">
        <div>
          <p>MINHA CONTA</p>
          <h1>Meus pedidos simulados</h1>
          <p>Histórico das suas peças, montagens e compras simuladas.</p>
        </div>
        <Link className="secondary-button" to="/montar">
          Montar outro PC
        </Link>
      </div>
      {error && (
        <div className="form-error" role="alert">
          {error}
          <button
            className="text-button"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Tentar novamente
          </button>
        </div>
      )}
      {loading ? (
        <p role="status">Carregando pedidos...</p>
      ) : orders.length ? (
        <div className="order-list">
          {orders.map((order) => (
            <article key={order.id}>
              <CheckCircle2 size={25} aria-hidden="true" />
              <div>
                <span>
                  DB-{order.id.slice(0, 8).toUpperCase()} ·{" "}
                  {consultationDate(order.createdAt)}
                </span>
                <h2>{order.buildName}</h2>
                <p>Aprovado em simulação · nenhum pagamento realizado</p>
                <strong>
                  {order.totalCents === null
                    ? "Sem cotação integral"
                    : money(order.totalCents)}
                </strong>
              </div>
              <Link className="secondary-button" to={`/pedidos/${order.id}`}>
                Ver recibo e relatório
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Seu histórico começa na primeira compra.</h2>
          <p>
            Escolha uma peça ou monte um PC e conclua a compra simulada para
            gerar seu primeiro registro.
          </p>
          <Link className="primary-button" to="/#produtos">
            Explorar produtos
          </Link>
        </div>
      )}
    </section>
  );
}

export function OrderPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    apiRequest(`/orders/${id}`, { signal: controller.signal })
      .then(setOrder)
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id]);
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(order, null, 2)], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `dreambuild-pedido-${order.id}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="order-detail">
      <div className="page-heading">
        <div>
          <p>RECIBO DE SIMULAÇÃO</p>
          <h1>Pedido confirmado.</h1>
          <p>
            Documento acadêmico sem valor fiscal, sem cobrança e sem entrega.
          </p>
        </div>
        <div className="receipt-actions">
          <button
            className="secondary-button"
            type="button"
            disabled={!order}
            onClick={() => window.print()}
          >
            <Printer size={16} aria-hidden="true" />
            Imprimir / PDF
          </button>
          <button
            className="secondary-button"
            type="button"
            disabled={!order}
            onClick={download}
          >
            <Download size={16} aria-hidden="true" />
            Exportar JSON
          </button>
        </div>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Consultando seu pedido...</p>
      ) : (
        order && (
          <>
            <article className="simulation-receipt">
              <div className="receipt-top">
                <CheckCircle2 size={30} aria-hidden="true" />
                <div>
                  <p>APROVADO EM SIMULAÇÃO</p>
                  <h2>{order.buildName}</h2>
                  <span>
                    DB-{order.id.slice(0, 8).toUpperCase()} ·{" "}
                    {consultationDate(order.createdAt)}
                  </span>
                </div>
              </div>
              <dl className="receipt-facts">
                <div>
                  <dt>
                    Total do pedido simulado
                    {order.delivery ? ", com frete" : ", sem frete"}
                  </dt>
                  <dd>
                    {order.totalCents === null
                      ? "Sem cotação integral — preços ausentes não foram inventados"
                      : money(order.totalCents)}
                  </dd>
                </div>
                <div>
                  <dt>Cartão fictício</dt>
                  <dd>{order.fakeCardDetails.maskedNumber}</dd>
                </div>
                <div>
                  <dt>Titular</dt>
                  <dd>{order.fakeCardDetails.holderName}</dd>
                </div>
                <div>
                  <dt>Código de simulação</dt>
                  <dd>{order.approvalCode}</dd>
                </div>
              </dl>
              <div className="receipt-part-list">
                {order.buildSnapshot.parts.map((part) => (
                  <div key={part.id}>
                    <span>{part.categoryName}</span>
                    <strong>{part.name}</strong>
                    {order.kind !== "cart" && (
                      <small>
                        Quantidade:{" "}
                        {order.buildSnapshot.quantities?.[part.id] ?? 1}
                      </small>
                    )}
                    {order.kind === "cart" && (
                      <small>
                        Quantidade:{" "}
                        {order.lines.find(
                          (line) => line.componentId === part.id,
                        )?.quantity || 1}
                      </small>
                    )}
                    <small>{part.model}</small>
                  </div>
                ))}
              </div>
              <p className="receipt-note">
                Este registro guarda as peças, as quantidades e as consultas de
                preço no momento da simulação. Alterações futuras do catálogo
                não reescrevem este histórico. Nenhum dado bancário real foi
                solicitado ou armazenado.
              </p>
            </article>
            {order.delivery && (
              <section className="order-delivery">
                <h2>Sua entrega simulada</h2>
                <div className="address-copy">
                  <div>
                    <AddressText address={order.delivery.address} />
                  </div>
                </div>
                <p>
                  {order.delivery.name} · {order.delivery.days} · frete{" "}
                  {money(order.delivery.priceCents)}
                </p>
                <p className="field-help">
                  Prévia ilustrativa. Não representa rastreamento nem envio
                  real.
                </p>
                <DeliveryJourney />
              </section>
            )}
            <StoreComparison comparison={order.buildSnapshot.comparison} />
            <SetupCard
              build={{ ...order.buildSnapshot, name: order.buildName }}
              id={order.id}
            />
            <div className="profile-actions no-print">
              <Link className="primary-button" to="/pedidos">
                Ver meus pedidos
              </Link>
              <Link className="secondary-button" to="/montar">
                Montar outro PC
              </Link>
            </div>
          </>
        )
      )}
    </section>
  );
}
