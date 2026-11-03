export default function StorageConnections({ board, resources }) {
  if (!board) return null;
  const slots = board.hardware?.m2Slots || [],
    ports = board.hardware?.sataPorts;
  const occupied = new Set(
    resources.storage.assignments.map((a) => a.connection),
  );
  const disabled = new Set(resources.storage.disabledSataPorts);
  return (
    <div className="storage-connections">
      <h4>Conexões da {board.name}</h4>
      <div>
        {slots.map((slot) => (
          <span
            key={slot.id}
            className={occupied.has(slot.id) ? "is-occupied" : ""}
          >
            <b>{slot.id}</b>
            <small>
              {slot.protocols?.join(" / ") || "Protocolo a conferir"}
            </small>
            <em>{occupied.has(slot.id) ? "Ocupado" : "Livre"}</em>
          </span>
        ))}
        {Number.isSafeInteger(ports) &&
          Array.from({ length: ports }, (_, i) => i + 1).map((port) => (
            <span
              key={`sata${port}`}
              className={
                disabled.has(port)
                  ? "is-disabled"
                  : occupied.has(`SATA ${port}`)
                    ? "is-occupied"
                    : ""
              }
            >
              <b>SATA {port}</b>
              <small>Conexão por cabo</small>
              <em>
                {disabled.has(port)
                  ? "Desativada por compartilhamento"
                  : occupied.has(`SATA ${port}`)
                    ? "Ocupada"
                    : "Livre"}
              </em>
            </span>
          ))}
      </div>
    </div>
  );
}
