import { formatDateTime } from "../utils/format.js";

function RouteMilestones({ milestones }) {
  if (!milestones?.length) return null;
  return (
    <div className="route-strip" role="list">
      {milestones.map((m, i) => (
        <div key={`${m.key}-${i}`} className="route-strip__leg" role="listitem">
          <div className="route-strip__connector" aria-hidden={i === 0}>
            {i > 0 && <span className="route-strip__line" />}
            <span className="route-strip__dot" data-actual={m.actual} />
          </div>
          <div className="route-strip__body">
            <div className="route-strip__role">{m.key}</div>
            <div className="route-strip__title">{m.title}</div>
            {m.locode && <div className="route-strip__locode">{m.locode}</div>}
            <div className="route-strip__when">
              {m.date ? formatDateTime(m.date) : "—"}
              {m.actual === false && (
                <span className="route-strip__est"> · estimated</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export { RouteMilestones };
