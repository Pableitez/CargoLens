import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LocationCell } from "../../components/LocationCombobox";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { bookingStatusLabel } from "../shipperBookings/shipperBookingUtils";
import type { ShipperBooking } from "../shipperBookings/types";

type ShipperBookingPickerProps = {
  bookings: ShipperBooking[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  disabled?: boolean;
  minQueryLength?: number;
  hideSelectedSummary?: boolean;
  /** Require a search query before showing any rows (no “recent” fallback). */
  searchOnly?: boolean;
  /** Fixed-height scroll area — for modals. */
  embedded?: boolean;
  maxResults?: number;
};

const SHIPPER_BOOKING_BASE = "/dashboard/operations/export/shipper-booking";
const DEFAULT_MIN_QUERY = 2;
const DEFAULT_MAX_RESULTS = 50;

function matchesQuery(row: ShipperBooking, query: string): boolean {
  return [row.bookingReference, row.customer, row.shipper, row.portOfLoading, row.portOfDischarge, row.status]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

export function SelectedShipperBookingsSummary({
  bookings,
  selectedIds,
  onChangeSelection,
}: {
  bookings: ShipperBooking[];
  selectedIds: string[];
  onChangeSelection?: () => void;
}) {
  const { t } = useAppTranslation();
  const selected = bookings.filter((row) => selectedIds.includes(row.id));

  if (selected.length === 0) return null;

  return (
    <div className="carrier-sb-selected">
      <span className="field__label">{t("carrierBookingsPage.shipperBookingSection")}</span>
      <ul className="carrier-sb-selected__list">
        {selected.map((row) => (
          <li key={row.id}>
            <Link to={`${SHIPPER_BOOKING_BASE}/${row.id}`} className="carrier-sb-selected__pill order-code">
              {row.bookingReference}
            </Link>
          </li>
        ))}
      </ul>
      {onChangeSelection ? (
        <button type="button" className="btn btn--ghost btn--sm" onClick={onChangeSelection}>
          {t("carrierBookingsPage.changeSbSelection")}
        </button>
      ) : null}
    </div>
  );
}

export function ShipperBookingPicker({
  bookings,
  selectedIds,
  onChange,
  disabled = false,
  minQueryLength = DEFAULT_MIN_QUERY,
  hideSelectedSummary = false,
  searchOnly = false,
  embedded = false,
  maxResults = DEFAULT_MAX_RESULTS,
}: ShipperBookingPickerProps) {
  const { t } = useAppTranslation();
  const [query, setQuery] = useState("");

  const trimmedQuery = query.trim();
  const queryReady = trimmedQuery.length >= minQueryLength;
  const q = trimmedQuery.toLowerCase();

  const allMatches = useMemo(() => {
    if (!queryReady) return [];
    return bookings.filter((row) => matchesQuery(row, q));
  }, [bookings, q, queryReady]);

  const truncated = allMatches.length > maxResults;
  const visibleMatches = useMemo(() => allMatches.slice(0, maxResults), [allMatches, maxResults]);

  const visibleRows = useMemo(() => {
    if (searchOnly && !queryReady) return [];
    const base = queryReady ? visibleMatches : bookings.slice(0, 20);
    const byId = new Map(base.map((row) => [row.id, row]));
    for (const id of selectedIds) {
      if (!byId.has(id)) {
        const row = bookings.find((b) => b.id === id);
        if (row) byId.set(id, row);
      }
    }
    return [...byId.values()];
  }, [bookings, queryReady, searchOnly, selectedIds, visibleMatches]);

  function toggle(id: string) {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((rowId) => rowId !== id));
      return;
    }
    onChange([...selectedIds, id]);
  }

  const resultsBody =
    searchOnly && !queryReady ? (
      <p className="panel__muted carrier-sb-picker__empty">
        {t("carrierBookingsPage.searchShipperBookingsRequiredHint")}
      </p>
    ) : !queryReady ? (
      <p className="panel__muted carrier-sb-picker__empty">
        {t("carrierBookingsPage.searchShipperBookingsRecentHint", { count: visibleRows.length })}
      </p>
    ) : bookings.length === 0 ? (
      <p className="panel__muted carrier-sb-picker__empty">{t("carrierBookingsPage.noShipperBookings")}</p>
    ) : visibleRows.length === 0 ? (
      <p className="panel__muted carrier-sb-picker__empty">
        {t("carrierBookingsPage.noShipperSearchResults")}
      </p>
    ) : (
      <>
        {truncated ? (
          <p className="panel__muted panel__muted--compact carrier-sb-picker__truncated">
            {t("carrierBookingsPage.searchResultsTruncated", { count: maxResults })}
          </p>
        ) : null}
        <table className="dash-table order-lines-table carrier-sb-picker__table">
          <thead>
            <tr>
              <th scope="col" className="dash-table__check-col">
                <span className="sr-only">{t("carrierBookingsPage.selectShipperBooking")}</span>
              </th>
              <th scope="col">{t("carrierBookingsPage.thShipperBooking")}</th>
              <th scope="col">{t("tradeField.contractualCustomer")}</th>
              <th scope="col">{t("carrierBookingsPage.portOfLoadingLabel")}</th>
              <th scope="col">{t("carrierBookingsPage.portOfDischargeLabel")}</th>
              <th scope="col">{t("carrierBookingsPage.thStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const checked = selectedIds.includes(row.id);
              return (
                <tr key={row.id} className={checked ? "dash-table__row--selected" : undefined}>
                  <td>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(row.id)}
                      disabled={disabled}
                      aria-label={row.bookingReference}
                    />
                  </td>
                  <td>
                    <Link to={`${SHIPPER_BOOKING_BASE}/${row.id}`} className="dash-table__link order-code">
                      {row.bookingReference}
                    </Link>
                  </td>
                  <td>{row.customer}</td>
                  <td>
                    <LocationCell code={row.portOfLoading} />
                  </td>
                  <td>
                    <LocationCell code={row.portOfDischarge} />
                  </td>
                  <td>{bookingStatusLabel(row.status, t)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </>
    );

  return (
    <div className={`carrier-sb-picker${embedded ? " carrier-sb-picker--embedded" : ""}`}>
      <div className="field">
        <label className="field__label" htmlFor="carrier-sb-search">
          {t("carrierBookingsPage.searchShipperBookings")}
        </label>
        <input
          id="carrier-sb-search"
          type="search"
          className="field__input"
          value={query}
          placeholder={t("carrierBookingsPage.searchShipperBookingsPlaceholder")}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
          autoComplete="off"
        />
      </div>

      {selectedIds.length > 0 && !hideSelectedSummary ? (
        <SelectedShipperBookingsSummary bookings={bookings} selectedIds={selectedIds} />
      ) : null}

      <div className={`carrier-sb-picker__results${embedded ? " carrier-sb-picker__results--scroll" : ""}`}>
        {embedded ? resultsBody : <div className="dash-table-wrap dash-table-wrap--mt">{resultsBody}</div>}
      </div>
    </div>
  );
}
