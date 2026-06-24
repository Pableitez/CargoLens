import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as casesApi from "../../api/cases";
import * as shipmentsApi from "../../api/shipments";
import { PageBreadcrumb } from "../../components/PageBreadcrumb.jsx";
import { useAppToast } from "../../hooks/useAppToast";
import { messageFromApiErrorOrKey } from "../../i18n/apiMessage.js";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { useDashboardWorkspace } from "../../pages/dashboard/DashboardWorkspaceContext.jsx";
import type { DashboardWorkspaceClients } from "../../pages/dashboard/dashboardWorkspaceTypes";
import { CaseTimeline } from "./CaseTimeline";
import { caseStatusLabel, tradeDirectionLabel } from "./caseUtils";
import {
  CASE_STATUS_OPTIONS,
  CASE_TRADE_DIRECTION_OPTIONS,
  type Case,
  type CaseEvent,
  type CaseFormState,
  type CaseStatus,
  type CaseTradeDirection,
} from "./types";
import type { Shipment } from "../shipments/types";

const EMPTY_FORM: CaseFormState = {
  reference: "",
  title: "",
  status: "draft",
  tradeDirection: "",
  incoterm: "",
  origin: "",
  destination: "",
  clientId: "",
  openedAt: "",
  closedAt: "",
  notes: "",
};

function toInputDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function DashboardCaseDetail() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const { showToast } = useAppToast();
  const { clients } = useDashboardWorkspace() as DashboardWorkspaceClients;

  const [form, setForm] = useState<CaseFormState>(EMPTY_FORM);
  const [shipmentIds, setShipmentIds] = useState<string[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [shipmentPick, setShipmentPick] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<CaseEvent[]>([]);
  const [eventMessage, setEventMessage] = useState("");
  const [addingEvent, setAddingEvent] = useState(false);
  const [error, setError] = useState("");

  const pageTitle = useMemo(
    () => (isNew ? t("casesPage.createTitle") : t("casesPage.detailTitle")),
    [isNew, t]
  );

  const shipmentMap = useMemo(() => new Map(shipments.map((row) => [row.id, row])), [shipments]);

  const loadShipments = useCallback(async () => {
    try {
      const rows = await shipmentsApi.fetchShipments();
      setShipments(rows);
    } catch {
      setShipments([]);
    }
  }, []);

  const load = useCallback(async () => {
    if (!id || isNew) return;
    setLoading(true);
    setError("");
    try {
      const { item, events: timeline } = await casesApi.fetchCase(id);
      setForm({
        reference: item.reference,
        title: item.title,
        status: item.status,
        tradeDirection: item.tradeDirection,
        incoterm: item.incoterm,
        origin: item.origin,
        destination: item.destination,
        clientId: item.clientId ?? "",
        openedAt: toInputDate(item.openedAt),
        closedAt: toInputDate(item.closedAt),
        notes: item.notes,
      });
      setShipmentIds(item.shipmentIds);
      setEvents(timeline);
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "casesPage.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [id, isNew, t]);

  useEffect(() => {
    loadShipments().catch(() => {});
  }, [loadShipments]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  function addShipment() {
    const pick = shipmentPick.trim();
    if (!pick || shipmentIds.includes(pick)) return;
    setShipmentIds((prev) => [...prev, pick]);
    setShipmentPick("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.reference.trim()) return;

    setSaving(true);
    setError("");
    const body = {
      reference: form.reference.trim(),
      title: form.title.trim(),
      status: form.status,
      tradeDirection: form.tradeDirection,
      incoterm: form.incoterm.trim(),
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      clientId: form.clientId || null,
      openedAt: form.openedAt || null,
      closedAt: form.closedAt || null,
      notes: form.notes.trim(),
      shipmentIds,
    };

    try {
      const item: Case = isNew ? await casesApi.createCase(body) : await casesApi.updateCase(id!, body);
      showToast({ message: t("casesPage.saved"), variant: "success" });
      if (isNew) {
        navigate(`/dashboard/cases/${item.id}`, { replace: true });
      } else {
        await load();
      }
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "casesPage.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function handleAddEvent(e: FormEvent) {
    e.preventDefault();
    if (!id || isNew || !eventMessage.trim()) return;
    setAddingEvent(true);
    try {
      const event = await casesApi.createCaseEvent(id, {
        kind: "note",
        message: eventMessage.trim(),
      });
      setEvents((prev) => [event, ...prev]);
      setEventMessage("");
      showToast({ message: t("casesPage.eventAdded"), variant: "success" });
    } catch (err) {
      showToast({
        message: messageFromApiErrorOrKey(err, t, "casesPage.eventFailed"),
        variant: "error",
      });
    } finally {
      setAddingEvent(false);
    }
  }

  async function handleDelete() {
    if (!id || isNew) return;
    if (!window.confirm(t("casesPage.confirmDelete"))) return;
    try {
      await casesApi.deleteCase(id);
      showToast({ message: t("casesPage.deleted"), variant: "success" });
      navigate("/dashboard/cases");
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "casesPage.deleteFailed"));
    }
  }

  const availableShipments = shipments.filter((row) => !shipmentIds.includes(row.id));

  if (loading) {
    return <p className="panel__muted">{t("casesPage.loading")}</p>;
  }

  return (
    <section className="panel panel--dash-form" aria-labelledby="case-detail-heading">
      <PageBreadcrumb
        items={[
          { label: t("workspace.section.overview.topbar"), to: "/dashboard/home" },
          { label: t("workspace.section.cases.topbar"), to: "/dashboard/cases" },
          { label: pageTitle },
        ]}
      />
      <div className="panel__head-row">
        <h2 id="case-detail-heading" className="panel__title panel__title--section">
          {pageTitle}
        </h2>
        {!isNew && (
          <div className="dash-form__actions">
            <button type="button" className="btn btn--ghost btn--danger" onClick={() => handleDelete()}>
              {t("casesPage.delete")}
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="panel__error" role="alert">
          {error}
        </p>
      )}

      <form className="dash-form" onSubmit={handleSubmit}>
        <div className="dash-form__grid">
          <div className="field">
            <label className="field__label" htmlFor="case-reference">
              {t("casesPage.referenceLabel")}
            </label>
            <input
              id="case-reference"
              className="field__input"
              value={form.reference}
              onChange={(e) => setForm((prev) => ({ ...prev, reference: e.target.value }))}
              required
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="case-title">
              {t("casesPage.titleLabel")}
            </label>
            <input
              id="case-title"
              className="field__input"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="case-status">
              {t("casesPage.statusLabel")}
            </label>
            <select
              id="case-status"
              className="field__input"
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as CaseStatus }))}
            >
              {CASE_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {caseStatusLabel(status, t)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="case-trade-direction">
              {t("casesPage.tradeDirectionLabel")}
            </label>
            <select
              id="case-trade-direction"
              className="field__input"
              value={form.tradeDirection}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  tradeDirection: e.target.value as CaseTradeDirection,
                }))
              }
            >
              {CASE_TRADE_DIRECTION_OPTIONS.map((direction) => (
                <option key={direction || "none"} value={direction}>
                  {direction ? tradeDirectionLabel(direction, t) : t("casesPage.tradeDirectionNone")}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="case-incoterm">
              {t("casesPage.incotermLabel")}
            </label>
            <input
              id="case-incoterm"
              className="field__input"
              value={form.incoterm}
              onChange={(e) => setForm((prev) => ({ ...prev, incoterm: e.target.value }))}
              placeholder="FOB"
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="case-origin">
              {t("casesPage.originLabel")}
            </label>
            <input
              id="case-origin"
              className="field__input"
              value={form.origin}
              onChange={(e) => setForm((prev) => ({ ...prev, origin: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="case-destination">
              {t("casesPage.destinationLabel")}
            </label>
            <input
              id="case-destination"
              className="field__input"
              value={form.destination}
              onChange={(e) => setForm((prev) => ({ ...prev, destination: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="case-opened-at">
              {t("casesPage.openedAtLabel")}
            </label>
            <input
              id="case-opened-at"
              type="date"
              className="field__input"
              value={form.openedAt}
              onChange={(e) => setForm((prev) => ({ ...prev, openedAt: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="case-closed-at">
              {t("casesPage.closedAtLabel")}
            </label>
            <input
              id="case-closed-at"
              type="date"
              className="field__input"
              value={form.closedAt}
              onChange={(e) => setForm((prev) => ({ ...prev, closedAt: e.target.value }))}
            />
          </div>
          <div className="field field--full">
            <label className="field__label" htmlFor="case-client">
              {t("casesPage.clientLabel")}
            </label>
            <select
              id="case-client"
              className="field__input"
              value={form.clientId}
              onChange={(e) => setForm((prev) => ({ ...prev, clientId: e.target.value }))}
            >
              <option value="">{t("casesPage.noClient")}</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field field--full">
            <label className="field__label" htmlFor="case-notes">
              {t("casesPage.notesLabel")}
            </label>
            <textarea
              id="case-notes"
              className="field__input"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>

        <div className="panel__subhead">{t("casesPage.shipmentsTitle")}</div>
        <div className="dash-form dash-form--inline">
          <div className="field field--grow">
            <label className="field__label" htmlFor="case-shipment-pick">
              {t("casesPage.linkShipmentLabel")}
            </label>
            <select
              id="case-shipment-pick"
              className="field__input"
              value={shipmentPick}
              onChange={(e) => setShipmentPick(e.target.value)}
            >
              <option value="">{t("casesPage.pickShipment")}</option>
              {availableShipments.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.reference} — {row.origin || "—"} → {row.destination || "—"}
                </option>
              ))}
            </select>
          </div>
          <div className="dash-form__actions">
            <button type="button" className="btn btn--secondary" onClick={addShipment}>
              {t("casesPage.linkShipment")}
            </button>
          </div>
        </div>

        {shipmentIds.length > 0 && (
          <ul className="dash-chip-list">
            {shipmentIds.map((shipmentId) => {
              const row = shipmentMap.get(shipmentId);
              const label = row?.reference ?? shipmentId;
              return (
                <li key={shipmentId} className="dash-chip">
                  <Link to={`/dashboard/shipments/${shipmentId}`} className="dash-table__link">
                    {label}
                  </Link>
                  <button
                    type="button"
                    className="dash-chip__remove"
                    aria-label={t("casesPage.unlinkShipment")}
                    onClick={() => setShipmentIds((prev) => prev.filter((id) => id !== shipmentId))}
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="dash-form__actions dash-form__actions--end">
          <Link to="/dashboard/cases" className="btn btn--ghost">
            {t("casesPage.cancel")}
          </Link>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? t("casesPage.saving") : t("casesPage.save")}
          </button>
        </div>
      </form>

      {!isNew && (
        <div className="panel__subpanel">
          <h3 className="panel__subhead">{t("casesPage.timelineTitle")}</h3>
          <form className="dash-form dash-form--inline" onSubmit={handleAddEvent}>
            <div className="field field--grow">
              <label className="field__label" htmlFor="case-event-message">
                {t("casesPage.addEventLabel")}
              </label>
              <input
                id="case-event-message"
                className="field__input"
                value={eventMessage}
                onChange={(e) => setEventMessage(e.target.value)}
                placeholder={t("casesPage.addEventPlaceholder")}
              />
            </div>
            <div className="dash-form__actions">
              <button type="submit" className="btn btn--secondary" disabled={addingEvent}>
                {addingEvent ? t("casesPage.addingEvent") : t("casesPage.addEvent")}
              </button>
            </div>
          </form>
          <CaseTimeline events={events} emptyLabel={t("casesPage.timelineEmpty")} />
        </div>
      )}
    </section>
  );
}
