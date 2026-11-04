import { useEffect, useRef, useState } from "react";
export default function GamePreview({ preview, playing }) {
  const video = useRef(null);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  useEffect(() => {
    const element = video.current;
    // Load media only while it is visible: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([entry]) => setVisible(entry.isIntersecting),
            { threshold: 0.05 },
          );
    if (observer) observer.observe(element);
    else setVisible(true);
    const visibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    setFailed(false);
    const element = video.current;
    let cancelled = false,
      hls;
    if (!playing || !visible || !pageVisible || !preview?.video || !element)
      return;
    (async () => {
      try {
        if (
          /\.(mp4|webm)(?:\?|$)/i.test(preview.video) ||
          element.canPlayType("application/vnd.apple.mpegurl")
        )
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
    return () => {
      cancelled = true;
      hls?.destroy();
      element.pause();
      element.removeAttribute("src");
      element.load();
    };
  }, [preview?.video, playing, visible, pageVisible]);
  return (
    <div className="game-preview">
      <video
        ref={video}
        muted
        autoPlay={playing && visible && pageVisible}
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
