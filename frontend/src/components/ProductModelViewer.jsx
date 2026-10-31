import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw, Plus, Minus } from "lucide-react";
export default function ProductModelViewer({ product, onPhotos }) {
  const container = useRef(null),
    viewer = useRef(null);
  const [ready, setReady] = useState(false),
    [error, setError] = useState(null),
    [color, setColor] = useState("#e88c50"),
    [automatic, setAutomatic] = useState(false);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setReady(false);
    setError(null);
    import("../three/createProductViewer.js")
      .then(async (module) => {
        if (!active) return;
        const instance = await module.createProductViewer(container.current, {
          url: product.model3d.url,
          category: product.category,
          signal: controller.signal,
          onContextLost: () => {
            if (active) {
              viewer.current?.dispose();
              viewer.current = null;
              setAutomatic(false);
              setError(
                "A visualização foi interrompida pelo navegador. As fotos continuam disponíveis.",
              );
              setReady(false);
            }
          },
        });
        if (!active) {
          instance.dispose();
          return;
        }
        viewer.current = instance;
        setReady(true);
      })
      .catch((failure) => {
        if (active && failure.name !== "AbortError")
          setError(
            "Não foi possível abrir o 3D neste dispositivo. Você pode continuar pelas fotos.",
          );
      });
    return () => {
      active = false;
      controller.abort();
      viewer.current?.dispose();
      viewer.current = null;
    };
  }, [product.model3d.url, product.category]);
  useEffect(() => {
    viewer.current?.setColor(color);
  }, [color, ready]);
  useEffect(() => {
    viewer.current?.setAutomatic(automatic);
  }, [automatic, ready]);
  const action = (label, Icon, fn) => (
    <button
      type="button"
      className="model-action"
      aria-label={label}
      title={label}
      disabled={!ready}
      onClick={fn}
    >
      <Icon size={17} aria-hidden="true" />
    </button>
  );
  function reset() {
    setAutomatic(false);
    viewer.current?.reset();
  }
  return (
    <section className="product-model" aria-label="Modelo 3D ilustrativo">
      <div
        className="product-model-stage"
        ref={container}
        tabIndex={ready ? 0 : -1}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            viewer.current?.rotate(event.key === "ArrowLeft" ? -0.25 : 0.25);
          }
          if (event.key === "Home") {
            event.preventDefault();
            reset();
          }
        }}
      >
        {!ready && !error && (
          <p className="model-loading" role="status">
            Carregando modelo 3D...
          </p>
        )}
        {error && (
          <div className="model-error" role="alert">
            <p>{error}</p>
            <button className="secondary-button" onClick={onPhotos}>
              Ver fotos do produto
            </button>
          </div>
        )}
        <span className="model-reference-label">MODELO DIDÁTICO</span>
      </div>
      <div className="model-toolbar">
        <div>
          {action("Girar para a esquerda", ArrowLeft, () =>
            viewer.current?.rotate(-0.25),
          )}
          {action("Restaurar vista", RotateCcw, reset)}
          {action("Girar para a direita", ArrowRight, () =>
            viewer.current?.rotate(0.25),
          )}
          {action("Aproximar modelo", Plus, () => viewer.current?.zoom(0.85))}
          {action("Afastar modelo", Minus, () => viewer.current?.zoom(1.15))}
        </div>
        {product.model3d.hasRgb && (
          <label className="model-color">
            Luz demonstrativa
            <input
              type="color"
              value={color}
              disabled={!ready}
              onChange={(event) => setColor(event.target.value)}
              aria-label="Cor da iluminação demonstrativa"
            />
          </label>
        )}
      </div>
      <label className="model-auto">
        <input
          type="checkbox"
          checked={automatic}
          disabled={!ready}
          onChange={(event) => setAutomatic(event.target.checked)}
        />
        Rotação automática (respeita a preferência de movimento reduzido)
      </label>
      <p className="model-instructions">
        Arraste para girar; use + e − para aproximar. No teclado, setas laterais
        e Home. A rolagem da página permanece disponível no celular.
      </p>
      <p className="model-caption">{product.model3d.caption}</p>
    </section>
  );
}
