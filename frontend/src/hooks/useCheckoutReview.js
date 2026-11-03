import { useEffect, useRef, useState } from "react";
import { useCart } from "../context/CartContext.jsx";
import { apiRequest } from "../api/client.js";
import { usePurchaseJourney } from "../components/PurchaseJourney.jsx";
export default function useCheckoutReview(buildId) {
  const cart = useCart(),
    journey = usePurchaseJourney();
  const [buildSummary, setBuildSummary] = useState(null),
    [error, setError] = useState(null),
    [reviewing, setReviewing] = useState(true),
    [busy, setBusy] = useState(false),
    [card, setCard] = useState(null),
    [validCard, setValidCard] = useState(null),
    [submitted, setSubmitted] = useState(false),
    [completedOrder, setCompletedOrder] = useState(null);
  const attempt = useRef(null),
    key = useRef(crypto.randomUUID());
  useEffect(() => {
    let active = true;
    setReviewing(true);
    (async () => {
      if (!buildId) {
        await cart.refresh();
        return;
      }
      const saved = await apiRequest(`/builds/${buildId}`);
      const result = await apiRequest("/builds/analyze", {
        method: "POST",
        body: {
          partIds: saved.partIds,
          quantities: saved.quantities,
          storageIds: saved.storageIds,
          paymentMethod: saved.comparison.paymentMethod,
        },
      });
      if (active)
        setBuildSummary({
          ...result.storeQuote,
          items: result.storeQuote.items.map((item) => ({
            ...item,
            component: result.parts.find((p) => p.id === item.componentId),
          })),
          hasUnavailableProducts:
            result.storeQuote.hasUnavailableProducts || !result.compatible,
          itemCount: result.storeQuote.items.reduce(
            (sum, item) => sum + item.quantity,
            0,
          ),
        });
    })()
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setReviewing(false);
      });
    return () => {
      active = false;
    };
  }, [buildId]);
  async function generate() {
    if (busy || submitted) return;
    setBusy(true);
    setError(null);
    try {
      setCard(await apiRequest("/orders/card", { method: "POST" }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const summary = buildId ? buildSummary : cart.cart;
  async function confirm(delivery) {
    if (
      busy ||
      reviewing ||
      !summary ||
      !validCard ||
      summary.hasUnavailableProducts
    )
      return;
    setBusy(true);
    setSubmitted(true);
    setError(null);
    attempt.current ??= {
      ...(buildId
        ? { buildId }
        : {
            items: summary.items.map(({ componentId, quantity }) => ({
              componentId,
              quantity,
            })),
          }),
      quoteVersion: summary.quoteVersion,
      idempotencyKey: key.current,
      card: validCard,
      delivery,
    };
    try {
      const order = await journey.run(() =>
        apiRequest(
          buildId ? "/orders/checkout-dream" : "/orders/checkout-cart",
          { method: "POST", body: attempt.current },
        ),
      );
      if (order) {
        setCompletedOrder(order);
        if (!buildId) cart.refresh().catch(() => {});
      }
    } catch (e) {
      if (e.status === 400) {
        setSubmitted(false);
        setCard(null);
        setValidCard(null);
        attempt.current = null;
        key.current = crypto.randomUUID();
      }
      setError(
        e.message +
          " Consulte seus pedidos antes de iniciar outra compra. Você pode repetir esta tentativa sem duplicar o pedido.",
      );
    } finally {
      setBusy(false);
    }
  }
  return {
    summary,
    error,
    setError,
    reviewing,
    busy,
    card,
    validCard,
    setValidCard,
    generate,
    confirm,
    submitted,
    completedOrder,
    journey,
  };
}
