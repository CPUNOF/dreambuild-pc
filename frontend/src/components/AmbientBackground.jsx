import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
export default function AmbientBackground() {
  const [paused, setPaused] = useState(() => {
    try {
      return localStorage.getItem("dreambuild-background-paused") === "true";
    } catch {
      return false;
    }
  });
  const [hidden, setHidden] = useState(document.hidden);
  useEffect(() => {
    const update = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  function toggle() {
    setPaused((v) => {
      try {
        localStorage.setItem("dreambuild-background-paused", String(!v));
      } catch {}
      return !v;
    });
  }
  return (
    <>
      <div
        className={`ambient-background ${paused || hidden ? "is-paused" : ""}`}
        aria-hidden="true"
      >
        <svg
          className="ambient-circuits"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          focusable="false"
        >
          <g fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M0 194H130L186 250H334M0 210H116L172 266H270L316 312H438M0 226H102L158 282H240" />
            <path d="M1440 306H1312L1250 368H1128M1440 322H1326L1264 384H1174L1112 446H1022M1440 338H1340L1278 400H1220" />
            <path d="M0 670H164L220 614H340M0 686H178L234 630H298L350 578H420M1440 740H1280L1218 678H1116M1440 756H1266L1204 694H1160" />
            <circle cx="334" cy="250" r="4" />
            <circle cx="438" cy="312" r="4" />
            <circle cx="1128" cy="368" r="4" />
            <circle cx="1022" cy="446" r="4" />
            <circle cx="340" cy="614" r="4" />
            <circle cx="420" cy="578" r="4" />
            <circle cx="1116" cy="678" r="4" />
          </g>
        </svg>
        <div className="ambient-light amber" />
        <div className="ambient-light ice" />
        <div className="ambient-signal signal-one" />
        <div className="ambient-signal signal-two" />
        <div className="ambient-signal signal-three" />
        <div className="ambient-grain" />
      </div>
      <button
        className="ambient-control"
        onClick={toggle}
        aria-label={
          paused ? "Animar fundo do site" : "Pausar animação do fundo"
        }
        title={paused ? "Animar fundo" : "Pausar fundo"}
      >
        {paused ? <Play size={13} /> : <Pause size={13} />}
        <span>Fundo {paused ? "pausado" : "animado"}</span>
      </button>
    </>
  );
}
