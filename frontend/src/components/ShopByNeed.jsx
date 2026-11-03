import { useState } from "react";
import { Link } from "react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { saleOffer } from "../../../shared/inventory.js";
import ProductTile from "./ProductTile.jsx";

const shelves = [
  {
    id: "budget",
    title: "Até R$ 300",
    description: "Pequenos upgrades que cabem no seu projeto.",
    filter: (p) => saleOffer(p)?.priceCents <= 30000,
  },
  {
    id: "storage",
    title: "Mais espaço",
    description: "SSDs e HDs para seus jogos, arquivos e programas.",
    filter: (p) => p.category === "storage",
  },
  {
    id: "ram",
    title: "Memória para trabalhar e jogar",
    description: "Compare os kits. Confira DDR4 ou DDR5 antes de escolher.",
    filter: (p) => p.category === "ram",
  },
];
export default function ShopByNeed({ products }) {
  const [active, setActive] = useState("budget");
  const current = shelves.find((s) => s.id === active);
  const selection = products
    .filter((p) => saleOffer(p) && current.filter(p))
    .sort((a, b) => saleOffer(a).priceCents - saleOffer(b).priceCents)
    .slice(0, 4);
  const cpu = products.find((p) => p.category === "cpu" && saleOffer(p));
  const drive = products.find((p) => p.category === "storage" && saleOffer(p));
  return (
    <>
      <section
        className="shopping-campaigns"
        aria-label="Encontre seu próximo upgrade"
      >
        <Link to="/montar" className="shopping-campaign campaign-build">
          <div>
            <small>DO PRIMEIRO COMPONENTE AO PC COMPLETO</small>
            <h2>
              Seu PC começa
              <br />
              com uma boa escolha.
            </h2>
            <p>Escolha as peças, ajuste as quantidades e confira o conjunto.</p>
            <span>
              Começar minha montagem <ArrowRight size={17} />
            </span>
          </div>
          {cpu && (
            <img
              src={cpu.image}
              alt={cpu.name}
              width={200}
              height={190}
              loading="lazy"
            />
          )}
        </Link>
        {drive && (
          <Link
            to={`/produto/${drive.slug}`}
            className="shopping-campaign campaign-storage"
          >
            <div>
              <small>ESPAÇO PARA O PRÓXIMO JOGO</small>
              <h2>Seu próximo SSD.</h2>
              <p>{drive.name}</p>
              <span>
                Ver este modelo <ArrowUpRight size={17} />
              </span>
            </div>
            <img
              src={drive.image}
              alt=""
              width={190}
              height={160}
              loading="lazy"
            />
          </Link>
        )}
      </section>
      <section
        className="need-shelf"
        aria-labelledby="need-shelf-heading"
        data-reveal
      >
        <header className="retail-section-heading">
          <div>
            <p className="section-kicker">ESCOLHA PELO QUE VOCÊ PRECISA</p>
            <h2 id="need-shelf-heading">Qual vai ser o próximo upgrade?</h2>
            <p>{current.description}</p>
          </div>
          <Link className="section-link" to="/#produtos">
            Explorar o catálogo <ArrowRight size={16} />
          </Link>
        </header>
        <div
          className="need-shelf-tabs"
          role="group"
          aria-label="Selecionar vitrine"
        >
          {shelves.map((s) => (
            <button
              type="button"
              key={s.id}
              aria-pressed={active === s.id}
              onClick={() => setActive(s.id)}
            >
              {s.title}
            </button>
          ))}
        </div>
        {selection.length ? (
          <div className="need-shelf-products">
            {selection.map((p) => (
              <ProductTile key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="shelf-empty" role="status">
            Ainda não há produtos com saldo e preço nesta seleção. Explore as
            outras vitrines.
          </p>
        )}
        <p className="shelf-note">
          Preços acadêmicos para compras simuladas. As referências das lojas
          ficam na página do produto.
        </p>
      </section>
    </>
  );
}
