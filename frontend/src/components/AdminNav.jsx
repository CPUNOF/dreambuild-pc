import { NavLink } from "react-router";
export default function AdminNav() {
  return (
    <nav className="admin-subnav" aria-label="Áreas da administração">
      <NavLink to="/admin" end>
        Catálogo e ofertas
      </NavLink>
      <NavLink to="/admin/estoque">Estoque de produtos</NavLink>
      <NavLink to="/admin/jogos">Cenários de simulação</NavLink>
      <NavLink to="/admin/comunidade">PCs de demonstração</NavLink>
    </nav>
  );
}
