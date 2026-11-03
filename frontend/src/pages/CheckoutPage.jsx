import { useParams } from "react-router";
import CartCheckoutPage from "./CartCheckoutPage.jsx";
export default function CheckoutPage() {
  const { buildId } = useParams();
  return <CartCheckoutPage key={buildId} buildId={buildId} />;
}
