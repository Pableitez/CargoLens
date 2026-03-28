export function LocationsBar({ locations }) {
  if (!locations?.length) return null;
  return (
    <div className="locations-bar">
      <span className="locations-bar__label">Route locations</span>
      <div className="locations-bar__chips">
        {locations.map((loc) => (
          <span key={loc.id} className="loc-chip" title={loc.country ?? ""}>
            <span className="loc-chip__name">{loc.name ?? loc.locode}</span>
            {loc.locode && <span className="loc-chip__code">{loc.locode}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
