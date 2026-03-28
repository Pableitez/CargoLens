export function VesselCard({ vessel }) {
  if (!vessel) return null;
  const rows = [
    { k: "Nombre", v: vessel.name },
    { k: "IMO", v: vessel.imo },
    { k: "MMSI", v: vessel.mmsi },
    { k: "Indicativo", v: vessel.callSign },
    { k: "Bandera", v: vessel.flag },
  ].filter((r) => r.v != null && String(r.v).trim() !== "" && r.v !== "—");

  if (!rows.length) return null;

  return (
    <div className="info-card">
      <h3 className="info-card__title">Buque</h3>
      <dl className="info-card__grid">
        {rows.map((r) => (
          <div key={r.k} className="info-card__cell">
            <dt>{r.k}</dt>
            <dd>{r.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
