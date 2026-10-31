import { Plus, Minus, Trash2, MemoryStick, HardDrive, Fan } from "lucide-react";
import { money, bestOffer } from "../data/offers.js";
import { storageKind, buildResources } from "../../../shared/buildResources.js";
export default function BuildResourcesPanel({
  parts,
  quantities,
  resources,
  onQuantity,
  onAddStorage,
  onRemoveStorage,
  onPick,
  disabled,
}) {
  const ram = parts.find((p) => p.category === "ram"),
    board = parts.find((p) => p.category === "mobo"),
    cpu = parts.find((p) => p.category === "cpu"),
    cooler = parts.find((p) => p.category === "cooler"),
    drives = parts.filter((p) => p.category === "storage");
  const counter = (p, label) => (
    <div className="resource-quantity" role="group" aria-label={label}>
      <button
        type="button"
        disabled={disabled || (quantities[p.id] ?? 1) <= 1}
        onClick={() => onQuantity(p.id, (quantities[p.id] ?? 1) - 1)}
        aria-label={`Diminuir quantidade de ${p.name}`}
      >
        <Minus size={16} />
      </button>
      <output aria-label={`Quantidade de ${p.name}`}>
        {quantities[p.id] ?? 1}
      </output>
      <button
        type="button"
        disabled={
          disabled ||
          (quantities[p.id] ?? 1) >= 16 ||
          buildResources(parts, {
            ...quantities,
            [p.id]: (quantities[p.id] ?? 1) + 1,
          }).issues.length > 0
        }
        onClick={() => onQuantity(p.id, (quantities[p.id] ?? 1) + 1)}
        aria-label={`Aumentar quantidade de ${p.name}`}
      >
        <Plus size={16} />
      </button>
    </div>
  );
  return (
    <section className="build-resources" aria-labelledby="resources-title">
      <header>
        <div>
          <p className="section-kicker">CAPACIDADE DA SUA BANCADA</p>
          <h2 id="resources-title">Slots, unidades e refrigeração.</h2>
        </div>
        <span>
          {board?.name || "Escolha uma placa-mãe para verificar os limites"}
        </span>
      </header>
      <div className="resource-overview">
        <article>
          <MemoryStick size={21} />
          <small>RAM / MÓDULOS</small>
          <strong>
            {resources.ram.modules ?? "—"}{" "}
            <span>/ {resources.ram.slots ?? "?"}</span>
          </strong>
          <p>
            {resources.ram.capacityGb ?? "—"} GB totais · limite{" "}
            {resources.ram.maxGb ?? "?"} GB
          </p>
          {resources.ram.slots && (
            <div
              className="dimm-indicators"
              aria-label={`${resources.ram.modules || 0} de ${resources.ram.slots} slots ocupados`}
            >
              {Array.from({ length: resources.ram.slots }, (_, i) => (
                <i
                  key={i}
                  className={i < (resources.ram.modules || 0) ? "occupied" : ""}
                />
              ))}
            </div>
          )}
        </article>
        <article>
          <HardDrive size={21} />
          <small>M.2 / CONEXÕES</small>
          <strong>
            {resources.storage.nvme + resources.storage.m2Sata}{" "}
            <span>/ {resources.storage.m2Slots ?? "?"}</span>
          </strong>
          <p>
            {resources.storage.nvme} NVMe · {resources.storage.m2Sata} M.2 SATA
          </p>
          <small>O protocolo de cada slot é conferido separadamente.</small>
        </article>
        <article>
          <HardDrive size={21} />
          <small>SATA / PORTAS DE DADOS</small>
          <strong>
            {resources.storage.sata}{" "}
            <span>
              /{" "}
              {resources.storage.sataPorts === null
                ? "?"
                : resources.storage.sataPorts -
                  resources.storage.disabledSataPorts.length}
            </span>
          </strong>
          <p>
            {resources.storage.disabledSataPorts.length
              ? `${resources.storage.disabledSataPorts.length} porta(s) desativada(s) por compartilhamento`
              : "Conexões por cabo para SSDs/HDs SATA"}
          </p>
        </article>
      </div>
      <div className="resource-ram">
        <h3>Quantidade de RAM</h3>
        {ram ? (
          <>
            <div className="resource-product">
              <img src={ram.image} alt="" width={75} height={60} />
              <div>
                <strong>{ram.name}</strong>
                <p>
                  1 unidade de compra = {ram.hardware?.modules ?? "?"} módulo(s)
                  · {ram.hardware?.capacityGb ?? "?"} GB no kit
                </p>
              </div>
              {counter(ram, "Quantidade de kits de RAM")}
            </div>
            <p className="resource-help">
              {resources.ram.kits} kit(s) × {ram.hardware?.modules ?? "?"}{" "}
              módulo(s) = {resources.ram.modules ?? "?"} slots ocupados.{" "}
              {resources.ram.kits > 1
                ? "Kits separados não têm XMP/EXPO ou operação conjunta garantidos; confira QVL e BIOS."
                : "Escolha o kit e depois a quantidade de unidades de compra."}
            </p>
          </>
        ) : (
          <button
            type="button"
            className="secondary-button"
            disabled={disabled}
            onClick={() => onPick("ram")}
          >
            Escolher memória RAM
          </button>
        )}
      </div>
      <div className="resource-drives">
        <div className="resource-section-heading">
          <h3>Seus armazenamentos</h3>
          <button
            type="button"
            className="secondary-button"
            disabled={disabled}
            onClick={onAddStorage}
          >
            <Plus size={16} /> Adicionar outro SSD ou HD
          </button>
        </div>
        {drives.length ? (
          drives.map((p) => {
            const offer = bestOffer(p),
              kind = storageKind(p);
            return (
              <div className="resource-product" key={p.id}>
                <img src={p.image} alt="" width={75} height={60} />
                <div>
                  <strong>{p.name}</strong>
                  <p>
                    {kind === "nvme"
                      ? "M.2 NVMe"
                      : kind === "m2sata"
                        ? "M.2 SATA"
                        : kind === "sata"
                          ? "SATA por cabo"
                          : "Protocolo ainda não confirmado"}{" "}
                    · {p.hardware?.capacityGb ?? "?"} GB por unidade
                  </p>
                  <small>
                    {offer
                      ? `${money(offer.priceCents)} por unidade · ${money(offer.priceCents * (quantities[p.id] ?? 1))} na seleção`
                      : "Cotação indisponível"}
                  </small>
                </div>
                {counter(p, `Quantidade de ${p.name}`)}
                <button
                  type="button"
                  className="resource-remove"
                  disabled={disabled}
                  onClick={() => onRemoveStorage(p.id)}
                  aria-label={`Remover armazenamento ${p.name}`}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            );
          })
        ) : (
          <p>Nenhum armazenamento selecionado.</p>
        )}
        {resources.storage.assignments.length > 0 && (
          <details className="resource-assignment">
            <summary>Ver distribuição automática das conexões</summary>
            <ul>
              {resources.storage.assignments.map((d) => (
                <li key={d.componentId + ":" + d.unit}>
                  <b>{d.connection}</b> · {d.name} · unidade {d.unit}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
      <div className="resource-cooling">
        <Fan size={24} />
        <div>
          <h3>
            {cooler
              ? "Cooler separado selecionado"
              : resources.cooling.included
                ? "Cooler incluído no processador"
                : "Refrigeração a escolher"}
          </h3>
          <p>
            {cooler
              ? `${cooler.name} · confira socket, altura ou radiador no gabinete.`
              : resources.cooling.included
                ? `${resources.cooling.name}. Um cooler extra é opcional e não entra no preço enquanto não for escolhido.`
                : cpu
                  ? "Esta versão da CPU não tem cooler incluído confirmado. Selecione um modelo compatível."
                  : "Escolha a CPU para saber se o cooler separado é obrigatório."}
          </p>
        </div>
        <button
          type="button"
          className="secondary-button"
          disabled={disabled}
          onClick={() => onPick("cooler")}
        >
          {cooler
            ? "Trocar cooler"
            : resources.cooling.included
              ? "Adicionar cooler opcional"
              : "Escolher cooler"}
        </button>
      </div>
      {resources.issues.length > 0 && (
        <ul className="resource-errors" role="status">
          {resources.issues.map((i) => (
            <li key={i.code}>{i.message}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
