export function Timeline({ events }) {
  if (!events?.length) return null;
  return (
    <ol className="timeline">
      {events.map((ev, i) => (
        <li key={ev.id ?? `ev-${i}`} className="timeline__item">
          <div className="timeline__dot" data-actual={ev.actual} />
          <div>
            <div className="timeline__label-row">
              <span className="timeline__label">{ev.label}</span>
              {ev.code && <span className="timeline__code">{ev.code}</span>}
              {ev.routeType && (
                <span className="timeline__route">{ev.routeType}</span>
              )}
            </div>
            <div className="timeline__meta">
              {ev.place}
              <span className="timeline__date">
                {new Date(ev.date).toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
              {!ev.actual && (
                <span className="timeline__planned"> (estimated)</span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
