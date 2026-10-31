import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { bestOffer } from "../data/offers.js";
export default function FeaturedCarousel({ products }) {
  const slides = useMemo(() => {
    const groups = [
      "gpu",
      "cpu",
      "ram",
      "storage",
      "case",
      "psu",
      "mobo",
      "cooler",
    ];
    return groups.flatMap((category) =>
      products
        .filter((p) => p.category === category)
        .sort(
          (a, b) =>
            Number(Boolean(bestOffer(b))) - Number(Boolean(bestOffer(a))) ||
            (bestOffer(b)?.priceCents || 0) - (bestOffer(a)?.priceCents || 0),
        )
        .slice(0, 2),
    );
  }, [products]);
  const [index, setIndex] = useState(0),
    [previous, setPrevious] = useState(null),
    [auto, setAuto] = useState(true),
    [hover, setHover] = useState(false),
    [focused, setFocused] = useState(false),
    [visible, setVisible] = useState(true),
    [documentActive, setDocumentActive] = useState(true),
    [reduced, setReduced] = useState(false);
  const root = useRef(null);
  const current = index % Math.max(slides.length, 1);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(query.matches);
    change();
    query.addEventListener("change", change);
    const observer = new IntersectionObserver((entries) =>
      setVisible(entries[0].isIntersecting),
    );
    observer.observe(root.current);
    const hidden = () => setDocumentActive(!document.hidden);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      query.removeEventListener("change", change);
      observer.disconnect();
      document.removeEventListener("visibilitychange", hidden);
    };
  }, []);
  function go(next, manual = false) {
    if (!slides.length) return;
    if (manual) setAuto(false);
    setPrevious(current);
    setIndex((next + slides.length) % slides.length);
  }
  useEffect(() => {
    if (slides.length < 2) return;
    const image = new Image();
    image.fetchPriority = "low";
    image.src = slides[(current + 1) % slides.length].image;
  }, [current, slides]);
  useEffect(() => {
    if (
      !auto ||
      hover ||
      focused ||
      !visible ||
      !documentActive ||
      reduced ||
      slides.length < 2
    )
      return;
    const timer = setTimeout(() => go(current + 1), 6500);
    return () => clearTimeout(timer);
  }, [
    current,
    auto,
    hover,
    focused,
    visible,
    documentActive,
    reduced,
    slides.length,
  ]);
  useEffect(() => {
    if (previous === null) return;
    const timer = setTimeout(() => setPrevious(null), 650);
    return () => clearTimeout(timer);
  }, [previous, current]);
  return (
    <section
      className="featured-carousel"
      ref={root}
      aria-roledescription="carrossel"
      aria-label="Produtos em destaque"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
    >
      <h1 className="sr-only">Hardware para seu próximo PC</h1>
      <div className="featured-carousel-stage">
        {slides.map((product, i) => {
          if (i !== current && i !== previous) return null;
          const active = i === current;
          return (
            <article
              key={product.id}
              className={`featured-slide ${active ? "is-current" : "is-previous"} ${product.id === "rtx4090" ? "slide-dark" : "slide-light"}`}
              aria-hidden={!active}
              inert={!active}
            >
              <div className="featured-copy">
                <p>
                  {product.categoryName} / {product.brand}
                </p>
                <h2>
                  {product.category === "gpu" &&
                  product.name.match(
                    /(?:RTX|RX)\s*\d{4}(?:\s*(?:Ti|SUPER|XTX|XT))?/i,
                  ) ? (
                    <>
                      {/RTX/i.test(product.name) ? "GeForce" : "Radeon"}
                      <br />
                      {
                        product.name.match(
                          /(?:RTX|RX)\s*\d{4}(?:\s*(?:Ti|SUPER|XTX|XT))?/i,
                        )[0]
                      }
                    </>
                  ) : (
                    product.name.split(",")[0]
                  )}
                </h2>
                <p className="featured-edition">
                  {product.category === "gpu"
                    ? (product.fullName.match(/\d+\s*GB/i)?.[0] ||
                        product.brand) +
                      " · " +
                      (product.fullName.match(/GDDR\s*[4567]X?/i)?.[0] ||
                        product.highlights.find((item) => /\d/.test(item)) ||
                        product.brand)
                    : product.highlights.find((item) => /\d/.test(item)) ||
                      product.highlights[0]}
                </p>
                <Link
                  className="primary-button"
                  to={`/produto/${product.slug}`}
                >
                  Conhecer produto
                </Link>
              </div>
              <img
                src={product.image}
                alt={product.fullName}
                width="720"
                height="500"
                fetchPriority={active ? "high" : "low"}
              />
            </article>
          );
        })}
      </div>
      <div className="carousel-controls">
        <div
          className="carousel-dots"
          role="group"
          aria-label="Escolher destaque"
        >
          {slides.map((product, i) => (
            <button
              key={product.id}
              onClick={() => go(i, true)}
              aria-label={`Mostrar ${product.name}`}
              aria-pressed={current === i}
            >
              <span />
            </button>
          ))}
        </div>
        <div className="carousel-arrows">
          <span>
            {String(current + 1).padStart(2, "0")} /{" "}
            {String(slides.length).padStart(2, "0")}
          </span>
          <button
            onClick={() => go(current - 1, true)}
            aria-label="Destaque anterior"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            onClick={() => setAuto((v) => !v)}
            aria-label={auto ? "Pausar carrossel" : "Reproduzir carrossel"}
          >
            {auto ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            onClick={() => go(current + 1, true)}
            aria-label="Próximo destaque"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}
