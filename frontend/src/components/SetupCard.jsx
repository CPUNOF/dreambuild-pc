export default function SetupCard({ build, id }) {
  const parts = build?.parts || [];
  const gpu = parts.find((p) => p.category === "gpu") || parts[0];
  if (!parts.length) return null;
  return (
    <section className="setup-card-section">
      <div>
        <p className="eyebrow">SUA COLEÇÃO</p>
        <h2>{build.kind === "cart" ? "Card do pedido" : "Card da montagem"}</h2>
        <p>
          Uma ficha visual deste conjunto. Você pode guardá-la no PDF do recibo.
        </p>
      </div>
      <article
        className="setup-card"
        aria-label={
          build.kind === "cart"
            ? "Card colecionável do pedido"
            : "Card colecionável da montagem"
        }
      >
        <header>
          <strong>DREAMBUILD</strong>
          <span>
            {build.kind === "cart" ? "PEDIDO" : "SETUP"} #
            {(id || "DEMO").slice(0, 8).toUpperCase()}
          </span>
        </header>
        <div className="setup-card-art">
          {gpu && (
            <img
              src={gpu.image}
              alt={gpu.name}
              width="440"
              height="220"
              loading="lazy"
            />
          )}
        </div>
        <div className="setup-card-body">
          <h3>{build.name || "Meu PC"}</h3>
          <dl>
            {["cpu", "gpu", "ram"].map((category) => {
              const part = parts.find((p) => p.category === category);
              return part ? (
                <div key={category}>
                  <dt>{category.toUpperCase()}</dt>
                  <dd>{part.name}</dd>
                </div>
              ) : null;
            })}
          </dl>
          <footer>
            <strong>{build.itemCount ?? parts.length} PEÇAS</strong>
            <span>Registro acadêmico · sem classificação de desempenho</span>
          </footer>
        </div>
      </article>
    </section>
  );
}
