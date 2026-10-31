import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

export default function ProductGallery({ product }) {
  const [index, setIndex] = useState(0);
  const dialog = useRef(null);
  const image = product.gallery[index];
  const multiple = product.gallery.length > 1;
  function move(amount) {
    setIndex(
      (current) =>
        (current + amount + product.gallery.length) % product.gallery.length,
    );
  }
  function onKeyDown(event) {
    if (!multiple || event.target !== event.currentTarget) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      move(event.key === "ArrowLeft" ? -1 : 1);
    }
  }

  return (
    <div className="product-gallery">
      <div className="product-gallery-display">
        <button
          type="button"
          className="product-gallery-main"
          onClick={() => dialog.current.showModal()}
          aria-label={`Ampliar imagem de ${product.name}`}
        >
          <img
            src={image.src}
            alt={image.alt}
            width="800"
            height="600"
            fetchPriority="high"
          />
          <span className="gallery-enlarge">
            <Maximize2 size={16} aria-hidden="true" />
            Ampliar imagem
          </span>
        </button>
      </div>
      <div
        className="gallery-navigation"
        role="group"
        aria-label="Galeria de imagens do produto"
        tabIndex={multiple ? 0 : -1}
        onKeyDown={onKeyDown}
      >
        {multiple && (
          <button
            type="button"
            className="gallery-arrow"
            onClick={() => move(-1)}
            aria-label="Imagem anterior"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
        )}
        <div className="gallery-thumbnails">
          {product.gallery.map((item, itemIndex) => (
            <button
              key={item.src}
              type="button"
              aria-label={`Ver imagem ${itemIndex + 1} de ${product.gallery.length}`}
              aria-pressed={index === itemIndex}
              onClick={() => setIndex(itemIndex)}
            >
              <img
                src={item.src}
                alt=""
                width="80"
                height="64"
                loading="lazy"
              />
            </button>
          ))}
        </div>
        {multiple && (
          <button
            type="button"
            className="gallery-arrow"
            onClick={() => move(1)}
            aria-label="Próxima imagem"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        )}
      </div>
      <p className="gallery-count" role="status">
        Imagem {index + 1} de {product.gallery.length}. Imagens de apresentação
        do produto.
      </p>
      <dialog
        ref={dialog}
        className="image-lightbox"
        aria-label={`Imagem ampliada de ${product.name}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current.close();
        }}
      >
        <div className="lightbox-content">
          <button
            className="lightbox-close"
            type="button"
            aria-label="Fechar imagem ampliada"
            onClick={() => dialog.current.close()}
            autoFocus
          >
            <X size={24} aria-hidden="true" />
          </button>
          <img src={image.src} alt={image.alt} width="1200" height="900" />
          <div className="lightbox-navigation">
            {multiple && (
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="Imagem anterior ampliada"
              >
                <ChevronLeft size={22} aria-hidden="true" />
              </button>
            )}
            <span>
              {index + 1} / {product.gallery.length}
            </span>
            {multiple && (
              <button
                type="button"
                onClick={() => move(1)}
                aria-label="Próxima imagem ampliada"
              >
                <ChevronRight size={22} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}
