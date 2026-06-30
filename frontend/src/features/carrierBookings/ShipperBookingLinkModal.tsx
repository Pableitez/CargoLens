import { useEffect, useState } from "react";
import { Modal } from "../../components/Modal";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import type { ShipperBooking } from "../shipperBookings/types";
import { ShipperBookingPicker } from "./ShipperBookingPicker";

type ShipperBookingLinkModalProps = {
  open: boolean;
  onClose: () => void;
  bookings: ShipperBooking[];
  selectedIds: string[];
  onApply: (nextIds: string[]) => void;
};

export function ShipperBookingLinkModal({
  open,
  onClose,
  bookings,
  selectedIds,
  onApply,
}: ShipperBookingLinkModalProps) {
  const { t } = useAppTranslation();
  const [draftIds, setDraftIds] = useState(selectedIds);

  useEffect(() => {
    if (open) setDraftIds(selectedIds);
  }, [open, selectedIds]);

  function handleApply() {
    onApply(draftIds);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("carrierBookingsPage.addShipperBookingsModalTitle")}
      closeLabel={t("toast.close")}
      className="app-modal--sb-link"
    >
      <div className="carrier-sb-link-modal">
        <div className="carrier-sb-link-modal__intro">
          <p className="panel__muted panel__muted--compact">
            {t("carrierBookingsPage.shipperBookingLinksHint")}
          </p>
          {draftIds.length > 0 ? (
            <p className="carrier-sb-link-modal__selection">
              {t("carrierBookingsPage.selectedShipperBookings", { count: draftIds.length })}
            </p>
          ) : null}
        </div>

        <div className="carrier-sb-link-modal__picker">
          <ShipperBookingPicker
            bookings={bookings}
            selectedIds={draftIds}
            onChange={setDraftIds}
            searchOnly
            embedded
            maxResults={50}
            hideSelectedSummary
          />
        </div>

        <div className="dash-form__actions dash-form__actions--end carrier-sb-link-modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            {t("carrierBookingsPage.cancel")}
          </button>
          <button type="button" className="btn btn--primary" onClick={() => handleApply()}>
            {t("carrierBookingsPage.applyShipperBookingSelection")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
