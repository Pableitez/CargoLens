import { LocationCombobox } from "../../components/LocationCombobox";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import {
  dateInputToIso,
  emptyRoutingLeg,
  patchRoutingLeg,
  resequenceRoutingLegs,
  routingLegEtaInput,
  routingLegEtdInput,
  routingLegTransportModes,
} from "./carrierBookingRoutingLegForm";
import { routingLegModeLabel } from "./carrierBookingRoutingLegs";
import type { CarrierBookingRoutingLeg, CarrierBookingRoutingLegMode } from "./types";

type CarrierBookingRoutingLegsEditorProps = {
  legs: CarrierBookingRoutingLeg[];
  disabled?: boolean;
  onChange: (legs: CarrierBookingRoutingLeg[]) => void;
};

export function CarrierBookingRoutingLegsEditor({
  legs,
  disabled = false,
  onChange,
}: CarrierBookingRoutingLegsEditorProps) {
  const { t } = useAppTranslation();

  function updateLeg(index: number, patch: Partial<CarrierBookingRoutingLeg>) {
    onChange(legs.map((leg, i) => (i === index ? patchRoutingLeg(leg, patch) : leg)));
  }

  function removeLeg(index: number) {
    onChange(resequenceRoutingLegs(legs.filter((_, i) => i !== index)));
  }

  function addLeg() {
    onChange(resequenceRoutingLegs([...legs, emptyRoutingLeg(legs.length + 1)]));
  }

  return (
    <div className="carrier-routing-legs carrier-routing-legs--editable">
      <h4 className="carrier-routing-legs__heading">{t("carrierBookingsPage.routingLegsTitle")}</h4>

      {legs.length === 0 ? (
        <p className="panel__muted">{t("carrierBookingsPage.noRoutingLegs")}</p>
      ) : (
        <div className="carrier-routing-leg-cards">
          {legs.map((leg, index) => {
            const pol = leg.portOfLoading || leg.originCode;
            const pod = leg.portOfDischarge || leg.destinationCode;
            const isOcean = leg.transportMode === "ocean" || leg.transportMode === "transshipment";

            return (
              <article key={`leg-${leg.sequence}-${index}`} className="carrier-routing-leg-card">
                <header className="carrier-routing-leg-card__head">
                  <span className="carrier-routing-leg-card__seq">{leg.sequence}</span>
                  <div className="field carrier-routing-leg-card__mode">
                    <label className="field__label" htmlFor={`cb-leg-mode-${index}`}>
                      {t("carrierBookingsPage.routingLegModeColumn")}
                    </label>
                    <select
                      id={`cb-leg-mode-${index}`}
                      className="field__input"
                      value={leg.transportMode}
                      disabled={disabled}
                      onChange={(e) =>
                        updateLeg(index, {
                          transportMode: e.target.value as CarrierBookingRoutingLegMode,
                        })
                      }
                    >
                      {routingLegTransportModes().map((mode) => (
                        <option key={mode} value={mode}>
                          {routingLegModeLabel(mode, t)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {!disabled ? (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm btn--danger carrier-routing-leg-card__remove"
                      onClick={() => removeLeg(index)}
                    >
                      {t("carrierBookingsPage.removeRoutingLeg")}
                    </button>
                  ) : null}
                </header>

                <div className="carrier-routing-leg-card__grid">
                  <div className="field">
                    <label className="field__label" htmlFor={`cb-leg-pol-${index}`}>
                      {t("carrierBookingsPage.portOfLoadingLabel")}
                    </label>
                    <LocationCombobox
                      id={`cb-leg-pol-${index}`}
                      value={pol}
                      disabled={disabled}
                      listMode="panel"
                      onChange={(code) => updateLeg(index, { portOfLoading: code, originCode: code })}
                    />
                  </div>
                  <div className="field">
                    <label className="field__label" htmlFor={`cb-leg-pod-${index}`}>
                      {t("carrierBookingsPage.portOfDischargeLabel")}
                    </label>
                    <LocationCombobox
                      id={`cb-leg-pod-${index}`}
                      value={pod}
                      disabled={disabled}
                      listMode="panel"
                      onChange={(code) => updateLeg(index, { portOfDischarge: code, destinationCode: code })}
                    />
                  </div>
                  <div className="field">
                    <label className="field__label" htmlFor={`cb-leg-vessel-${index}`}>
                      {t("carrierBookingsPage.routingVesselLabel")}
                    </label>
                    <input
                      id={`cb-leg-vessel-${index}`}
                      className="field__input"
                      value={leg.vesselName ?? ""}
                      disabled={disabled || !isOcean}
                      onChange={(e) => updateLeg(index, { vesselName: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label className="field__label" htmlFor={`cb-leg-voyage-${index}`}>
                      {t("carrierBookingsPage.routingVoyageLabel")}
                    </label>
                    <input
                      id={`cb-leg-voyage-${index}`}
                      className="field__input order-code"
                      value={leg.voyageNumber ?? ""}
                      disabled={disabled || !isOcean}
                      onChange={(e) => updateLeg(index, { voyageNumber: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label className="field__label" htmlFor={`cb-leg-etd-${index}`}>
                      {t("carrierBookingsPage.routingEtdLabel")}
                    </label>
                    <input
                      id={`cb-leg-etd-${index}`}
                      type="date"
                      className="field__input"
                      value={routingLegEtdInput(leg)}
                      disabled={disabled || !isOcean}
                      onChange={(e) => updateLeg(index, { etd: dateInputToIso(e.target.value) })}
                    />
                  </div>
                  <div className="field">
                    <label className="field__label" htmlFor={`cb-leg-eta-${index}`}>
                      {t("carrierBookingsPage.routingEtaLabel")}
                    </label>
                    <input
                      id={`cb-leg-eta-${index}`}
                      type="date"
                      className="field__input"
                      value={routingLegEtaInput(leg)}
                      disabled={disabled || !isOcean}
                      onChange={(e) => updateLeg(index, { eta: dateInputToIso(e.target.value) })}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!disabled ? (
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => addLeg()}>
          {t("carrierBookingsPage.addRoutingLeg")}
        </button>
      ) : null}
    </div>
  );
}
