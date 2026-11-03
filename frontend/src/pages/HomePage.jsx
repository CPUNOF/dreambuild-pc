import { Cpu, BookOpen, Monitor, MemoryStick, HardDrive } from "lucide-react";
import ComponentGuide from "../components/ComponentGuide.jsx";
import ProductCatalog from "../components/ProductCatalog.jsx";
import FeaturedCarousel from "../components/FeaturedCarousel.jsx";
import { useEffect } from "react";
import HomeSystems from "../components/HomeSystems.jsx";
import HomeUpgrades from "../components/HomeUpgrades.jsx";

export default function HomePage({
  products,
  category,
  onCategoryChange,
  query,
  onClear,
}) {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove("reveal-pending");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08 },
    );
    document.querySelectorAll("[data-reveal]").forEach((node) => {
      if (node.getBoundingClientRect().top > innerHeight)
        node.classList.add("reveal-pending");
      observer.observe(node);
    });
    return () => observer.disconnect();
  }, [products, category, query]);
  return (
    <>
      <div id="inicio" className="store-breadcrumb">
        Início <span>/</span> Hardware
      </div>
      <section className="store-highlights" aria-label="Destaques de hardware">
        <FeaturedCarousel products={products} />
      </section>
      <div className="hardware-shortcuts" aria-label="Atalhos de hardware">
        {[
          ["cpu", Cpu, "Processadores", "AMD Ryzen"],
          ["gpu", Monitor, "Placas de vídeo", "GeForce RTX"],
          ["ram", MemoryStick, "Memórias", "Corsair Vengeance"],
          ["storage", HardDrive, "Armazenamento", "Samsung NVMe"],
        ].map(([id, Icon, title, subtitle]) => (
          <button type="button" key={id} onClick={() => onCategoryChange(id)}>
            <Icon size={27} strokeWidth={1.4} aria-hidden="true" />
            <span>
              <strong>{title}</strong>
              <small>{subtitle}</small>
            </span>
          </button>
        ))}
      </div>
      {category === "all" && !query.trim() && (
        <>
          <HomeUpgrades products={products} />
          <HomeSystems />
        </>
      )}
      <ProductCatalog
        products={products}
        category={category}
        onCategoryChange={onCategoryChange}
        query={query}
        onClear={onClear}
      />
      <section id="guia" className="store-guide" aria-labelledby="guide-title">
        <div className="store-section-heading">
          <BookOpen size={23} aria-hidden="true" />
          <div>
            <h2 id="guide-title">Antes de escolher as peças</h2>
            <p>
              Consulte a função de cada componente e o que conferir na
              compatibilidade.
            </p>
          </div>
        </div>
        <ComponentGuide />
      </section>
    </>
  );
}
