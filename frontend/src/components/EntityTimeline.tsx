import { formatEventDate } from "../utils/eventUtils";

export type EntityTimelineEvent = {
  id: string;
  kind: string;
  message: string;
  actorEmail?: string;
  occurredAt: string;
};

type EntityTimelineProps = {
  events: EntityTimelineEvent[];
  emptyLabel: string;
  kindLabel: (kind: string) => string;
  dateFallback?: string;
};

export function EntityTimeline({ events, emptyLabel, kindLabel, dateFallback = "—" }: EntityTimelineProps) {
  if (events.length === 0) {
    return <p className="panel__muted">{emptyLabel}</p>;
  }

  return (
    <ol className="shipment-timeline">
      {events.map((event) => (
        <li key={event.id} className="shipment-timeline__item">
          <div className="shipment-timeline__meta">
            <span className="shipment-timeline__kind">{kindLabel(event.kind)}</span>
            <time className="shipment-timeline__time" dateTime={event.occurredAt}>
              {formatEventDate(event.occurredAt, dateFallback)}
            </time>
          </div>
          <p className="shipment-timeline__message">{event.message}</p>
          {event.actorEmail && <p className="shipment-timeline__actor">{event.actorEmail}</p>}
        </li>
      ))}
    </ol>
  );
}
