import ProductTile from "./ProductTile.jsx";
import { saleOffer } from "../../../shared/inventory.js";
export default function HomeUpgrades({ products }) {
  const picks = ["cpu", "gpu", "ram", "storage"]
    .map(
      (category) =>
        products
          .filter((p) => p.category === category && saleOffer(p))
          .sort((a, b) => saleOffer(a).priceCents - saleOffer(b).priceCents)[0],
    )
    .filter(Boolean);
  if (!picks.length) return null;
  return (
    <section
      className="home-upgrades"
      aria-labelledby="home-upgrades-title"
      data-reveal
    >
      <header className="home-section-heading">
        <div>
          <p>UMA PEÇA JÁ MUDA SEU SETUP</p>
          <h2 id="home-upgrades-title">Upgrades para começar.</h2>
          <span>
            Uma seleção entre os menores preços de cada categoria no estoque
            simulado.
          </span>
        </div>
        <a href="#produtos" className="text-button">
          Explorar todas as peças
        </a>
      </header>
      <div className="home-upgrade-grid">
        {picks.map((product) => (
          <ProductTile key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
