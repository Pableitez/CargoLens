import { useAppTranslation } from "../../i18n/useAppTranslation";
import { eventKindLabel, formatEventDate } from "./eventUtils";
import type { ShipmentEvent } from "./types";

type ShipmentTimelineProps = {
  events: ShipmentEvent[];
  emptyLabel: string;
};

export function ShipmentTimeline({ events, emptyLabel }: ShipmentTimelineProps) {
  const { t } = useAppTranslation();

  if (events.length === 0) {
    return <p className="panel__muted">{emptyLabel}</p>;
  }

  return (
    <ol className="shipment-timeline">
      {events.map((event) => (
        <li key={event.id} className="shipment-timeline__item">
          <div className="shipment-timeline__meta">
            <span className="shipment-timeline__kind">{eventKindLabel(event.kind, t)}</span>
            <time className="shipment-timeline__time" dateTime={event.occurredAt}>
              {formatEventDate(event.occurredAt)}
            </time>
          </div>
          <p className="shipment-timeline__message">{event.message}</p>
          {event.actorEmail && <p className="shipment-timeline__actor">{event.actorEmail}</p>}
        </li>
      ))}
    </ol>
  );
}
