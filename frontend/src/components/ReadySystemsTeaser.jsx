import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
export default function ReadySystemsTeaser() {
  return (
    <section className="ready-systems-teaser">
      <div>
        <p className="section-kicker">PC PRONTO OU NOTEBOOK GAMER?</p>
        <h2>Coloque seu próximo setup em jogo.</h2>
        <p>
          Veja configurações completas, preços com fonte e resultados de
          referência.
          <br />
          Escolha dois equipamentos e compare no combate.
        </p>
      </div>
      <Link className="primary-button" to="/combate">
        Entrar no combate <ArrowRight size={18} />
      </Link>
    </section>
  );
}
