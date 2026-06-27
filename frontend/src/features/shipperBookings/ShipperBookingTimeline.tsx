import { EntityTimeline } from "../../components/EntityTimeline";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { eventKindLabel } from "./eventUtils";
import type { ShipperBookingEvent } from "./types";

type ShipperBookingTimelineProps = {
  events: ShipperBookingEvent[];
  emptyLabel: string;
};

export function ShipperBookingTimeline({ events, emptyLabel }: ShipperBookingTimelineProps) {
  const { t } = useAppTranslation();

  return (
    <EntityTimeline
      events={events}
      emptyLabel={emptyLabel}
      kindLabel={(kind) => eventKindLabel(kind as ShipperBookingEvent["kind"], t)}
    />
  );
}
