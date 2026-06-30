import { LocationCell } from "../../components/LocationCombobox";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { formatCarrierBookingDate } from "./carrierBookingUtils";
import { routingLegModeLabel } from "./carrierBookingRoutingLegs";
import type { CarrierBookingRoutingLeg } from "./types";

type CarrierBookingRoutingLegsPanelProps = {
  legs: CarrierBookingRoutingLeg[];
};

function scheduleCell(value: string | null | undefined): string {
  if (!value) return "—";
  return formatCarrierBookingDate(value);
}

export function CarrierBookingRoutingLegsPanel({ legs }: CarrierBookingRoutingLegsPanelProps) {
  const { t } = useAppTranslation();

  if (legs.length === 0) return null;

  return (
    <div className="carrier-routing-legs">
      <h4 className="carrier-routing-legs__heading">{t("carrierBookingsPage.routingLegsTitle")}</h4>
      <div className="dash-table-wrap">
        <table className="dash-table carrier-routing-legs__table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">{t("carrierBookingsPage.routingLegModeColumn")}</th>
              <th scope="col">{t("carrierBookingsPage.portOfLoadingLabel")}</th>
              <th scope="col">{t("carrierBookingsPage.portOfDischargeLabel")}</th>
              <th scope="col">{t("carrierBookingsPage.routingVesselLabel")}</th>
              <th scope="col">{t("carrierBookingsPage.routingVoyageLabel")}</th>
              <th scope="col">{t("carrierBookingsPage.routingEtdLabel")}</th>
              <th scope="col">{t("carrierBookingsPage.routingEtaLabel")}</th>
            </tr>
          </thead>
          <tbody>
            {legs.map((leg) => {
              const pol = leg.portOfLoading || leg.originCode;
              const pod = leg.portOfDischarge || leg.destinationCode;
              const isOcean = leg.transportMode === "ocean" || leg.transportMode === "transshipment";

              return (
                <tr key={`${leg.sequence}-${leg.originCode}-${leg.destinationCode}`}>
                  <td>{leg.sequence}</td>
                  <td>{routingLegModeLabel(leg.transportMode, t)}</td>
                  <td>
                    <LocationCell code={pol} />
                  </td>
                  <td>
                    <LocationCell code={pod} />
                  </td>
                  <td>{isOcean && leg.vesselName ? leg.vesselName : "—"}</td>
                  <td className="order-code">{isOcean && leg.voyageNumber ? leg.voyageNumber : "—"}</td>
                  <td className="dash-table__date">{isOcean ? scheduleCell(leg.etd) : "—"}</td>
                  <td className="dash-table__date">{isOcean ? scheduleCell(leg.eta) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
