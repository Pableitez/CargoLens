import { EntityTimeline } from "../../components/EntityTimeline";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { eventKindLabel } from "./eventUtils";
import type { OrderEvent } from "./types";

type OrderTimelineProps = {
  events: OrderEvent[];
  emptyLabel: string;
};

export function OrderTimeline({ events, emptyLabel }: OrderTimelineProps) {
  const { t } = useAppTranslation();

  return (
    <EntityTimeline
      events={events}
      emptyLabel={emptyLabel}
      kindLabel={(kind) => eventKindLabel(kind as OrderEvent["kind"], t)}
    />
  );
}
