import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LocationCell } from "../../components/LocationCombobox";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { bookingStatusLabel } from "../shipperBookings/shipperBookingUtils";
import type { ShipperBooking } from "../shipperBookings/types";
import { SHIPPER_BOOKING_BASE, type ShipperBookingLink } from "./carrierBookingUtils";
import { prefillCarrierBookingFromShipperBookings } from "./prefillFromShipperBookings";
import { ShipperBookingLinkModal } from "./ShipperBookingLinkModal";
import type { CarrierBookingFormState } from "./types";

type LinkedShipperBookingRow = {
  id: string;
  bookingReference: string;
  customer: string;
  portOfLoading: string;
  portOfDischarge: string;
  status: ShipperBooking["status"] | "";
};

type CarrierBookingShipperLinksEditorProps = {
  bookings: ShipperBooking[];
  selectedIds: string[];
  fallbackLinks?: ShipperBookingLink[];
  onChange: (selectedIds: string[]) => void;
  disabled?: boolean;
};

function buildLinkedRows(
  selectedIds: string[],
  bookings: ShipperBooking[],
  fallbackLinks: ShipperBookingLink[]
): LinkedShipperBookingRow[] {
  return selectedIds.map((id, index) => {
    const full = bookings.find((row) => row.id === id);
    if (full) {
      return {
        id: full.id,
        bookingReference: full.bookingReference,
        customer: full.customer,
        portOfLoading: full.portOfLoading,
        portOfDischarge: full.portOfDischarge,
        status: full.status,
      };
    }

    const link = fallbackLinks.find((row) => row.id === id) ?? fallbackLinks[index];
    return {
      id,
      bookingReference: link?.ref ?? id,
      customer: "—",
      portOfLoading: "",
      portOfDischarge: "",
      status: "",
    };
  });
}

export function CarrierBookingShipperLinksEditor({
  bookings,
  selectedIds,
  fallbackLinks = [],
  onChange,
  disabled = false,
}: CarrierBookingShipperLinksEditorProps) {
  const { t } = useAppTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const linkedRows = useMemo(
    () => buildLinkedRows(selectedIds, bookings, fallbackLinks),
    [bookings, fallbackLinks, selectedIds]
  );

  return (
    <section className="order-section" aria-labelledby="cb-sb-links-heading">
      <div className="panel__head-row panel__head-row--section">
        <h3 id="cb-sb-links-heading" className="order-section__title">
          {t("carrierBookingsPage.shipperBookingSection")}
          {linkedRows.length > 0 ? (
            <span className="order-section__title-count"> ({linkedRows.length})</span>
          ) : null}
        </h3>
        {!disabled ? (
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => setModalOpen(true)}>
            {t("carrierBookingsPage.addShipperBooking")}
          </button>
        ) : null}
      </div>

      <div className="dash-table-wrap carrier-sb-links-table">
        <table className="dash-table">
          <thead>
            <tr>
              <th scope="col">{t("carrierBookingsPage.thShipperBooking")}</th>
              <th scope="col">{t("tradeField.contractualCustomer")}</th>
              <th scope="col">{t("carrierBookingsPage.portOfLoadingLabel")}</th>
              <th scope="col">{t("carrierBookingsPage.portOfDischargeLabel")}</th>
              <th scope="col">{t("carrierBookingsPage.thStatus")}</th>
              {!disabled ? <th scope="col">{t("carrierBookingsPage.thActions")}</th> : null}
            </tr>
          </thead>
          <tbody>
            {linkedRows.length === 0 ? (
              <tr>
                <td colSpan={disabled ? 5 : 6} className="panel__muted">
                  {t("carrierBookingsPage.noLinkedShipperBookings")}
                </td>
              </tr>
            ) : (
              linkedRows.map((row) => (
                <tr key={row.id}>
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
                  <td>{row.status ? bookingStatusLabel(row.status, t) : "—"}</td>
                  {!disabled ? (
                    <td>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm btn--danger"
                        aria-label={t("carrierBookingsPage.unlinkShipperBooking", {
                          reference: row.bookingReference,
                        })}
                        onClick={() => onChange(selectedIds.filter((id) => id !== row.id))}
                      >
                        {t("carrierBookingsPage.unlinkAction")}
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!disabled ? (
        <ShipperBookingLinkModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          bookings={bookings}
          selectedIds={selectedIds}
          onApply={onChange}
        />
      ) : null}
    </section>
  );
}

function sameIdSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const a = [...left].sort();
  const b = [...right].sort();
  return a.every((value, index) => value === b[index]);
}

export function resolveShipperBookingSelectionChange({
  previousIds,
  nextIds,
  selectedBookings,
  previousForm,
  confirmRefresh,
  confirmUnlinkKeepCargo,
}: {
  previousIds: string[];
  nextIds: string[];
  selectedBookings: ShipperBooking[];
  previousForm: CarrierBookingFormState;
  confirmRefresh: () => boolean;
  confirmUnlinkKeepCargo: () => boolean;
}): {
  form: CarrierBookingFormState;
  refreshFromShipperBookings: boolean;
} {
  if (sameIdSet(previousIds, nextIds)) {
    return { form: previousForm, refreshFromShipperBookings: false };
  }

  if (nextIds.length === 0) {
    if (previousForm.cargoLines.length > 0 && previousIds.length > 0) {
      const keepCargo = confirmUnlinkKeepCargo();
      if (keepCargo) {
        return {
          form: { ...previousForm, shipperBookingIds: [] },
          refreshFromShipperBookings: false,
        };
      }
    }
    return {
      form: { ...previousForm, shipperBookingIds: [], cargoLines: [] },
      refreshFromShipperBookings: false,
    };
  }

  const hasExistingCargo = previousForm.cargoLines.length > 0;
  const shouldConfirm = hasExistingCargo && !sameIdSet(previousIds, nextIds);

  if (shouldConfirm) {
    const refresh = confirmRefresh();
    if (refresh) {
      return {
        form: prefillCarrierBookingFromShipperBookings(selectedBookings, previousForm),
        refreshFromShipperBookings: true,
      };
    }
    return {
      form: { ...previousForm, shipperBookingIds: nextIds },
      refreshFromShipperBookings: false,
    };
  }

  return {
    form: prefillCarrierBookingFromShipperBookings(selectedBookings, previousForm),
    refreshFromShipperBookings: true,
  };
}
