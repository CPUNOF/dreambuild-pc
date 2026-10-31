import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  Check,
  LoaderCircle,
  Volume2,
  VolumeX,
  PackageCheck,
} from "lucide-react";
import { preparePurchaseSound } from "../audio/purchaseSound.js";
import DeliveryJourney from "./DeliveryJourney.jsx";
export function usePurchaseJourney() {
  const [stage, setStage] = useState(null),
    [order, setOrder] = useState(null),
    [sound, setSound] = useState(() => {
      try {
        return localStorage.getItem("dreambuild-sound") !== "off";
      } catch {
        return true;
      }
    });
  const audio = useRef(null),
    active = useRef(true),
    locked = useRef(false);
  const sounded = useRef(new Set());
  const soundEnabled = useRef(sound);
  soundEnabled.current = sound;
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      audio.current?.dispose();
    };
  }, []);
  function toggle() {
    const next = !sound;
    setSound(next);
    soundEnabled.current = next;
    if (next && !audio.current) audio.current = preparePurchaseSound();
    if (!next) {
      audio.current?.dispose();
      audio.current = null;
    }
    try {
      localStorage.setItem("dreambuild-sound", next ? "on" : "off");
    } catch {}
  }
  async function run(action) {
    if (locked.current) return;
    locked.current = true;
    audio.current?.dispose();
    audio.current = sound ? preparePurchaseSound() : null;
    setStage("checking");
    const started = performance.now();
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      const result = await action();
      if (!reduce)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.max(0, 700 - (performance.now() - started))),
        );
      if (!active.current) return result;
      setOrder(result);
      setStage("registered");
      if (!reduce) await new Promise((resolve) => setTimeout(resolve, 850));
      if (active.current) {
        setStage("success");
        if (!sounded.current.has(result.id)) {
          sounded.current.add(result.id);
          if (soundEnabled.current) audio.current?.play();
        }
      }
      return result;
    } catch (error) {
      if (active.current) setStage(null);
      audio.current?.dispose();
      throw error;
    } finally {
      locked.current = false;
    }
  }
  return {
    run,
    sound,
    toggleSound: toggle,
    feedback: stage ? (
      <PurchaseJourney
        stage={stage}
        order={order}
        sound={sound}
        toggleSound={toggle}
        onClose={() => setStage(null)}
      />
    ) : null,
  };
}
function PurchaseJourney({ stage, order, sound, toggleSound, onClose }) {
  const dialog = useRef(null),
    heading = useRef(null);
  useEffect(() => {
    dialog.current.showModal();
    return () => dialog.current?.close();
  }, []);
  useEffect(() => {
    if (stage === "success") heading.current?.focus();
  }, [stage]);
  return (
    <dialog
      className="purchase-journey"
      ref={dialog}
      onCancel={(event) => {
        if (stage !== "success") event.preventDefault();
        else onClose();
      }}
      aria-labelledby="purchase-title"
    >
      <div className={`purchase-scene purchase-${stage}`}>
        <button
          className="purchase-sound"
          onClick={toggleSound}
          aria-label={
            sound ? "Silenciar confirmação" : "Ativar som de confirmação"
          }
        >
          {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
        </button>
        {stage === "success" ? (
          <>
            <div className="purchase-celebration" aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => (
                <i key={i} style={{ "--i": i }} />
              ))}
              <span>
                <Check size={44} strokeWidth={2.3} />
              </span>
            </div>
            <p className="purchase-eyebrow">BOA ESCOLHA.</p>
            <h1 id="purchase-title" ref={heading} tabIndex="-1">
              Deu certo.
              <br />
              Seu pedido está confirmado!
            </h1>
            <p className="purchase-caption">
              Um passo mais perto do seu próximo setup.
            </p>
            <DeliveryJourney />
            <div className="purchase-ticket">
              <PackageCheck size={23} />
              <div>
                <strong>{order.buildName}</strong>
                <span>
                  Pedido #{order.id.slice(0, 8).toUpperCase()} · simulação
                  aprovada
                </span>
              </div>
            </div>
            <Link
              className="primary-button"
              to={`/pedidos/${order.id}`}
              onClick={onClose}
            >
              Acompanhar meu pedido
            </Link>
            <Link className="text-button" to="/#produtos" onClick={onClose}>
              Continuar explorando
            </Link>
          </>
        ) : (
          <>
            <div className="purchase-processing-icon">
              <LoaderCircle size={40} />
            </div>
            <p className="purchase-eyebrow">SEU UPGRADE ESTÁ CHEGANDO</p>
            <h1 id="purchase-title">
              {stage === "checking"
                ? "Estamos conferindo seu pedido."
                : "Pronto. É quase seu!"}
            </h1>
            <p className="purchase-caption" role="status">
              {stage === "checking"
                ? "Validando os itens e registrando sua compra simulada..."
                : "Pedido registrado. Preparando sua confirmação."}
            </p>
            <div className="purchase-progress">
              <span className={stage === "registered" ? "complete" : ""} />
            </div>
          </>
        )}
        <p className="purchase-academic">
          Compra acadêmica simulada. Nenhum pagamento foi realizado.
        </p>
      </div>
    </dialog>
  );
}
