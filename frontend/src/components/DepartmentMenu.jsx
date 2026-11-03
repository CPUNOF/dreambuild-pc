import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { ChevronDown, Menu } from "lucide-react";
export default function DepartmentMenu({ departments, onChoose }) {
  const ref = useRef(null),
    timer = useRef(null);
  function close() {
    if (ref.current) ref.current.open = false;
    if (timer.current) clearTimeout(timer.current);
  }
  useEffect(() => {
    const outside = (event) => {
      if (ref.current?.open && !ref.current.contains(event.target)) close();
    };
    const escape = (event) => {
      if (event.key === "Escape" && ref.current?.open) {
        event.preventDefault();
        close();
        ref.current.querySelector("summary").focus({ preventScroll: true });
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  return (
    <details
      ref={ref}
      className="department-menu"
      onPointerEnter={() => {
        if (timer.current) clearTimeout(timer.current);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "mouse") return;
        timer.current = setTimeout(() => {
          if (!ref.current?.querySelector(":focus-visible")) close();
        }, 200);
      }}
      onBlur={(event) => {
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          close();
      }}
    >
      <summary>
        <Menu size={18} aria-hidden="true" />
        Departamentos
        <ChevronDown size={14} aria-hidden="true" />
      </summary>
      <div>
        {departments.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              close();
              onChoose(item.id);
            }}
          >
            {item.name}
          </button>
        ))}
        <Link to="/#guia" onClick={close}>
          Guia das oito categorias
        </Link>
      </div>
    </details>
  );
}
