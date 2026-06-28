import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import * as carrierBookingsApi from "../../api/carrierBookings";
import * as shipperBookingsApi from "../../api/shipperBookings";
import { PageBreadcrumb } from "../../components/PageBreadcrumb.jsx";
import { LocationCombobox } from "../../components/LocationCombobox";
import { TimelineModal } from "../../components/TimelineModal";
import { useAppToast } from "../../hooks/useAppToast";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { messageFromApiErrorOrKey } from "../../i18n/apiMessage.js";
import { resolveLocationCode } from "../../utils/locationUtils";
import { OrderTradeFields, type OrderTradeSelection } from "../orders/OrderTradeFields";
import { OrderLocationFields } from "../orders/OrderLocationFields";
import { useOrderTradeContext } from "../orders/useOrderTradeContext";
import type { OrderChainDefaults } from "../orders/useOrderTradeSetup";
import { CarrierBookingTimeline } from "./CarrierBookingTimeline";
import {
  canDeleteCarrierBooking,
  canEditCarrierBooking,
  canSubmitCarrierBooking,
  carrierBookingStatusClass,
  carrierBookingStatusLabel,
  formatCarrierBookingDate,
} from "./carrierBookingUtils";
import {
  carrierBookingFormToPayload,
  formFromCarrierBookingItem,
  prefillCarrierBookingFromShipperBookings,
} from "./prefillFromShipperBookings";
import { ShipperBookingPicker, SelectedShipperBookingsSummary } from "./ShipperBookingPicker";
import {
  CARRIER_FREIGHT_PAYMENT_TERMS,
  CARRIER_SCAC_CODES,
  CARRIER_SERVICE_TYPES,
  CONTAINER_EQUIPMENT_TYPES,
  INCOTERMS_2020,
  emptyCarrierBookingForm,
  type CarrierBookingEvent,
  type CarrierBookingFormState,
  type CarrierBookingRequest,
  type ShipperBooking,
} from "./types";

const CARRIER_BOOKING_BASE = "/dashboard/operations/transport/carrier-booking";
const TRANSPORT_HUB = "/dashboard/operations/transport";

type CarrierBookingCreateMode = "manual" | "from-sb";

function resolveCreateMode(pathname: string): CarrierBookingCreateMode | null {
  if (pathname.endsWith("/new/manual")) return "manual";
  if (pathname.endsWith("/new/from-sb")) return "from-sb";
  return null;
}

export function DashboardCarrierBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const createMode = resolveCreateMode(location.pathname);
  const isNew = createMode !== null;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useAppTranslation();
  const { showToast } = useAppToast();

  const [form, setForm] = useState<CarrierBookingFormState>(emptyCarrierBookingForm());
  const [item, setItem] = useState<CarrierBookingRequest | null>(null);
  const [shipperBookings, setShipperBookings] = useState<ShipperBooking[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [events, setEvents] = useState<CarrierBookingEvent[]>([]);
  const [eventMessage, setEventMessage] = useState("");
  const [addingEvent, setAddingEvent] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [error, setError] = useState("");
  const [sbStepReady, setSbStepReady] = useState(createMode !== "from-sb");
  const [chainDefaults, setChainDefaults] = useState<OrderChainDefaults | null>(null);

  const { usesTradeMasters, loading: loadingTradeContext } = useOrderTradeContext();

  const tradeSelection = useMemo<OrderTradeSelection>(
    () => ({
      contractualPartyId: form.contractualPartyId,
      supplyChainId: form.supplyChainId,
      operatingShipperPartyId: form.operatingShipperPartyId,
      operatingConsigneePartyId: form.operatingConsigneePartyId,
    }),
    [
      form.contractualPartyId,
      form.supplyChainId,
      form.operatingShipperPartyId,
      form.operatingConsigneePartyId,
    ]
  );

  const applyChainDefaults = useCallback((defaults: OrderChainDefaults) => {
    setChainDefaults(defaults);
    setForm((prev) => ({
      ...prev,
      incoterm: defaults.incoterm || prev.incoterm,
    }));
  }, []);

  const updateTradeSelection = useCallback((patch: Partial<OrderTradeSelection>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if (patch.operatingShipperPartyId !== undefined) {
        next.placeOfReceiptFacilityId = "";
        next.portOfLoadingFacilityId = "";
        next.placeOfReceipt = "";
        next.portOfLoading = "";
      }
      if (patch.operatingConsigneePartyId !== undefined) {
        next.portOfDischargeFacilityId = "";
        next.placeOfDeliveryFacilityId = "";
        next.portOfDischarge = "";
        next.placeOfDelivery = "";
      }
      if (patch.contractualPartyId !== undefined) {
        next.placeOfReceiptFacilityId = "";
        next.portOfLoadingFacilityId = "";
        next.portOfDischargeFacilityId = "";
        next.placeOfDeliveryFacilityId = "";
        next.placeOfReceipt = "";
        next.portOfLoading = "";
        next.portOfDischarge = "";
        next.placeOfDelivery = "";
      }
      return next;
    });
    if (patch.contractualPartyId !== undefined) {
      setChainDefaults(null);
    }
  }, []);

  const editable = isNew || (item ? canEditCarrierBooking(item.status) : false);
  const submittable = item ? canSubmitCarrierBooking(item.status) : false;
  const deletable = item ? canDeleteCarrierBooking(item.status) : false;
  const hasShipperSelection = form.shipperBookingIds.length > 0;
  const requiresShipperSelection = createMode === "from-sb";
  const showInttraSections =
    !isNew || createMode === "manual" || (createMode === "from-sb" && sbStepReady && hasShipperSelection);
  const formLocked = !editable || (requiresShipperSelection && !hasShipperSelection);
  const isDraft = isNew || item?.status === "draft";
  const canSave = editable && isDraft && (!requiresShipperSelection || (sbStepReady && hasShipperSelection));

  const pageTitle = useMemo(() => {
    if (createMode === "manual") return t("carrierBookingsPage.createManualTitle");
    if (createMode === "from-sb") return t("carrierBookingsPage.createFromSbTitle");
    if (isNew) return t("carrierBookingsPage.createTitle");
    return form.requestReference || t("carrierBookingsPage.detailTitle");
  }, [createMode, form.requestReference, isNew, t]);

  const loadShipperBookings = useCallback(async () => {
    try {
      const rows = await shipperBookingsApi.fetchShipperBookings();
      setShipperBookings(rows.filter((row) => !row.transportMode || row.transportMode === "ocean"));
    } catch {
      setShipperBookings([]);
    }
  }, []);

  const applyShipperSelection = useCallback(
    (selectedIds: string[], rows = shipperBookings) => {
      const selected = rows.filter((row) => selectedIds.includes(row.id));
      setForm((prev) => prefillCarrierBookingFromShipperBookings(selected, prev));
    },
    [shipperBookings]
  );

  const load = useCallback(async () => {
    if (!id || isNew) return;
    setLoading(true);
    setError("");
    try {
      const { item: loaded, events: timeline } = await carrierBookingsApi.fetchCarrierBooking(id);
      setItem(loaded);
      setForm(formFromCarrierBookingItem(loaded));
      setEvents(timeline);
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "carrierBookingsPage.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [id, isNew, t]);

  useEffect(() => {
    loadShipperBookings().catch(() => {});
  }, [loadShipperBookings]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    if (createMode !== "from-sb" || shipperBookings.length === 0) return;
    const fromQuery =
      searchParams
        .get("shipperBookingIds")
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean) ??
      (searchParams.get("shipperBookingId") ? [searchParams.get("shipperBookingId")!] : []);
    if (fromQuery.length > 0) {
      applyShipperSelection(fromQuery, shipperBookings);
      setSbStepReady(true);
    }
  }, [createMode, searchParams, shipperBookings, applyShipperSelection]);

  function handleConfirmSbSelection() {
    if (form.shipperBookingIds.length === 0) {
      setError(t("carrierBookingsPage.shipperBookingRequired"));
      return;
    }
    setError("");
    setSbStepReady(true);
  }

  async function handleSave(e?: FormEvent) {
    e?.preventDefault();
    if (requiresShipperSelection && form.shipperBookingIds.length === 0) {
      setError(t("carrierBookingsPage.shipperBookingRequired"));
      return;
    }
    if (!form.carrierScac.trim()) {
      setError(t("carrierBookingsPage.carrierScacRequired"));
      return;
    }
    if (form.equipment.length === 0) {
      setError(t("carrierBookingsPage.equipmentRequired"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = carrierBookingFormToPayload(form, { usesTradeMasters: !!usesTradeMasters });
      if (isNew) {
        const created = await carrierBookingsApi.createCarrierBooking(payload);
        const savedId = String(created.id ?? "");
        if (!savedId) {
          throw new Error("Missing carrier booking id in create response.");
        }
        setItem(created);
        setForm(formFromCarrierBookingItem(created));
        showToast({ message: t("carrierBookingsPage.savedDraft"), variant: "success" });
        navigate(`${CARRIER_BOOKING_BASE}/${savedId}`, { replace: true });
        return;
      }
      if (!id) return;
      const updated = await carrierBookingsApi.updateCarrierBooking(id, payload);
      setItem(updated);
      setForm(formFromCarrierBookingItem(updated));
      showToast({ message: t("carrierBookingsPage.savedDraft"), variant: "success" });
    } catch (err) {
      const message = messageFromApiErrorOrKey(err, t, "carrierBookingsPage.saveFailed");
      setError(message);
      showToast({ message, variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitToInttra() {
    if (!id || isNew) return;
    setSubmitting(true);
    setError("");
    try {
      const { item: submitted, source } = await carrierBookingsApi.submitCarrierBooking(id);
      setItem(submitted);
      setForm(formFromCarrierBookingItem(submitted));
      const { events: timeline } = await carrierBookingsApi.fetchCarrierBooking(id);
      setEvents(timeline);
      showToast({ message: t("carrierBookingsPage.submitted", { source }), variant: "success" });
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "carrierBookingsPage.submitFailed"));
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!id || !window.confirm(t("carrierBookingsPage.confirmDelete"))) return;
    try {
      await carrierBookingsApi.deleteCarrierBooking(id);
      showToast({ message: t("carrierBookingsPage.deleted"), variant: "success" });
      navigate(CARRIER_BOOKING_BASE);
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "carrierBookingsPage.deleteFailed"));
    }
  }

  async function handleAddEvent() {
    if (!id || !eventMessage.trim()) return;
    setAddingEvent(true);
    try {
      const event = await carrierBookingsApi.createCarrierBookingEvent(id, { message: eventMessage.trim() });
      setEvents((prev) => [event, ...prev]);
      setEventMessage("");
      showToast({ message: t("carrierBookingsPage.eventAdded"), variant: "success" });
    } catch (err) {
      showToast({
        message: messageFromApiErrorOrKey(err, t, "carrierBookingsPage.eventFailed"),
        variant: "error",
      });
    } finally {
      setAddingEvent(false);
    }
  }

  function updateEquipment(index: number, patch: Partial<CarrierBookingFormState["equipment"][number]>) {
    setForm((prev) => ({
      ...prev,
      equipment: prev.equipment.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  }

  if (loading || loadingTradeContext) {
    return <p className="panel__muted">{t("carrierBookingsPage.loading")}</p>;
  }

  if (createMode === "from-sb" && !sbStepReady) {
    return (
      <section
        className="panel panel--dash-form panel--orders"
        aria-labelledby="carrier-booking-sb-step-heading"
      >
        <PageBreadcrumb
          items={[
            { label: t("modules.nav.home"), to: "/dashboard/home" },
            { label: t("modules.transport.title"), to: TRANSPORT_HUB },
            { label: t("modules.transport.carrierBooking"), to: CARRIER_BOOKING_BASE },
            { label: t("carrierBookingsPage.createFromSbTitle") },
          ]}
        />

        <div className="panel__head-row">
          <h2 id="carrier-booking-sb-step-heading" className="panel__title panel__title--section">
            {t("carrierBookingsPage.createFromSbTitle")}
          </h2>
        </div>

        {error && (
          <p className="panel__error" role="alert">
            {error}
          </p>
        )}

        <ShipperBookingPicker
          bookings={shipperBookings}
          selectedIds={form.shipperBookingIds}
          onChange={(selectedIds) => applyShipperSelection(selectedIds)}
        />

        <div className="dash-form__actions dash-form__actions--end">
          <Link to={`${CARRIER_BOOKING_BASE}/new`} className="btn btn--ghost">
            {t("carrierBookingsPage.cancel")}
          </Link>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!hasShipperSelection}
            onClick={() => handleConfirmSbSelection()}
          >
            {t("carrierBookingsPage.continueToForm")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="panel panel--dash-form panel--orders"
      aria-labelledby="carrier-booking-detail-heading"
    >
      <PageBreadcrumb
        items={[
          { label: t("modules.nav.home"), to: "/dashboard/home" },
          { label: t("modules.transport.title"), to: TRANSPORT_HUB },
          { label: t("modules.transport.carrierBooking"), to: CARRIER_BOOKING_BASE },
          { label: pageTitle },
        ]}
      />

      <div className="panel__head-row">
        <h2 id="carrier-booking-detail-heading" className="panel__title panel__title--section">
          {pageTitle}
        </h2>
        {!isNew && (
          <div className="dash-form__actions dash-form__actions--start">
            <button type="button" className="btn btn--secondary" onClick={() => setTimelineOpen(true)}>
              {t("carrierBookingsPage.openTimeline")}
              {events.length > 0 && <span className="timeline-trigger__count">{events.length}</span>}
            </button>
            {deletable && (
              <button type="button" className="btn btn--ghost btn--danger" onClick={() => handleDelete()}>
                {t("carrierBookingsPage.delete")}
              </button>
            )}
          </div>
        )}
      </div>

      {!isNew && item && (
        <p className="panel__subhead">
          <strong className="order-code">{form.requestReference}</strong>
          {item.shipperBookingReference ? ` · SB ${item.shipperBookingReference}` : ""}
          {" · "}
          <span className={carrierBookingStatusClass(item.status)}>
            {carrierBookingStatusLabel(item.status, t)}
          </span>
          {item.externalReference ? ` · ${item.externalReference}` : ""}
        </p>
      )}

      {isNew && (
        <p className="panel__subhead">
          <span className={carrierBookingStatusClass("draft")}>{carrierBookingStatusLabel("draft", t)}</span>
        </p>
      )}

      {error && (
        <p className="panel__error" role="alert">
          {error}
        </p>
      )}

      <form className="order-form" noValidate onSubmit={handleSave}>
        {!isNew && (
          <section className="order-section" aria-labelledby="cb-ref-heading">
            <h3 id="cb-ref-heading" className="order-section__title">
              {t("carrierBookingsPage.referenceSection")}
            </h3>
            <div className="order-section__grid">
              <div className="field">
                <label className="field__label" htmlFor="cb-reference">
                  {t("carrierBookingsPage.requestReferenceLabel")}
                </label>
                <input
                  id="cb-reference"
                  className="field__input order-code field__input--readonly"
                  value={form.requestReference}
                  readOnly
                />
              </div>
            </div>
          </section>
        )}

        {isNew && (
          <section className="order-section" aria-labelledby="cb-ref-pending-heading">
            <div className="order-section__grid">
              <div className="field">
                <label className="field__label" htmlFor="cb-reference-pending">
                  {t("carrierBookingsPage.requestReferenceLabel")}
                </label>
                <input
                  id="cb-reference-pending"
                  className="field__input order-code field__input--readonly"
                  value="—"
                  readOnly
                  aria-readonly="true"
                />
              </div>
            </div>
          </section>
        )}

        {createMode === "from-sb" && sbStepReady && hasShipperSelection && (
          <SelectedShipperBookingsSummary
            bookings={shipperBookings}
            selectedIds={form.shipperBookingIds}
            onChangeSelection={() => setSbStepReady(false)}
          />
        )}

        {createMode === "manual" && (
          <section className="order-section" aria-labelledby="cb-sb-heading">
            <h3 id="cb-sb-heading" className="order-section__title">
              {t("carrierBookingsPage.shipperBookingSectionOptional")}
            </h3>
            <ShipperBookingPicker
              bookings={shipperBookings}
              selectedIds={form.shipperBookingIds}
              onChange={(selectedIds) => applyShipperSelection(selectedIds)}
              disabled={!editable}
            />
          </section>
        )}

        {showInttraSections && (
          <>
            <section className="order-section" aria-labelledby="cb-carrier-heading">
              <h3 id="cb-carrier-heading" className="order-section__title">
                {t("carrierBookingsPage.carrierSection")}
              </h3>
              <div className="order-section__grid">
                <div className="field">
                  <label className="field__label" htmlFor="cb-carrier-scac">
                    {t("carrierBookingsPage.carrierScacLabel")}
                  </label>
                  <select
                    id="cb-carrier-scac"
                    className="field__input"
                    value={form.carrierScac}
                    disabled={formLocked || saving}
                    onChange={(e) => setForm((prev) => ({ ...prev, carrierScac: e.target.value }))}
                  >
                    {CARRIER_SCAC_CODES.map((row) => (
                      <option key={row.scac} value={row.scac}>
                        {row.scac} — {row.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="cb-service-type">
                    {t("carrierBookingsPage.serviceTypeLabel")}
                  </label>
                  <select
                    id="cb-service-type"
                    className="field__input"
                    value={form.serviceType}
                    disabled={formLocked || saving}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        serviceType: e.target.value as CarrierBookingFormState["serviceType"],
                      }))
                    }
                  >
                    {CARRIER_SERVICE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="cb-freight-payment">
                    {t("carrierBookingsPage.freightPaymentLabel")}
                  </label>
                  <select
                    id="cb-freight-payment"
                    className="field__input"
                    value={form.freightPaymentTerms}
                    disabled={formLocked || saving}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        freightPaymentTerms: e.target.value as CarrierBookingFormState["freightPaymentTerms"],
                      }))
                    }
                  >
                    <option value="">{t("carrierBookingsPage.freightPaymentUnset")}</option>
                    {CARRIER_FREIGHT_PAYMENT_TERMS.filter(Boolean).map((term) => (
                      <option key={term} value={term}>
                        {t(`carrierBookingsPage.freightPayment.${term}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="cb-contract">
                    {t("carrierBookingsPage.contractNumberLabel")}
                  </label>
                  <input
                    id="cb-contract"
                    className="field__input"
                    value={form.contractNumber}
                    disabled={formLocked || saving}
                    onChange={(e) => setForm((prev) => ({ ...prev, contractNumber: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="cb-environment">
                    {t("carrierBookingsPage.environmentLabel")}
                  </label>
                  <select
                    id="cb-environment"
                    className="field__input"
                    value={form.environment}
                    disabled={formLocked || saving}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        environment: e.target.value as CarrierBookingFormState["environment"],
                      }))
                    }
                  >
                    <option value="mock">{t("carrierBookingsPage.environment.mock")}</option>
                    <option value="sandbox">{t("carrierBookingsPage.environment.sandbox")}</option>
                    <option value="production">{t("carrierBookingsPage.environment.production")}</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="order-section" aria-labelledby="cb-parties-heading">
              <h3 id="cb-parties-heading" className="order-section__title">
                {usesTradeMasters
                  ? t("tradeField.tradeContextSection")
                  : t("carrierBookingsPage.partiesSection")}
              </h3>
              <div className="order-section__grid">
                <div className="field">
                  <label className="field__label" htmlFor="cb-booking-party">
                    {t("carrierBookingsPage.bookingPartyLabel")}
                  </label>
                  <input
                    id="cb-booking-party"
                    className="field__input"
                    value={form.bookingParty}
                    disabled={formLocked || saving}
                    onChange={(e) => setForm((prev) => ({ ...prev, bookingParty: e.target.value }))}
                  />
                </div>
                {usesTradeMasters ? (
                  <OrderTradeFields
                    value={tradeSelection}
                    onChange={updateTradeSelection}
                    onChainDefaults={applyChainDefaults}
                    disabled={formLocked || saving}
                  />
                ) : (
                  <>
                    <div className="field">
                      <label className="field__label" htmlFor="cb-customer">
                        {t("tradeField.contractualCustomer")}
                      </label>
                      <input
                        id="cb-customer"
                        className="field__input"
                        value={form.customer}
                        disabled={formLocked || saving}
                        onChange={(e) => setForm((prev) => ({ ...prev, customer: e.target.value }))}
                      />
                    </div>
                    <div className="field">
                      <label className="field__label" htmlFor="cb-shipper">
                        {t("tradeField.shipper")}
                      </label>
                      <input
                        id="cb-shipper"
                        className="field__input"
                        value={form.shipper}
                        disabled={formLocked || saving}
                        onChange={(e) => setForm((prev) => ({ ...prev, shipper: e.target.value }))}
                      />
                    </div>
                    <div className="field">
                      <label className="field__label" htmlFor="cb-consignee">
                        {t("tradeField.consignee")}
                      </label>
                      <input
                        id="cb-consignee"
                        className="field__input"
                        value={form.consignee}
                        disabled={formLocked || saving}
                        onChange={(e) => setForm((prev) => ({ ...prev, consignee: e.target.value }))}
                      />
                    </div>
                  </>
                )}
                <div className="field field--full">
                  <label className="field__label" htmlFor="cb-notify">
                    {t("carrierBookingsPage.notifyPartyLabel")}
                  </label>
                  <input
                    id="cb-notify"
                    className="field__input"
                    value={form.notifyParty}
                    disabled={formLocked || saving}
                    onChange={(e) => setForm((prev) => ({ ...prev, notifyParty: e.target.value }))}
                  />
                </div>
              </div>
            </section>

            <section className="order-section" aria-labelledby="cb-routing-heading">
              <h3 id="cb-routing-heading" className="order-section__title">
                {t("carrierBookingsPage.routingSection")}
              </h3>
              <div className="order-section__grid">
                <OrderLocationFields
                  usesTradeMasters={!!usesTradeMasters}
                  operatingShipperPartyId={form.operatingShipperPartyId}
                  operatingConsigneePartyId={form.operatingConsigneePartyId}
                  value={form}
                  onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
                  chainDefaults={chainDefaults}
                  disabled={formLocked || saving}
                />
              </div>
            </section>

            <section className="order-section" aria-labelledby="cb-dates-heading">
              <h3 id="cb-dates-heading" className="order-section__title">
                {t("carrierBookingsPage.datesSection")}
              </h3>
              <div className="order-section__grid">
                <div className="field">
                  <label className="field__label" htmlFor="cb-cargo-ready">
                    {t("carrierBookingsPage.cargoReadyDateLabel")}
                  </label>
                  <input
                    id="cb-cargo-ready"
                    type="date"
                    className="field__input"
                    value={form.cargoReadyDate}
                    disabled={formLocked || saving}
                    onChange={(e) => setForm((prev) => ({ ...prev, cargoReadyDate: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="cb-etd">
                    {t("carrierBookingsPage.requestedDepartureLabel")}
                  </label>
                  <input
                    id="cb-etd"
                    type="date"
                    className="field__input"
                    value={form.requestedDepartureDate}
                    disabled={formLocked || saving}
                    onChange={(e) => setForm((prev) => ({ ...prev, requestedDepartureDate: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="cb-receipt">
                    {t("carrierBookingsPage.expectedReceiptDateLabel")}
                  </label>
                  <input
                    id="cb-receipt"
                    type="date"
                    className="field__input"
                    value={form.expectedReceiptDate}
                    disabled={formLocked || saving}
                    onChange={(e) => setForm((prev) => ({ ...prev, expectedReceiptDate: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="cb-delivery">
                    {t("carrierBookingsPage.expectedDeliveryDateLabel")}
                  </label>
                  <input
                    id="cb-delivery"
                    type="date"
                    className="field__input"
                    value={form.expectedDeliveryDate}
                    disabled={formLocked || saving}
                    onChange={(e) => setForm((prev) => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="cb-customer-ref">
                    {t("carrierBookingsPage.customerReferenceLabel")}
                  </label>
                  <input
                    id="cb-customer-ref"
                    className="field__input"
                    value={form.customerReferenceNumber}
                    disabled={formLocked || saving}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, customerReferenceNumber: e.target.value }))
                    }
                  />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="cb-incoterm">
                    {t("carrierBookingsPage.incotermLabel")}
                  </label>
                  <select
                    id="cb-incoterm"
                    className="field__input"
                    value={form.incoterm}
                    disabled={formLocked || saving}
                    onChange={(e) => setForm((prev) => ({ ...prev, incoterm: e.target.value }))}
                  >
                    <option value="">{t("carrierBookingsPage.incotermPlaceholder")}</option>
                    {INCOTERMS_2020.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="cb-incoterm-loc">
                    {t("carrierBookingsPage.incotermLocationLabel")}
                  </label>
                  <LocationCombobox
                    id="cb-incoterm-loc"
                    value={form.incotermLocation}
                    disabled={formLocked || saving}
                    onChange={(code) => setForm((prev) => ({ ...prev, incotermLocation: code }))}
                  />
                </div>
              </div>
            </section>

            <section className="order-section" aria-labelledby="cb-equipment-heading">
              <h3 id="cb-equipment-heading" className="order-section__title">
                {t("carrierBookingsPage.equipmentSection")}
              </h3>
              {form.equipment.map((row, index) => (
                <div key={index} className="carrier-equipment-row">
                  <div className="field">
                    <label className="field__label" htmlFor={`cb-eq-qty-${index}`}>
                      {t("carrierBookingsPage.equipmentQtyLabel")}
                    </label>
                    <input
                      id={`cb-eq-qty-${index}`}
                      type="number"
                      min={1}
                      className="field__input"
                      value={row.quantity}
                      disabled={formLocked || saving}
                      onChange={(e) => updateEquipment(index, { quantity: Number(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="field">
                    <label className="field__label" htmlFor={`cb-eq-type-${index}`}>
                      {t("carrierBookingsPage.equipmentTypeLabel")}
                    </label>
                    <select
                      id={`cb-eq-type-${index}`}
                      className="field__input"
                      value={row.equipmentType}
                      disabled={formLocked || saving}
                      onChange={(e) => updateEquipment(index, { equipmentType: e.target.value })}
                    >
                      {CONTAINER_EQUIPMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label className="field__label" htmlFor={`cb-eq-weight-${index}`}>
                      {t("carrierBookingsPage.weightLabel")}
                    </label>
                    <input
                      id={`cb-eq-weight-${index}`}
                      type="number"
                      min={0}
                      className="field__input"
                      value={row.weightKg ?? ""}
                      disabled={formLocked || saving}
                      onChange={(e) =>
                        updateEquipment(index, {
                          weightKg: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="field field--checkbox">
                    <input
                      id={`cb-eq-soc-${index}`}
                      type="checkbox"
                      checked={row.shipperOwned}
                      disabled={formLocked || saving}
                      onChange={(e) => updateEquipment(index, { shipperOwned: e.target.checked })}
                    />
                    <label htmlFor={`cb-eq-soc-${index}`}>{t("carrierBookingsPage.shipperOwnedLabel")}</label>
                  </div>
                </div>
              ))}
              {editable && (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={formLocked || saving}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      equipment: [
                        ...prev.equipment,
                        {
                          quantity: 1,
                          equipmentType: "40HC",
                          weightKg: null,
                          volumeCbm: null,
                          shipperOwned: false,
                        },
                      ],
                    }))
                  }
                >
                  {t("carrierBookingsPage.addEquipment")}
                </button>
              )}
            </section>

            <section className="order-section order-lines" aria-labelledby="cb-cargo-heading">
              <h3 id="cb-cargo-heading" className="order-section__title">
                {t("carrierBookingsPage.cargoSection")}
              </h3>
              <div className="order-section__grid">
                <div className="field field--full">
                  <label className="field__label" htmlFor="cb-cargo-desc">
                    {t("carrierBookingsPage.cargoDescriptionLabel")}
                  </label>
                  <textarea
                    id="cb-cargo-desc"
                    className="field__input"
                    rows={2}
                    value={form.cargoDescription}
                    disabled={formLocked || saving}
                    onChange={(e) => setForm((prev) => ({ ...prev, cargoDescription: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="cb-total-weight">
                    {t("carrierBookingsPage.totalWeightLabel")}
                  </label>
                  <input
                    id="cb-total-weight"
                    type="number"
                    min={0}
                    className="field__input"
                    value={form.totalGrossWeightKg}
                    disabled={formLocked || saving}
                    onChange={(e) => setForm((prev) => ({ ...prev, totalGrossWeightKg: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="cb-total-volume">
                    {t("carrierBookingsPage.totalVolumeLabel")}
                  </label>
                  <input
                    id="cb-total-volume"
                    type="number"
                    min={0}
                    className="field__input"
                    value={form.totalVolumeCbm}
                    disabled={formLocked || saving}
                    onChange={(e) => setForm((prev) => ({ ...prev, totalVolumeCbm: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="cb-total-pkgs">
                    {t("carrierBookingsPage.totalPackagesLabel")}
                  </label>
                  <input
                    id="cb-total-pkgs"
                    type="number"
                    min={0}
                    className="field__input"
                    value={form.totalPackages}
                    disabled={formLocked || saving}
                    onChange={(e) => setForm((prev) => ({ ...prev, totalPackages: e.target.value }))}
                  />
                </div>
                <div className="field field--checkbox">
                  <input
                    id="cb-dg"
                    type="checkbox"
                    checked={form.dangerousGoods}
                    disabled={formLocked || saving}
                    onChange={(e) => setForm((prev) => ({ ...prev, dangerousGoods: e.target.checked }))}
                  />
                  <label htmlFor="cb-dg">{t("carrierBookingsPage.dangerousGoodsLabel")}</label>
                </div>
              </div>
              {form.cargoLines.length > 0 && (
                <div className="dash-table-wrap dash-table-wrap--mt">
                  <table className="dash-table order-lines-table">
                    <thead>
                      <tr>
                        <th scope="col">{t("carrierBookingsPage.thShipperBooking")}</th>
                        <th scope="col">{t("carrierBookingsPage.lineKeyLabel")}</th>
                        <th scope="col">{t("carrierBookingsPage.skuLabel")}</th>
                        <th scope="col">{t("carrierBookingsPage.qtyLabel")}</th>
                        <th scope="col">{t("carrierBookingsPage.descriptionLabel")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.cargoLines.map((line) => (
                        <tr key={`${line.sourceShipperBookingReference}-${line.lineKey}-${line.sku}`}>
                          <td className="order-code">{line.sourceShipperBookingReference}</td>
                          <td>{line.lineKey}</td>
                          <td>{line.sku}</td>
                          <td>
                            {line.bookedQuantity} {line.quantityUnit}
                          </td>
                          <td>{line.description || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="order-section" aria-labelledby="cb-instructions-heading">
              <h3 id="cb-instructions-heading" className="order-section__title">
                {t("carrierBookingsPage.instructionsSection")}
              </h3>
              <div className="order-section__grid">
                <div className="field field--full">
                  <label className="field__label" htmlFor="cb-special">
                    {t("carrierBookingsPage.specialInstructionsLabel")}
                  </label>
                  <textarea
                    id="cb-special"
                    className="field__input"
                    rows={2}
                    value={form.specialInstructions}
                    disabled={formLocked || saving}
                    onChange={(e) => setForm((prev) => ({ ...prev, specialInstructions: e.target.value }))}
                  />
                </div>
                <div className="field field--full">
                  <label className="field__label" htmlFor="cb-remarks">
                    {t("carrierBookingsPage.remarksLabel")}
                  </label>
                  <textarea
                    id="cb-remarks"
                    className="field__input"
                    rows={2}
                    value={form.remarks}
                    disabled={formLocked || saving}
                    onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
                  />
                </div>
              </div>
            </section>
          </>
        )}

        <div className="dash-form__actions dash-form__actions--end">
          <Link to={CARRIER_BOOKING_BASE} className="btn btn--ghost">
            {t("carrierBookingsPage.cancel")}
          </Link>
          {canSave && (
            <button
              type="button"
              className="btn btn--primary"
              disabled={saving || submitting}
              onClick={() => handleSave()}
            >
              {saving ? t("carrierBookingsPage.savingDraft") : t("carrierBookingsPage.saveAsDraft")}
            </button>
          )}
          {!isNew && submittable && (
            <button
              type="button"
              className="btn btn--secondary"
              disabled={submitting || saving}
              onClick={() => handleSubmitToInttra()}
            >
              {submitting ? t("carrierBookingsPage.submitting") : t("carrierBookingsPage.submitToInttra")}
            </button>
          )}
        </div>
      </form>

      {!isNew && item && (
        <p className="panel__muted panel__muted--mt">
          {t("carrierBookingsPage.submittedAtLabel")}: {formatCarrierBookingDate(item.submittedAt)} ·{" "}
          {t("carrierBookingsPage.inttraTransactionLabel")}: {item.inttraTransactionId || "—"}
        </p>
      )}

      {!isNew && (
        <TimelineModal
          open={timelineOpen}
          onClose={() => setTimelineOpen(false)}
          title={t("carrierBookingsPage.timelineTitle")}
          closeLabel={t("toast.close")}
          addEventLabel={t("carrierBookingsPage.addEventLabel")}
          addEventPlaceholder={t("carrierBookingsPage.addEventPlaceholder")}
          addEventButton={t("carrierBookingsPage.addEvent")}
          addingEventButton={t("carrierBookingsPage.addingEvent")}
          eventMessage={eventMessage}
          onEventMessageChange={setEventMessage}
          onAddEvent={handleAddEvent}
          addingEvent={addingEvent}
          messageInputId="carrier-booking-event-message"
        >
          <CarrierBookingTimeline events={events} emptyLabel={t("carrierBookingsPage.timelineEmpty")} />
        </TimelineModal>
      )}
    </section>
  );
}
