import { useAppTranslation } from "../../i18n/useAppTranslation";
import {
  emptyFacetFilterState,
  isFacetOptionSelected,
  type FacetFilterState,
} from "../../utils/facetFilters";
import { carrierBookingStatusLabel } from "./carrierBookingUtils";
import type { CarrierBookingStatus } from "./types";

const QUICK_STATUS_FILTERS: CarrierBookingStatus[] = [
  "draft",
  "acknowledged",
  "confirmed",
  "rejected",
  "failed",
];

type CarrierBookingStatusQuickFiltersProps = {
  statusFilter: FacetFilterState | undefined;
  onToggleStatus: (label: string) => void;
};

export function CarrierBookingStatusQuickFilters({
  statusFilter,
  onToggleStatus,
}: CarrierBookingStatusQuickFiltersProps) {
  const { t } = useAppTranslation();
  const state = statusFilter ?? emptyFacetFilterState();

  return (
    <div
      className="module-list-toolbar__quick-filters"
      role="group"
      aria-label={t("carrierBookingsPage.quickStatusFilters")}
    >
      {QUICK_STATUS_FILTERS.map((status) => {
        const label = carrierBookingStatusLabel(status, t);
        const active = isFacetOptionSelected(state, label);
        return (
          <button
            key={status}
            type="button"
            className={`module-list-toolbar__quick-filter${active ? " module-list-toolbar__quick-filter--active" : ""}`}
            aria-pressed={active}
            onClick={() => onToggleStatus(label)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
