import { useState } from "react";
import { Moon, Sun } from "lucide-react";
export default function ThemeToggle() {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === "dark",
  );
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    document.documentElement.style.colorScheme = next ? "dark" : "light";
    try {
      localStorage.setItem("dreambuild-theme", next ? "dark" : "light");
    } catch {}
  }
  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
      title={dark ? "Modo claro" : "Modo escuro"}
    >
      {dark ? <Sun size={21} /> : <Moon size={21} />}
    </button>
  );
}
