export default function ComponentFacts({ product }) {
  const h = product.hardware || {};
  const values = [
    h.socket,
    h.ramType,
    h.capacityGb && `${h.capacityGb} GB`,
    h.modules && `${h.modules} módulo(s)`,
    h.speedMts && `${h.speedMts} MT/s`,
    h.vramGb && `${h.vramGb} GB VRAM`,
    h.wattage && `${h.wattage} W`,
    h.tdpWatts && `TDP ${h.tdpWatts} W`,
    h.interface,
    h.formFactor,
    h.radiatorSizeMm && `Radiador ${h.radiatorSizeMm} mm`,
  ]
    .filter(Boolean)
    .slice(0, 4);
  return values.length ? (
    <ul className="component-facts" aria-label="Características principais">
      {values.map((value) => (
        <li key={value}>{value}</li>
      ))}
    </ul>
  ) : null;
}
