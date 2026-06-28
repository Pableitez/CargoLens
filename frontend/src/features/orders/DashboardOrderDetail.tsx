import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as ordersApi from "../../api/orders";
import { PageBreadcrumb } from "../../components/PageBreadcrumb.jsx";
import { ReadOnlyFieldValue } from "../../components/ReadOnlyFieldValue";
import { TimelineModal } from "../../components/TimelineModal";
import { useAppToast } from "../../hooks/useAppToast";
import { messageFromApiErrorOrKey } from "../../i18n/apiMessage.js";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { OrderTimeline } from "./OrderTimeline";
import { orderStatusClass, orderStatusLabel, transportModeLabel } from "./orderUtils";
import { OrderTradeFields, type OrderTradeSelection } from "./OrderTradeFields";
import { OrderLocationFields } from "./OrderLocationFields";
import { useOrderTradeContext } from "./useOrderTradeContext";
import type { OrderChainDefaults } from "./useOrderTradeSetup";
import { resolveLocationCode } from "../../utils/locationUtils";
import {
  EMPTY_ORDER_LINE,
  INCOTERM_OPTIONS,
  ORDER_MANUAL_STATUS_OPTIONS,
  isBookingDerivedOrderStatus,
  ORDER_TRANSPORT_MODES,
  type Order,
  type OrderEvent,
  type OrderFormState,
  type OrderLineFormState,
  type OrderStatus,
  type OrderTransportMode,
  type Incoterm,
} from "./types";

const ORDER_BASE = "/dashboard/operations/export/order";

const EMPTY_FORM: OrderFormState = {
  orderNumber: "",
  externalBusinessId: "",
  customer: "",
  shipper: "",
  consignee: "",
  contractualPartyId: "",
  supplyChainId: "",
  operatingShipperPartyId: "",
  operatingConsigneePartyId: "",
  shippingWindowStart: "",
  shippingWindowEnd: "",
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
  status: "draft",
  notes: "",
};

function toInputDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function displayInputDate(value: string): string {
  if (!value) return "—";
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function lineToForm(line: Order["lines"][number]): OrderLineFormState {
  return {
    lineKey: line.lineKey,
    sku: line.sku,
    description: line.description,
    quantity: String(line.quantity),
    uom: line.uom,
    countryOfOrigin: line.countryOfOrigin,
    totalGrossWeight: line.totalGrossWeight != null ? String(line.totalGrossWeight) : "",
    totalCbm: line.totalCbm != null ? String(line.totalCbm) : "",
  };
}

function linesToBody(lines: OrderLineFormState[]) {
  return lines
    .filter((line) => line.lineKey.trim() && line.sku.trim())
    .map((line) => ({
      lineKey: line.lineKey.trim(),
      sku: line.sku.trim(),
      description: line.description.trim(),
      quantity: Number(line.quantity),
      uom: line.uom.trim(),
      countryOfOrigin: line.countryOfOrigin.trim(),
      totalGrossWeight: line.totalGrossWeight.trim() ? Number(line.totalGrossWeight) : null,
      totalCbm: line.totalCbm.trim() ? Number(line.totalCbm) : null,
    }));
}

export function DashboardOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const { showToast } = useAppToast();

  const [form, setForm] = useState<OrderFormState>(EMPTY_FORM);
  const [lines, setLines] = useState<OrderLineFormState[]>([{ ...EMPTY_ORDER_LINE }]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [eventMessage, setEventMessage] = useState("");
  const [addingEvent, setAddingEvent] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(isNew);
  const [error, setError] = useState("");
  const [chainDefaults, setChainDefaults] = useState<OrderChainDefaults | null>(null);

  const tradeSelection: OrderTradeSelection = useMemo(
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
      incoterm: defaults.incoterm || "",
      transportMode: (defaults.transportMode || "") as OrderTransportMode | "",
    }));
  }, []);

  const { usesTradeMasters, loading: loadingTradeContext } = useOrderTradeContext();

  const readOnly = !isNew && !isEditing;

  const pageTitle = useMemo(
    () => (isNew ? t("ordersPage.createTitle") : t("ordersPage.detailTitle")),
    [isNew, t]
  );

  const load = useCallback(async () => {
    if (!id || isNew) return;
    setLoading(true);
    setError("");
    try {
      const { item, events: timeline } = await ordersApi.fetchOrder(id);
      setForm({
        orderNumber: item.orderNumber,
        externalBusinessId: item.externalBusinessId,
        customer: item.customer,
        shipper: item.shipper,
        consignee: item.consignee,
        contractualPartyId: item.clientId ?? "",
        supplyChainId: item.supplyChainId ?? "",
        operatingShipperPartyId: item.operatingShipperPartyId ?? "",
        operatingConsigneePartyId: item.operatingConsigneePartyId ?? "",
        shippingWindowStart: toInputDate(item.shippingWindowStart),
        shippingWindowEnd: toInputDate(item.shippingWindowEnd),
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
        status: item.status,
        notes: item.notes,
      });
      setLines(item.lines.length > 0 ? item.lines.map(lineToForm) : [{ ...EMPTY_ORDER_LINE }]);
      setEvents(timeline);
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "ordersPage.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [id, isNew, t]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    setIsEditing(isNew);
  }, [id, isNew]);

  function updateLine(index: number, patch: Partial<OrderLineFormState>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function addLine() {
    setLines((prev) => [...prev, { ...EMPTY_ORDER_LINE }]);
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (readOnly || !form.orderNumber.trim()) return;

    setSaving(true);
    setError("");
    const body: Record<string, unknown> = {
      orderNumber: form.orderNumber.trim(),
      externalBusinessId: form.externalBusinessId.trim(),
      shippingWindowStart: form.shippingWindowStart || null,
      shippingWindowEnd: form.shippingWindowEnd || null,
      transportMode: form.transportMode,
      incoterm: form.incoterm,
      notes: form.notes.trim(),
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

    if (isNew || !isBookingDerivedOrderStatus(form.status)) {
      body.status = form.status;
    }

    try {
      const item: Order = isNew ? await ordersApi.createOrder(body) : await ordersApi.updateOrder(id!, body);
      showToast({ message: t("ordersPage.saved"), variant: "success" });
      if (isNew) {
        navigate(`${ORDER_BASE}/${item.id}`, { replace: true });
      } else {
        await load();
        setIsEditing(false);
      }
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "ordersPage.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function handleAddEvent(e: FormEvent) {
    e.preventDefault();
    if (!id || isNew || !eventMessage.trim()) return;
    setAddingEvent(true);
    try {
      const event = await ordersApi.createOrderEvent(id, {
        kind: "note",
        message: eventMessage.trim(),
      });
      setEvents((prev) => [event, ...prev]);
      setEventMessage("");
      showToast({ message: t("ordersPage.eventAdded"), variant: "success" });
    } catch (err) {
      showToast({
        message: messageFromApiErrorOrKey(err, t, "ordersPage.eventFailed"),
        variant: "error",
      });
    } finally {
      setAddingEvent(false);
    }
  }

  async function handleCancelEdit() {
    setIsEditing(false);
    setError("");
    await load();
  }

  async function handleDelete() {
    if (!id || isNew) return;
    if (!window.confirm(t("ordersPage.confirmDelete"))) return;
    try {
      await ordersApi.deleteOrder(id);
      showToast({ message: t("ordersPage.deleted"), variant: "success" });
      navigate(ORDER_BASE);
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "ordersPage.deleteFailed"));
    }
  }

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

  if (loading || loadingTradeContext) {
    return <p className="panel__muted">{t("ordersPage.loading")}</p>;
  }

  return (
    <section className="panel panel--dash-form panel--orders" aria-labelledby="order-detail-heading">
      <PageBreadcrumb
        items={[
          { label: t("modules.nav.home"), to: "/dashboard/home" },
          { label: t("modules.export.title"), to: "/dashboard/operations/export" },
          { label: t("modules.export.order"), to: ORDER_BASE },
          { label: pageTitle },
        ]}
      />
      <div className="panel__head-row">
        <h2 id="order-detail-heading" className="panel__title panel__title--section">
          {pageTitle}
        </h2>
        {!isNew && (
          <div className="dash-form__actions dash-form__actions--start">
            {readOnly ? (
              <button type="button" className="btn btn--primary" onClick={() => setIsEditing(true)}>
                {t("ordersPage.edit")}
              </button>
            ) : null}
            <button type="button" className="btn btn--secondary" onClick={() => setTimelineOpen(true)}>
              {t("ordersPage.openTimeline")}
              {events.length > 0 && <span className="timeline-trigger__count">{events.length}</span>}
            </button>
            {readOnly ? (
              <button type="button" className="btn btn--ghost btn--danger" onClick={() => handleDelete()}>
                {t("ordersPage.delete")}
              </button>
            ) : null}
          </div>
        )}
      </div>

      {!isNew && (
        <p className="orders-note">
          <strong>{form.orderNumber}</strong> ·{" "}
          <span className={orderStatusClass(form.status)}>{orderStatusLabel(form.status, t)}</span>
        </p>
      )}
      {isNew && (
        <p className="orders-note">
          {usesTradeMasters ? t("ordersPage.requiredFieldsTradeNote") : t("ordersPage.requiredFieldsNote")}
        </p>
      )}

      {error && (
        <p className="panel__error" role="alert">
          {error}
        </p>
      )}

      <form className={`order-form${readOnly ? " order-form--readonly" : ""}`} onSubmit={handleSubmit}>
        <section className="order-section" aria-labelledby="order-parties-heading">
          <h3 id="order-parties-heading" className="order-section__title">
            {t("tradeField.tradeContextSection")}
          </h3>
          <div className="order-section__grid">
            <div className="field">
              <label className="field__label" htmlFor={readOnly ? undefined : "order-number"}>
                {t("ordersPage.orderNumberLabel")} {!readOnly ? <span className="field__req">*</span> : null}
              </label>
              {readOnly ? (
                <ReadOnlyFieldValue id="order-number">{form.orderNumber}</ReadOnlyFieldValue>
              ) : (
                <input
                  id="order-number"
                  className="field__input order-code"
                  value={form.orderNumber}
                  onChange={(e) => setForm((prev) => ({ ...prev, orderNumber: e.target.value }))}
                  required
                />
              )}
            </div>
            <div className="field">
              <label className="field__label" htmlFor={readOnly ? undefined : "order-external-id"}>
                {t("ordersPage.externalIdLabel")}
              </label>
              {readOnly ? (
                <ReadOnlyFieldValue id="order-external-id">{form.externalBusinessId}</ReadOnlyFieldValue>
              ) : (
                <input
                  id="order-external-id"
                  className="field__input"
                  value={form.externalBusinessId}
                  onChange={(e) => setForm((prev) => ({ ...prev, externalBusinessId: e.target.value }))}
                />
              )}
            </div>
            {usesTradeMasters ? (
              <OrderTradeFields
                value={tradeSelection}
                onChange={updateTradeSelection}
                onChainDefaults={applyChainDefaults}
                disabled={saving}
                readOnly={readOnly}
              />
            ) : (
              <>
                <div className="field">
                  <label className="field__label" htmlFor={readOnly ? undefined : "order-customer"}>
                    {t("tradeField.contractualCustomer")}{" "}
                    {!readOnly ? <span className="field__req">*</span> : null}
                  </label>
                  {readOnly ? (
                    <ReadOnlyFieldValue id="order-customer">{form.customer}</ReadOnlyFieldValue>
                  ) : (
                    <input
                      id="order-customer"
                      className="field__input order-code"
                      value={form.customer}
                      onChange={(e) => setForm((prev) => ({ ...prev, customer: e.target.value }))}
                      required
                    />
                  )}
                </div>
                <div className="field">
                  <label className="field__label" htmlFor={readOnly ? undefined : "order-shipper"}>
                    {t("tradeField.shipper")} {!readOnly ? <span className="field__req">*</span> : null}
                  </label>
                  {readOnly ? (
                    <ReadOnlyFieldValue id="order-shipper">{form.shipper}</ReadOnlyFieldValue>
                  ) : (
                    <input
                      id="order-shipper"
                      className="field__input order-code"
                      value={form.shipper}
                      onChange={(e) => setForm((prev) => ({ ...prev, shipper: e.target.value }))}
                      required
                    />
                  )}
                </div>
                <div className="field">
                  <label className="field__label" htmlFor={readOnly ? undefined : "order-consignee"}>
                    {t("tradeField.consignee")} {!readOnly ? <span className="field__req">*</span> : null}
                  </label>
                  {readOnly ? (
                    <ReadOnlyFieldValue id="order-consignee">{form.consignee}</ReadOnlyFieldValue>
                  ) : (
                    <input
                      id="order-consignee"
                      className="field__input order-code"
                      value={form.consignee}
                      onChange={(e) => setForm((prev) => ({ ...prev, consignee: e.target.value }))}
                      required
                    />
                  )}
                </div>
              </>
            )}
            <div className="field">
              <span className="field__label">{t("ordersPage.statusLabel")}</span>
              {isBookingDerivedOrderStatus(form.status) || readOnly ? (
                <div className="field__derived-status">
                  <span className={orderStatusClass(form.status)}>{orderStatusLabel(form.status, t)}</span>
                  {!readOnly ? <p className="field__hint">{t("ordersPage.statusDerivedNote")}</p> : null}
                </div>
              ) : (
                <select
                  id="order-status"
                  className="field__input"
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as OrderStatus }))}
                >
                  {ORDER_MANUAL_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {orderStatusLabel(status, t)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </section>

        <section className="order-section" aria-labelledby="order-logistics-heading">
          <h3 id="order-logistics-heading" className="order-section__title">
            {t("ordersPage.logisticsTitle")}
          </h3>
          <div className="order-section__grid">
            <div className="field">
              <span className="field__label">{t("ordersPage.windowStartLabel")}</span>
              {readOnly ? (
                <ReadOnlyFieldValue>{displayInputDate(form.shippingWindowStart)}</ReadOnlyFieldValue>
              ) : (
                <input
                  id="order-window-start"
                  type="date"
                  className="field__input"
                  value={form.shippingWindowStart}
                  onChange={(e) => setForm((prev) => ({ ...prev, shippingWindowStart: e.target.value }))}
                />
              )}
            </div>
            <div className="field">
              <span className="field__label">{t("ordersPage.windowEndLabel")}</span>
              {readOnly ? (
                <ReadOnlyFieldValue>{displayInputDate(form.shippingWindowEnd)}</ReadOnlyFieldValue>
              ) : (
                <input
                  id="order-window-end"
                  type="date"
                  className="field__input"
                  value={form.shippingWindowEnd}
                  onChange={(e) => setForm((prev) => ({ ...prev, shippingWindowEnd: e.target.value }))}
                />
              )}
            </div>
            <div className="field">
              <span className="field__label">{t("ordersPage.transportModeLabel")}</span>
              {readOnly ? (
                <ReadOnlyFieldValue>
                  {form.transportMode ? transportModeLabel(form.transportMode, t) : "—"}
                </ReadOnlyFieldValue>
              ) : (
                <select
                  id="order-transport-mode"
                  className="field__input"
                  value={form.transportMode}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      transportMode: e.target.value as OrderTransportMode | "",
                    }))
                  }
                >
                  <option value="">{t("ordersPage.transportModePlaceholder")}</option>
                  {ORDER_TRANSPORT_MODES.filter(Boolean).map((mode) => (
                    <option key={mode} value={mode}>
                      {transportModeLabel(mode, t)}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="field">
              <span className="field__label">{t("ordersPage.incotermLabel")}</span>
              {readOnly ? (
                <ReadOnlyFieldValue>{form.incoterm || "—"}</ReadOnlyFieldValue>
              ) : (
                <select
                  id="order-incoterm"
                  className="field__input"
                  value={form.incoterm}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, incoterm: e.target.value as Incoterm | "" }))
                  }
                >
                  <option value="">{t("ordersPage.incotermPlaceholder")}</option>
                  {INCOTERM_OPTIONS.filter(Boolean).map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <OrderLocationFields
              usesTradeMasters={!!usesTradeMasters}
              operatingShipperPartyId={form.operatingShipperPartyId}
              operatingConsigneePartyId={form.operatingConsigneePartyId}
              value={form}
              onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
              chainDefaults={chainDefaults}
              disabled={saving}
              readOnly={readOnly}
            />
            <div className="field field--full">
              <span className="field__label">{t("ordersPage.notesLabel")}</span>
              {readOnly ? (
                <ReadOnlyFieldValue>{form.notes}</ReadOnlyFieldValue>
              ) : (
                <textarea
                  id="order-notes"
                  className="field__input"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              )}
            </div>
          </div>
        </section>

        <section className="order-section order-lines" aria-labelledby="order-lines-heading">
          <div className="order-lines__head">
            <h3 id="order-lines-heading" className="order-section__title">
              {t("ordersPage.linesTitle")}
            </h3>
            <p className="order-lines__meta">{t("ordersPage.linesCount", { count: lines.length })}</p>
          </div>
          <div className="order-lines-table-wrap">
            <table className="order-lines-table">
              <thead>
                <tr>
                  <th>
                    {t("ordersPage.lineKeyLabel")}
                    {!readOnly ? " *" : ""}
                  </th>
                  <th>
                    {t("ordersPage.skuLabel")}
                    {!readOnly ? " *" : ""}
                  </th>
                  <th>{t("ordersPage.descriptionLabel")}</th>
                  <th>
                    {t("ordersPage.quantityLabel")}
                    {!readOnly ? " *" : ""}
                  </th>
                  <th>
                    {t("ordersPage.uomLabel")}
                    {!readOnly ? " *" : ""}
                  </th>
                  <th>{t("ordersPage.originLabel")}</th>
                  <th>{t("ordersPage.weightLabel")}</th>
                  <th>{t("ordersPage.cbmLabel")}</th>
                  {!readOnly ? <th className="order-lines-table__actions" /> : null}
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={index}>
                    {readOnly ? (
                      <>
                        <td>{line.lineKey || "—"}</td>
                        <td>{line.sku || "—"}</td>
                        <td>{line.description || "—"}</td>
                        <td>{line.quantity || "—"}</td>
                        <td>{line.uom || "—"}</td>
                        <td>{line.countryOfOrigin || "—"}</td>
                        <td>{line.totalGrossWeight || "—"}</td>
                        <td>{line.totalCbm || "—"}</td>
                      </>
                    ) : (
                      <>
                        <td>
                          <input
                            className="field__input order-code"
                            value={line.lineKey}
                            onChange={(e) => updateLine(index, { lineKey: e.target.value })}
                            required
                          />
                        </td>
                        <td>
                          <input
                            className="field__input order-code"
                            value={line.sku}
                            onChange={(e) => updateLine(index, { sku: e.target.value })}
                            required
                          />
                        </td>
                        <td>
                          <input
                            className="field__input"
                            value={line.description}
                            onChange={(e) => updateLine(index, { description: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            className="field__input field__input--num"
                            type="number"
                            min="0"
                            step="any"
                            value={line.quantity}
                            onChange={(e) => updateLine(index, { quantity: e.target.value })}
                            required
                          />
                        </td>
                        <td>
                          <input
                            className="field__input field__input--num"
                            value={line.uom}
                            onChange={(e) => updateLine(index, { uom: e.target.value })}
                            required
                          />
                        </td>
                        <td>
                          <input
                            className="field__input field__input--num"
                            value={line.countryOfOrigin}
                            onChange={(e) => updateLine(index, { countryOfOrigin: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            className="field__input field__input--num"
                            type="number"
                            min="0"
                            step="any"
                            value={line.totalGrossWeight}
                            onChange={(e) => updateLine(index, { totalGrossWeight: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            className="field__input field__input--num"
                            type="number"
                            min="0"
                            step="any"
                            value={line.totalCbm}
                            onChange={(e) => updateLine(index, { totalCbm: e.target.value })}
                          />
                        </td>
                        <td className="order-lines-table__actions">
                          <button
                            type="button"
                            className="order-lines-table__remove"
                            aria-label={t("ordersPage.removeLine")}
                            onClick={() => removeLine(index)}
                          >
                            ×
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="dash-form__actions dash-form__actions--start">
            {!readOnly ? (
              <button type="button" className="btn btn--secondary" onClick={addLine}>
                {t("ordersPage.addLine")}
              </button>
            ) : null}
          </div>
        </section>

        <div className="dash-form__actions dash-form__actions--end">
          <Link to={ORDER_BASE} className="btn btn--ghost">
            {t("ordersPage.cancel")}
          </Link>
          {!readOnly ? (
            <>
              {!isNew ? (
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={saving}
                  onClick={() => void handleCancelEdit()}
                >
                  {t("ordersPage.cancelEdit")}
                </button>
              ) : null}
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? t("ordersPage.saving") : t("ordersPage.save")}
              </button>
            </>
          ) : null}
        </div>
      </form>

      {!isNew && (
        <TimelineModal
          open={timelineOpen}
          onClose={() => setTimelineOpen(false)}
          title={t("ordersPage.timelineTitle")}
          closeLabel={t("toast.close")}
          addEventLabel={t("ordersPage.addEventLabel")}
          addEventPlaceholder={t("ordersPage.addEventPlaceholder")}
          addEventButton={t("ordersPage.addEvent")}
          addingEventButton={t("ordersPage.addingEvent")}
          eventMessage={eventMessage}
          onEventMessageChange={setEventMessage}
          onAddEvent={handleAddEvent}
          addingEvent={addingEvent}
          messageInputId="order-event-message"
        >
          <OrderTimeline events={events} emptyLabel={t("ordersPage.timelineEmpty")} />
        </TimelineModal>
      )}
    </section>
  );
}
