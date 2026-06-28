import { EntityTimeline } from "../../components/EntityTimeline";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import type { CarrierBookingEvent } from "./types";

type CarrierBookingTimelineProps = {
  events: CarrierBookingEvent[];
  emptyLabel: string;
};

export function CarrierBookingTimeline({ events, emptyLabel }: CarrierBookingTimelineProps) {
  const { t } = useAppTranslation();

  return (
    <EntityTimeline
      events={events}
      emptyLabel={emptyLabel}
      kindLabel={(kind) =>
        t(`carrierBookingsPage.eventKind.${kind as CarrierBookingEvent["kind"]}`, { defaultValue: kind })
      }
    />
  );
}
