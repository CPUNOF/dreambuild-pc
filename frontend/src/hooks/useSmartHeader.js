import { useEffect, useRef, useState } from "react";

export default function useSmartHeader() {
  const ref = useRef(null),
    [hidden, setHidden] = useState(false),
    [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const element = ref.current;
    let previous = window.scrollY,
      travel = 0,
      frame = 0,
      direction = 0;
    const measure = () =>
      document.documentElement.style.setProperty(
        "--store-header-height",
        `${element.offsetHeight}px`,
      );
    measure();
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : null;
    observer?.observe(element);
    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY),
        delta = y - previous;
      previous = y;
      setScrolled(y > 24);
      const nextDirection = Math.sign(delta);
      if (nextDirection !== direction) {
        travel = 0;
        direction = nextDirection;
      }
      travel += Math.abs(delta);
      const active = document.activeElement;
      const interacting =
        element.querySelector('[role="combobox"][aria-expanded="true"]') ||
        (element.contains(active) &&
          active?.matches?.("input, select, textarea, :focus-visible"));
      if (y <= element.offsetHeight || interacting) {
        setHidden(false);
        return;
      }
      if (travel >= 12 && delta > 0) {
        setHidden(true);
        element.querySelectorAll("details[open]").forEach((menu) => {
          menu.open = false;
        });
      }
      if (travel >= 6 && delta < 0) setHidden(false);
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", scroll);
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, []);
  const reveal = (event) => {
    if (event.target.matches?.(":focus-visible"))
      ref.current.dataset.instant = "true";
    setHidden(false);
  };
  return { ref, hidden, scrolled, reveal };
}
