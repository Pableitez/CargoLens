import { LocationCell } from "../../components/LocationCombobox";
import { useAppTranslation } from "../../i18n/useAppTranslation";

type CarrierBookingRoutingSummaryProps = {
  placeOfReceipt: string;
  portOfLoading: string;
  portOfDischarge: string;
  placeOfDelivery: string;
};

export function CarrierBookingRoutingSummary({
  placeOfReceipt,
  portOfLoading,
  portOfDischarge,
  placeOfDelivery,
}: CarrierBookingRoutingSummaryProps) {
  const { t } = useAppTranslation();

  return (
    <div className="order-section__grid carrier-routing-summary">
      <div className="field">
        <span className="field__label">{t("carrierBookingsPage.placeOfReceiptLabel")}</span>
        <p className="field__readonly-value">
          <LocationCell code={placeOfReceipt} />
        </p>
      </div>
      <div className="field">
        <span className="field__label">{t("carrierBookingsPage.portOfLoadingLabel")}</span>
        <p className="field__readonly-value">
          <LocationCell code={portOfLoading} />
        </p>
      </div>
      <div className="field">
        <span className="field__label">{t("carrierBookingsPage.portOfDischargeLabel")}</span>
        <p className="field__readonly-value">
          <LocationCell code={portOfDischarge} />
        </p>
      </div>
      <div className="field">
        <span className="field__label">{t("carrierBookingsPage.placeOfDeliveryLabel")}</span>
        <p className="field__readonly-value">
          <LocationCell code={placeOfDelivery} />
        </p>
      </div>
    </div>
  );
}
