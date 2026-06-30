import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import * as shipperBookingsApi from "../../api/shipperBookings";
import { PageBreadcrumb } from "../../components/PageBreadcrumb.jsx";
import { BookFromOrderModal } from "../../components/BookFromOrderModal";
import { LocationCombobox } from "../../components/LocationCombobox";
import { TimelineModal } from "../../components/TimelineModal";
import { useAppToast } from "../../hooks/useAppToast";
import { useIsClientPortal } from "../../hooks/useIsClientPortal";
import { messageFromApiErrorOrKey } from "../../i18n/apiMessage.js";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { resolveLocationCode } from "../../utils/locationUtils";
import { ShipperBookingTimeline } from "./ShipperBookingTimeline";
import { LinkedCarrierBookings } from "./LinkedCarrierBookings";
import { carrierBookingStatusClass, carrierBookingStatusLabel } from "../carrierBookings/carrierBookingUtils";
import type { CarrierBookingStatus } from "../carrierBookings/types";
import type { LinkedCarrierBookingSummary } from "./types";
import { OrderLinesPicker } from "./OrderLinesPicker";
import {
  type BookFromOrdersLocationState,
  loadBookableLinesFromOrders,
  prefillBookingFormFromOrders,
} from "./bookFromOrdersUtils";
import {
  clampBookedQuantity,
  enrichLinesWithMaxQuantities,
  lineCompositeKey,
  validateLinkedLineQuantities,
} from "./shipperBookingLineUtils";
import { bookingStatusClass, bookingStatusLabel, transportModeLabel } from "./shipperBookingUtils";
import {
  EMPTY_SHIPPER_BOOKING_LINE,
  INCOTERM_OPTIONS,
  SHIPPER_BOOKING_STATUS_OPTIONS,
  SHIPPER_BOOKING_TRANSPORT_MODES,
  type Incoterm,
  type ShipperBooking,
  type ShipperBookingEvent,
  type ShipperBookingFormState,
  type ShipperBookingLineFormState,
  type ShipperBookingStatus,
  type ShipperBookingTransportMode,
} from "./types";
import type { OrderBookableSummary } from "../orders/types";
import { OrderTradeFields, type OrderTradeSelection } from "../orders/OrderTradeFields";
import { OrderLocationFields } from "../orders/OrderLocationFields";
import { useOrderTradeContext } from "../orders/useOrderTradeContext";
import type { OrderChainDefaults } from "../orders/useOrderTradeSetup";

const BOOKING_BASE = "/dashboard/operations/export/shipper-booking";

const EMPTY_FORM: ShipperBookingFormState = {
  bookingReference: "",
  customerReferenceNumber: "",
  customer: "",
  shipper: "",
  consignee: "",
  contractualPartyId: "",
  supplyChainId: "",
  operatingShipperPartyId: "",
  operatingConsigneePartyId: "",
  cargoReadyDate: "",
  expectedReceiptDate: "",
  expectedDeliveryDate: "",
  transportMode: "",
  placeOfReceipt: "",
  portOfLoading: "",
  portOfDischarge: "",
  placeOfDelivery: "",
  placeOfReceiptFacilityId: "",
  portOfLoadingFacilityId: "",
  portOfDischargeFacilityId: "",
  placeOfDeliveryFacilityId: "",
  incoterm: "",
  incotermLocation: "",
  status: "draft",
  remarks: "",
};

function toInputDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function lineToForm(line: ShipperBooking["lines"][number]): ShipperBookingLineFormState {
  return {
    lineKey: line.lineKey,
    orderNumber: line.orderNumber,
    sku: line.sku,
    externalBusinessId: line.externalBusinessId,
    bookedQuantity: String(line.bookedQuantity),
    maxBookedQuantity: "",
    quantityUnit: line.quantityUnit,
    bookedVolume: line.bookedVolume != null ? String(line.bookedVolume) : "",
    bookedWeight: line.bookedWeight != null ? String(line.bookedWeight) : "",
    description: line.description,
    countryOfOrigin: line.countryOfOrigin,
  };
}

function linesToBody(lines: ShipperBookingLineFormState[]) {
  return lines
    .filter((line) => line.lineKey.trim() && line.sku.trim())
    .map((line) => ({
      lineKey: line.lineKey.trim(),
      orderNumber: line.orderNumber.trim(),
      sku: line.sku.trim(),
      externalBusinessId: line.externalBusinessId.trim(),
      bookedQuantity: Number(line.bookedQuantity),
      quantityUnit: line.quantityUnit.trim(),
      bookedVolume: line.bookedVolume.trim() ? Number(line.bookedVolume) : null,
      bookedWeight: line.bookedWeight.trim() ? Number(line.bookedWeight) : null,
      description: line.description.trim(),
      countryOfOrigin: line.countryOfOrigin.trim(),
    }));
}

export function DashboardShipperBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useAppTranslation();
  const { showToast } = useAppToast();
  const isClientPortal = useIsClientPortal();
  const viewOnly = isClientPortal && !isNew;
  const bulkInitRef = useRef(false);

  const [form, setForm] = useState<ShipperBookingFormState>(EMPTY_FORM);
  const [lines, setLines] = useState<ShipperBookingLineFormState[]>([{ ...EMPTY_SHIPPER_BOOKING_LINE }]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<ShipperBookingEvent[]>([]);
  const [eventMessage, setEventMessage] = useState("");
  const [addingEvent, setAddingEvent] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [bookFromOrderOpen, setBookFromOrderOpen] = useState(false);
  const [error, setError] = useState("");
  const [chainDefaults, setChainDefaults] = useState<OrderChainDefaults | null>(null);
  const [linkedCarrierSummary, setLinkedCarrierSummary] = useState<LinkedCarrierBookingSummary | null>(null);

  const { usesTradeMasters, loading: loadingTradeContext } = useOrderTradeContext();

  useEffect(() => {
    if (isClientPortal && isNew) {
      navigate(BOOKING_BASE, { replace: true });
    }
  }, [isClientPortal, isNew, navigate]);

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
      transportMode: (defaults.transportMode || prev.transportMode) as ShipperBookingTransportMode,
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

  const pageTitle = useMemo(
    () => (isNew ? t("shipperBookingsPage.createTitle") : t("shipperBookingsPage.detailTitle")),
    [isNew, t]
  );

  const existingLineKeys = useMemo(
    () =>
      new Set(
        lines
          .filter((line) => line.lineKey.trim() && line.orderNumber.trim())
          .map((line) => lineCompositeKey(line.orderNumber, line.lineKey))
      ),
    [lines]
  );

  const load = useCallback(async () => {
    if (!id || isNew) return;
    setLoading(true);
    setError("");
    try {
      const { item, events: timeline } = await shipperBookingsApi.fetchShipperBooking(id);
      setForm({
        bookingReference: item.bookingReference,
        customerReferenceNumber: item.customerReferenceNumber,
        customer: item.customer,
        shipper: item.shipper,
        consignee: item.consignee,
        contractualPartyId: item.clientId ?? "",
        supplyChainId: item.supplyChainId ?? "",
        operatingShipperPartyId: item.operatingShipperPartyId ?? "",
        operatingConsigneePartyId: item.operatingConsigneePartyId ?? "",
        cargoReadyDate: toInputDate(item.cargoReadyDate),
        expectedReceiptDate: toInputDate(item.expectedReceiptDate),
        expectedDeliveryDate: toInputDate(item.expectedDeliveryDate),
        transportMode: item.transportMode,
        placeOfReceipt: item.placeOfReceipt,
        portOfLoading: item.portOfLoading,
        portOfDischarge: item.portOfDischarge,
        placeOfDelivery: item.placeOfDelivery,
        placeOfReceiptFacilityId: item.placeOfReceiptFacilityId ?? "",
        portOfLoadingFacilityId: item.portOfLoadingFacilityId ?? "",
        portOfDischargeFacilityId: item.portOfDischargeFacilityId ?? "",
        placeOfDeliveryFacilityId: item.placeOfDeliveryFacilityId ?? "",
        incoterm: (item.incoterm || "") as Incoterm,
        incotermLocation: item.incotermLocation,
        status: item.status,
        remarks: item.remarks,
      });
      const mappedLines =
        item.lines.length > 0 ? item.lines.map(lineToForm) : [{ ...EMPTY_SHIPPER_BOOKING_LINE }];
      const withMax = await enrichLinesWithMaxQuantities(mappedLines, id);
      setLines(withMax);
      setEvents(timeline);
      setLinkedCarrierSummary(item.linkedCarrierBookingSummary ?? null);
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "shipperBookingsPage.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [id, isNew, t]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    if (!isNew) return;

    (async () => {
      try {
        const bookingReference = await shipperBookingsApi.fetchNextBookingReference();
        setForm((prev) => (prev.bookingReference.trim() ? prev : { ...prev, bookingReference }));
      } catch {
        // Booking reference can still be entered manually if allocation fails.
      }
    })().catch(() => {});
  }, [isNew]);

  useEffect(() => {
    if (!isNew || bulkInitRef.current) return;

    const state = location.state as BookFromOrdersLocationState | null;
    const orderNumbers = state?.fromOrderNumbers?.map((value) => value.trim()).filter(Boolean) ?? [];
    if (orderNumbers.length === 0) return;

    bulkInitRef.current = true;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const { lines, orderSummaries, emptyOrders, failedOrders } =
          await loadBookableLinesFromOrders(orderNumbers);

        let nextReference = "";
        try {
          nextReference = await shipperBookingsApi.fetchNextBookingReference();
        } catch {
          nextReference = "";
        }

        if (orderSummaries.length > 0) {
          setForm((prev) => {
            const prefilled = prefillBookingFormFromOrders(prev, orderSummaries, { merge: false });
            return {
              ...prefilled,
              bookingReference: prefilled.bookingReference.trim() || nextReference || prev.bookingReference,
            };
          });
        } else if (nextReference) {
          setForm((prev) =>
            prev.bookingReference.trim() ? prev : { ...prev, bookingReference: nextReference }
          );
        }

        if (lines.length > 0) {
          setLines(lines);
        }

        if (failedOrders.length > 0 || emptyOrders.length > 0) {
          const failedDetail = failedOrders
            .map((entry) => `${entry.orderNumber}: ${entry.message}`)
            .join(" · ");
          showToast({
            message:
              failedOrders.length > 0
                ? t("shipperBookingsPage.bulkBookPartialWarningDetail", {
                    failed: failedOrders.length,
                    empty: emptyOrders.length,
                    detail: failedDetail,
                  })
                : t("shipperBookingsPage.bulkBookPartialWarning", {
                    failed: failedOrders.length,
                    empty: emptyOrders.length,
                  }),
            variant: "error",
          });
        } else if (lines.length > 0) {
          showToast({
            message: t("shipperBookingsPage.bulkBookLoaded", { count: lines.length }),
            variant: "success",
          });
        } else {
          showToast({
            message: t("shipperBookingsPage.bulkBookNoLines"),
            variant: "error",
          });
        }
      } catch (err) {
        setError(messageFromApiErrorOrKey(err, t, "shipperBookingsPage.orderLinesLoadFailed"));
      } finally {
        setLoading(false);
        navigate(location.pathname, { replace: true, state: null });
      }
    })().catch(() => {});
  }, [isNew, location.pathname, location.state, navigate, showToast, t]);

  function updateLine(index: number, patch: Partial<ShipperBookingLineFormState>) {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        const next = { ...line, ...patch };
        if (patch.bookedQuantity !== undefined && next.maxBookedQuantity) {
          next.bookedQuantity = clampBookedQuantity(next.bookedQuantity, next.maxBookedQuantity);
        }
        return next;
      })
    );
  }

  function addLine() {
    setLines((prev) => [...prev, { ...EMPTY_SHIPPER_BOOKING_LINE }]);
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function prefillFromOrder(order: OrderBookableSummary) {
    setForm((prev) => prefillBookingFormFromOrders(prev, [order], { merge: true }));
  }

  function addLinesFromOrder(newLines: ShipperBookingLineFormState[]) {
    setLines((prev) => {
      const kept = prev.filter((line) => line.lineKey.trim() || line.sku.trim());
      return kept.length > 0 ? [...kept, ...newLines] : newLines;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.bookingReference.trim()) return;

    const quantityError = validateLinkedLineQuantities(lines, t);
    if (quantityError) {
      setError(quantityError);
      return;
    }

    setSaving(true);
    setError("");
    const body: Record<string, unknown> = {
      bookingReference: form.bookingReference.trim(),
      customerReferenceNumber: form.customerReferenceNumber.trim(),
      cargoReadyDate: form.cargoReadyDate || null,
      expectedReceiptDate: form.expectedReceiptDate || null,
      expectedDeliveryDate: form.expectedDeliveryDate || null,
      transportMode: form.transportMode,
      incoterm: form.incoterm,
      incotermLocation: resolveLocationCode(form.incotermLocation),
      status: form.status,
      remarks: form.remarks.trim(),
      lines: linesToBody(lines),
    };

    if (usesTradeMasters) {
      body.contractualPartyId = form.contractualPartyId.trim();
      body.supplyChainId = form.supplyChainId.trim();
      body.operatingShipperPartyId = form.operatingShipperPartyId.trim();
      body.operatingConsigneePartyId = form.operatingConsigneePartyId.trim();
      body.placeOfReceiptFacilityId = form.placeOfReceiptFacilityId.trim();
      body.portOfLoadingFacilityId = form.portOfLoadingFacilityId.trim();
      body.portOfDischargeFacilityId = form.portOfDischargeFacilityId.trim();
      body.placeOfDeliveryFacilityId = form.placeOfDeliveryFacilityId.trim();
    } else {
      body.customer = form.customer.trim();
      body.shipper = form.shipper.trim();
      body.consignee = form.consignee.trim();
      body.placeOfReceipt = resolveLocationCode(form.placeOfReceipt);
      body.portOfLoading = resolveLocationCode(form.portOfLoading);
      body.portOfDischarge = resolveLocationCode(form.portOfDischarge);
      body.placeOfDelivery = resolveLocationCode(form.placeOfDelivery);
    }

    try {
      const item: ShipperBooking = isNew
        ? await shipperBookingsApi.createShipperBooking(body)
        : await shipperBookingsApi.updateShipperBooking(id!, body);
      showToast({ message: t("shipperBookingsPage.saved"), variant: "success" });
      if (isNew) {
        navigate(`${BOOKING_BASE}/${item.id}`, { replace: true });
      } else {
        await load();
      }
    } catch (err) {
      const duplicateNextRef = (
        err as { response?: { status?: number; data?: { nextBookingReference?: string } } }
      )?.response?.data?.nextBookingReference;

      if (isNew && duplicateNextRef) {
        setForm((prev) => ({ ...prev, bookingReference: duplicateNextRef }));
        setError(t("shipperBookingsPage.bookingReferenceDuplicate"));
        showToast({
          message: t("shipperBookingsPage.bookingReferenceUpdated", { reference: duplicateNextRef }),
          variant: "error",
        });
      } else {
        setError(messageFromApiErrorOrKey(err, t, "shipperBookingsPage.saveFailed"));
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleAddEvent(e: FormEvent) {
    e.preventDefault();
    if (!id || isNew || !eventMessage.trim()) return;
    setAddingEvent(true);
    try {
      const event = await shipperBookingsApi.createShipperBookingEvent(id, {
        kind: "note",
        message: eventMessage.trim(),
      });
      setEvents((prev) => [event, ...prev]);
      setEventMessage("");
      showToast({ message: t("shipperBookingsPage.eventAdded"), variant: "success" });
    } catch (err) {
      showToast({
        message: messageFromApiErrorOrKey(err, t, "shipperBookingsPage.eventFailed"),
        variant: "error",
      });
    } finally {
      setAddingEvent(false);
    }
  }

  async function handleDelete() {
    if (!id || isNew) return;
    if (!window.confirm(t("shipperBookingsPage.confirmDelete"))) return;
    try {
      await shipperBookingsApi.deleteShipperBooking(id);
      showToast({ message: t("shipperBookingsPage.deleted"), variant: "success" });
      navigate(BOOKING_BASE);
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "shipperBookingsPage.deleteFailed"));
    }
  }

  if (loading || loadingTradeContext) {
    return <p className="panel__muted">{t("shipperBookingsPage.loading")}</p>;
  }

  return (
    <section
      className="panel panel--dash-form panel--orders"
      aria-labelledby="shipper-booking-detail-heading"
    >
      <PageBreadcrumb
        items={
          isClientPortal
            ? [
                { label: t("modules.nav.home"), to: "/dashboard/home" },
                { label: t("modules.export.shipperBooking"), to: BOOKING_BASE },
                { label: pageTitle },
              ]
            : [
                { label: t("modules.nav.home"), to: "/dashboard/home" },
                { label: t("modules.export.title"), to: "/dashboard/operations/export" },
                { label: t("modules.export.shipperBooking"), to: BOOKING_BASE },
                { label: pageTitle },
              ]
        }
      />
      <div className="panel__head-row">
        <h2 id="shipper-booking-detail-heading" className="panel__title panel__title--section">
          {pageTitle}
        </h2>
        {!isNew && (
          <div className="dash-form__actions dash-form__actions--start">
            {!isClientPortal ? (
              <Link
                to={`/dashboard/operations/transport/carrier-booking/new/from-sb?shipperBookingIds=${id}`}
                className="btn btn--secondary"
              >
                {t("shipperBookingsPage.createCarrierBooking")}
              </Link>
            ) : null}
            <button type="button" className="btn btn--secondary" onClick={() => setTimelineOpen(true)}>
              {t("shipperBookingsPage.openTimeline")}
              {events.length > 0 && <span className="timeline-trigger__count">{events.length}</span>}
            </button>
            {!isClientPortal ? (
              <button type="button" className="btn btn--ghost btn--danger" onClick={() => handleDelete()}>
                {t("shipperBookingsPage.delete")}
              </button>
            ) : null}
          </div>
        )}
      </div>

      {!isNew && (
        <p className="panel__subhead">
          <strong>{form.bookingReference}</strong> ·{" "}
          <span className={bookingStatusClass(form.status)}>{bookingStatusLabel(form.status, t)}</span>
          {linkedCarrierSummary ? (
            <>
              {" · "}
              <span className="panel__subhead-meta">
                {t("shipperBookingsPage.linkedCarrierBookingBadge")}:{" "}
              </span>
              <Link
                to={`/dashboard/operations/transport/carrier-booking/${linkedCarrierSummary.carrierBookingId}`}
                className="dash-table__link order-code"
              >
                {linkedCarrierSummary.requestReference}
              </Link>
              {" — "}
              <span
                className={carrierBookingStatusClass(linkedCarrierSummary.status as CarrierBookingStatus)}
              >
                {carrierBookingStatusLabel(linkedCarrierSummary.status as CarrierBookingStatus, t)}
              </span>
              {linkedCarrierSummary.count > 1
                ? ` (${t("shipperBookingsPage.linkedCarrierBookingCount", { count: linkedCarrierSummary.count })})`
                : null}
            </>
          ) : null}
        </p>
      )}

      {!isNew && id && <LinkedCarrierBookings shipperBookingId={id} />}

      {isNew && (
        <p className="orders-note">
          {usesTradeMasters
            ? t("shipperBookingsPage.requiredFieldsTradeNote")
            : t("shipperBookingsPage.requiredFieldsNote")}
        </p>
      )}

      {error && (
        <p className="panel__error" role="alert">
          {error}
        </p>
      )}

      <form className={`order-form${viewOnly ? " order-form--readonly" : ""}`} onSubmit={handleSubmit}>
        <fieldset disabled={viewOnly} className="order-form__fieldset">
          <section className="order-section" aria-labelledby="booking-parties-heading">
            <h3 id="booking-parties-heading" className="order-section__title">
              {t("tradeField.tradeContextSection")}
            </h3>
            <div className="order-section__grid">
              <div className="field">
                <label className="field__label" htmlFor="booking-reference">
                  {t("shipperBookingsPage.bookingReferenceLabel")} <span className="field__req">*</span>
                </label>
                <input
                  id="booking-reference"
                  className={`field__input order-code${isNew ? " field__input--readonly" : ""}`}
                  value={form.bookingReference}
                  onChange={(e) => setForm((prev) => ({ ...prev, bookingReference: e.target.value }))}
                  readOnly={isNew}
                  required
                />
                {isNew && <p className="field__hint">{t("shipperBookingsPage.bookingReferenceAutoHint")}</p>}
              </div>
              <div className="field">
                <label className="field__label" htmlFor="customer-reference">
                  {t("shipperBookingsPage.customerReferenceLabel")}
                </label>
                <input
                  id="customer-reference"
                  className="field__input"
                  value={form.customerReferenceNumber}
                  onChange={(e) => setForm((prev) => ({ ...prev, customerReferenceNumber: e.target.value }))}
                />
              </div>
              {usesTradeMasters ? (
                <OrderTradeFields
                  value={tradeSelection}
                  onChange={updateTradeSelection}
                  onChainDefaults={applyChainDefaults}
                  disabled={saving}
                />
              ) : (
                <>
                  <div className="field">
                    <label className="field__label" htmlFor="booking-customer">
                      {t("tradeField.contractualCustomer")} <span className="field__req">*</span>
                    </label>
                    <input
                      id="booking-customer"
                      className="field__input order-code"
                      value={form.customer}
                      onChange={(e) => setForm((prev) => ({ ...prev, customer: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="field">
                    <label className="field__label" htmlFor="booking-shipper">
                      {t("tradeField.shipper")} <span className="field__req">*</span>
                    </label>
                    <input
                      id="booking-shipper"
                      className="field__input order-code"
                      value={form.shipper}
                      onChange={(e) => setForm((prev) => ({ ...prev, shipper: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="field">
                    <label className="field__label" htmlFor="booking-consignee">
                      {t("tradeField.consignee")} <span className="field__req">*</span>
                    </label>
                    <input
                      id="booking-consignee"
                      className="field__input order-code"
                      value={form.consignee}
                      onChange={(e) => setForm((prev) => ({ ...prev, consignee: e.target.value }))}
                      required
                    />
                  </div>
                </>
              )}
              <div className="field">
                <label className="field__label" htmlFor="booking-status">
                  {t("shipperBookingsPage.statusLabel")}
                </label>
                <select
                  id="booking-status"
                  className="field__input"
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, status: e.target.value as ShipperBookingStatus }))
                  }
                >
                  {SHIPPER_BOOKING_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {bookingStatusLabel(status, t)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="order-section" aria-labelledby="booking-logistics-heading">
            <h3 id="booking-logistics-heading" className="order-section__title">
              {t("shipperBookingsPage.logisticsTitle")}
            </h3>
            <div className="order-section__grid">
              <div className="field">
                <label className="field__label" htmlFor="cargo-ready-date">
                  {t("shipperBookingsPage.cargoReadyDateLabel")}
                </label>
                <input
                  id="cargo-ready-date"
                  type="date"
                  className="field__input"
                  value={form.cargoReadyDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, cargoReadyDate: e.target.value }))}
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="expected-receipt-date">
                  {t("shipperBookingsPage.expectedReceiptDateLabel")}
                </label>
                <input
                  id="expected-receipt-date"
                  type="date"
                  className="field__input"
                  value={form.expectedReceiptDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, expectedReceiptDate: e.target.value }))}
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="expected-delivery-date">
                  {t("shipperBookingsPage.expectedDeliveryDateLabel")}
                </label>
                <input
                  id="expected-delivery-date"
                  type="date"
                  className="field__input"
                  value={form.expectedDeliveryDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="booking-transport-mode">
                  {t("shipperBookingsPage.transportModeLabel")}
                </label>
                <select
                  id="booking-transport-mode"
                  className="field__input"
                  value={form.transportMode}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      transportMode: e.target.value as ShipperBookingTransportMode | "",
                    }))
                  }
                >
                  <option value="">{t("shipperBookingsPage.transportModePlaceholder")}</option>
                  {SHIPPER_BOOKING_TRANSPORT_MODES.filter(Boolean).map((mode) => (
                    <option key={mode} value={mode}>
                      {transportModeLabel(mode, t)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="field__label" htmlFor="booking-incoterm">
                  {t("shipperBookingsPage.incotermLabel")}
                </label>
                <select
                  id="booking-incoterm"
                  className="field__input"
                  value={form.incoterm}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, incoterm: e.target.value as Incoterm | "" }))
                  }
                >
                  <option value="">{t("shipperBookingsPage.incotermPlaceholder")}</option>
                  {INCOTERM_OPTIONS.filter(Boolean).map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="field__label" htmlFor="incoterm-location">
                  {t("shipperBookingsPage.incotermLocationLabel")}
                </label>
                <LocationCombobox
                  id="incoterm-location"
                  value={form.incotermLocation}
                  onChange={(code) => setForm((prev) => ({ ...prev, incotermLocation: code }))}
                />
              </div>
              <OrderLocationFields
                usesTradeMasters={!!usesTradeMasters}
                operatingShipperPartyId={form.operatingShipperPartyId}
                operatingConsigneePartyId={form.operatingConsigneePartyId}
                value={form}
                onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
                chainDefaults={chainDefaults}
                disabled={saving}
              />
              <div className="field field--full">
                <label className="field__label" htmlFor="booking-remarks">
                  {t("shipperBookingsPage.remarksLabel")}
                </label>
                <textarea
                  id="booking-remarks"
                  className="field__input"
                  rows={2}
                  value={form.remarks}
                  onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
                />
              </div>
            </div>
          </section>

          <section className="order-section order-lines" aria-labelledby="booking-lines-heading">
            <div className="order-lines__head">
              <h3 id="booking-lines-heading" className="order-section__title">
                {t("shipperBookingsPage.linesTitle")}
              </h3>
              <div className="order-lines__head-actions">
                <p className="order-lines__meta">
                  {t("shipperBookingsPage.linesCount", { count: lines.length })}
                </p>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => setBookFromOrderOpen(true)}
                >
                  {t("shipperBookingsPage.bookFromOrderTitle")}
                </button>
              </div>
            </div>

            <BookFromOrderModal
              open={bookFromOrderOpen}
              onClose={() => setBookFromOrderOpen(false)}
              title={t("shipperBookingsPage.bookFromOrderTitle")}
              closeLabel={t("toast.close")}
            >
              <OrderLinesPicker
                embedded
                excludeBookingId={isNew ? undefined : id}
                existingLineKeys={existingLineKeys}
                onAddLines={addLinesFromOrder}
                onPrefillFromOrder={prefillFromOrder}
              />
            </BookFromOrderModal>

            <div className="order-lines-table-wrap">
              <table className="order-lines-table order-lines-table--booking">
                <thead>
                  <tr>
                    <th>{t("shipperBookingsPage.lineKeyLabel")} *</th>
                    <th>{t("shipperBookingsPage.orderNumberLabel")}</th>
                    <th>{t("shipperBookingsPage.skuLabel")} *</th>
                    <th>{t("shipperBookingsPage.bookedQuantityLabel")} *</th>
                    <th>{t("shipperBookingsPage.quantityUnitLabel")} *</th>
                    <th>{t("shipperBookingsPage.descriptionLabel")}</th>
                    <th>{t("shipperBookingsPage.originLabel")}</th>
                    <th>{t("shipperBookingsPage.volumeLabel")}</th>
                    <th>{t("shipperBookingsPage.weightLabel")}</th>
                    <th className="order-lines-table__actions" aria-hidden="true" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          className="field__input field__input--table"
                          value={line.lineKey}
                          onChange={(e) => updateLine(index, { lineKey: e.target.value })}
                          required
                        />
                      </td>
                      <td>
                        <input
                          className="field__input field__input--table"
                          value={line.orderNumber}
                          onChange={(e) => updateLine(index, { orderNumber: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className="field__input field__input--table"
                          value={line.sku}
                          onChange={(e) => updateLine(index, { sku: e.target.value })}
                          required
                        />
                      </td>
                      <td>
                        <div className="order-line-qty">
                          <input
                            className="field__input field__input--table"
                            type="number"
                            min="0.0001"
                            step="any"
                            max={line.maxBookedQuantity || undefined}
                            value={line.bookedQuantity}
                            onChange={(e) => updateLine(index, { bookedQuantity: e.target.value })}
                            required
                            aria-describedby={line.maxBookedQuantity ? `booking-qty-max-${index}` : undefined}
                          />
                          {line.maxBookedQuantity && (
                            <span id={`booking-qty-max-${index}`} className="order-line-qty__hint">
                              {t("shipperBookingsPage.maxQtyHint", { max: line.maxBookedQuantity })}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <input
                          className="field__input field__input--table"
                          value={line.quantityUnit}
                          onChange={(e) => updateLine(index, { quantityUnit: e.target.value })}
                          required
                        />
                      </td>
                      <td>
                        <input
                          className="field__input field__input--table"
                          value={line.description}
                          onChange={(e) => updateLine(index, { description: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className="field__input field__input--table"
                          value={line.countryOfOrigin}
                          onChange={(e) => updateLine(index, { countryOfOrigin: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className="field__input field__input--table"
                          type="number"
                          min="0"
                          step="any"
                          value={line.bookedVolume}
                          onChange={(e) => updateLine(index, { bookedVolume: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className="field__input field__input--table"
                          type="number"
                          min="0"
                          step="any"
                          value={line.bookedWeight}
                          onChange={(e) => updateLine(index, { bookedWeight: e.target.value })}
                        />
                      </td>
                      <td className="order-lines-table__actions">
                        <button
                          type="button"
                          className="order-lines-table__remove"
                          onClick={() => removeLine(index)}
                          aria-label={t("shipperBookingsPage.removeLine")}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="order-lines__actions">
              <button type="button" className="btn btn--ghost" onClick={() => addLine()}>
                {t("shipperBookingsPage.addDirectLine")}
              </button>
            </div>
          </section>

          <div className="dash-form__actions">
            <Link to={BOOKING_BASE} className="btn btn--ghost">
              {t("shipperBookingsPage.cancel")}
            </Link>
            {!viewOnly ? (
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? t("shipperBookingsPage.saving") : t("shipperBookingsPage.save")}
              </button>
            ) : null}
          </div>
        </fieldset>
      </form>

      {!isNew && (
        <TimelineModal
          open={timelineOpen}
          onClose={() => setTimelineOpen(false)}
          title={t("shipperBookingsPage.timelineTitle")}
          closeLabel={t("toast.close")}
          addEventLabel={t("shipperBookingsPage.addEventLabel")}
          addEventPlaceholder={t("shipperBookingsPage.addEventPlaceholder")}
          addEventButton={t("shipperBookingsPage.addEvent")}
          addingEventButton={t("shipperBookingsPage.addingEvent")}
          eventMessage={eventMessage}
          onEventMessageChange={setEventMessage}
          onAddEvent={handleAddEvent}
          addingEvent={addingEvent}
          messageInputId="booking-event-message"
          allowAddEvent={!isClientPortal}
        >
          <ShipperBookingTimeline events={events} emptyLabel={t("shipperBookingsPage.timelineEmpty")} />
        </TimelineModal>
      )}
    </section>
  );
}
