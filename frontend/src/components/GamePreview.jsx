import { useEffect, useRef, useState } from "react";
export default function GamePreview({ preview, playing }) {
  const video = useRef(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
    const element = video.current;
    let cancelled = false,
      hls;
    if (!playing || !preview?.video || !element) return;
    (async () => {
      try {
        if (element.canPlayType("application/vnd.apple.mpegurl"))
          element.src = preview.video;
        else {
          const { default: Hls } = await import("hls.js/light");
          if (cancelled) return;
          if (!Hls.isSupported()) throw Error();
          hls = new Hls({
            enableWorker: false,
            maxBufferLength: 10,
            maxMaxBufferLength: 20,
            capLevelToPlayerSize: true,
            startLevel: 0,
          });
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              hls.destroy();
              setFailed(true);
            }
          });
          hls.loadSource(preview.video);
          hls.attachMedia(element);
        }
        await element.play().catch(() => {});
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    const hide = () => {
      if (document.hidden) element.pause();
      else if (playing) element.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", hide);
      hls?.destroy();
      element.pause();
      element.removeAttribute("src");
      element.load();
    };
  }, [preview?.video, playing]);
  return (
    <div className="game-preview">
      <video
        ref={video}
        muted
        loop
        playsInline
        preload="none"
        poster={preview?.poster || undefined}
        aria-label="Trailer oficial ilustrativo do jogo"
      />
      {(!preview || failed) && (
        <p>Prévia indisponível. Os resultados continuam disponíveis abaixo.</p>
      )}
      <span>TRAILER ILUSTRATIVO · NÃO É CAPTURA DESTE PC</span>
    </div>
  );
}
