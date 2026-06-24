import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as shipmentsApi from "../../api/shipments";
import { PageBreadcrumb } from "../../components/PageBreadcrumb.jsx";
import { useAppToast } from "../../hooks/useAppToast";
import { messageFromApiErrorOrKey } from "../../i18n/apiMessage.js";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { useDashboardWorkspace } from "../../pages/dashboard/DashboardWorkspaceContext.jsx";
import type { DashboardWorkspaceClients } from "../../pages/dashboard/dashboardWorkspaceTypes";
import { ShipmentTimeline } from "./ShipmentTimeline";
import { shipmentStatusLabel } from "./shipmentUtils";
import { SHIPMENT_STATUS_OPTIONS, type ShipmentEvent, type Shipment, type ShipmentFormState } from "./types";

const EMPTY_FORM: ShipmentFormState = {
  reference: "",
  origin: "",
  destination: "",
  etd: "",
  eta: "",
  status: "draft",
  notes: "",
  clientId: "",
  containerNumber: "",
};

function toInputDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function DashboardShipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const { showToast } = useAppToast();
  const { clients } = useDashboardWorkspace() as DashboardWorkspaceClients;

  const [form, setForm] = useState<ShipmentFormState>(EMPTY_FORM);
  const [containers, setContainers] = useState<{ containerNumber: string; notes: string }[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [events, setEvents] = useState<ShipmentEvent[]>([]);
  const [eventMessage, setEventMessage] = useState("");
  const [addingEvent, setAddingEvent] = useState(false);
  const [error, setError] = useState("");

  const pageTitle = useMemo(
    () => (isNew ? t("shipmentsPage.createTitle") : t("shipmentsPage.detailTitle")),
    [isNew, t]
  );

  const load = useCallback(async () => {
    if (!id || isNew) return;
    setLoading(true);
    setError("");
    try {
      const { item, events: timeline } = await shipmentsApi.fetchShipment(id);
      setForm({
        reference: item.reference,
        origin: item.origin,
        destination: item.destination,
        etd: toInputDate(item.etd),
        eta: toInputDate(item.eta),
        status: item.status,
        notes: item.notes,
        clientId: item.clientId ?? "",
        containerNumber: "",
      });
      setContainers(
        item.containers.map((c) => ({ containerNumber: c.containerNumber, notes: c.notes ?? "" }))
      );
      setEvents(timeline);
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "shipmentsPage.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [id, isNew, t]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  function addContainer() {
    const containerNumber = form.containerNumber.trim().toUpperCase();
    if (containerNumber.length < 4) return;
    if (containers.some((c) => c.containerNumber === containerNumber)) return;
    setContainers((prev) => [...prev, { containerNumber, notes: "" }]);
    setForm((prev) => ({ ...prev, containerNumber: "" }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.reference.trim()) return;

    setSaving(true);
    setError("");
    const body = {
      reference: form.reference.trim(),
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      etd: form.etd || null,
      eta: form.eta || null,
      status: form.status,
      notes: form.notes.trim(),
      clientId: form.clientId || null,
      containers,
    };

    try {
      const item = isNew
        ? await shipmentsApi.createShipment(body)
        : await shipmentsApi.updateShipment(id!, body);
      showToast({ message: t("shipmentsPage.saved"), variant: "success" });
      if (isNew) {
        navigate(`/dashboard/shipments/${item.id}`, { replace: true });
      } else {
        await load();
      }
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "shipmentsPage.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    if (!id || isNew) return;
    try {
      const result = await shipmentsApi.createShareLink(id, 30);
      const url = result.item.publicUrl.startsWith("http")
        ? result.item.publicUrl
        : `${window.location.origin}${result.item.publicUrl}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      showToast({ message: t("shipmentsPage.shareCopied"), variant: "success" });
    } catch (err) {
      showToast({
        message: messageFromApiErrorOrKey(err, t, "shipmentsPage.shareFailed"),
        variant: "error",
      });
    }
  }

  async function handleAddEvent(e: FormEvent) {
    e.preventDefault();
    if (!id || isNew || !eventMessage.trim()) return;
    setAddingEvent(true);
    try {
      const event = await shipmentsApi.createShipmentEvent(id, {
        kind: "note",
        message: eventMessage.trim(),
      });
      setEvents((prev) => [event, ...prev]);
      setEventMessage("");
      showToast({ message: t("shipmentsPage.eventAdded"), variant: "success" });
    } catch (err) {
      showToast({
        message: messageFromApiErrorOrKey(err, t, "shipmentsPage.eventFailed"),
        variant: "error",
      });
    } finally {
      setAddingEvent(false);
    }
  }

  async function handleDelete() {
    if (!id || isNew) return;
    if (!window.confirm(t("shipmentsPage.confirmDelete"))) return;
    try {
      await shipmentsApi.deleteShipment(id);
      showToast({ message: t("shipmentsPage.deleted"), variant: "success" });
      navigate("/dashboard/shipments");
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "shipmentsPage.deleteFailed"));
    }
  }

  if (loading) {
    return <p className="panel__muted">{t("shipmentsPage.loading")}</p>;
  }

  return (
    <section className="panel panel--dash-form" aria-labelledby="shipment-detail-heading">
      <PageBreadcrumb
        items={[
          { label: t("workspace.section.overview.topbar"), to: "/dashboard/home" },
          { label: t("workspace.section.shipments.topbar"), to: "/dashboard/shipments" },
          { label: pageTitle },
        ]}
      />
      <div className="panel__head-row">
        <h2 id="shipment-detail-heading" className="panel__title panel__title--section">
          {pageTitle}
        </h2>
        {!isNew && (
          <div className="dash-form__actions">
            <button type="button" className="btn btn--secondary" onClick={() => handleShare()}>
              {t("shipmentsPage.shareLink")}
            </button>
            <button type="button" className="btn btn--ghost btn--danger" onClick={() => handleDelete()}>
              {t("shipmentsPage.delete")}
            </button>
          </div>
        )}
      </div>

      {shareUrl && (
        <div className="panel__callout" role="status">
          <span className="panel__callout-label">{t("shipmentsPage.shareReady")}</span>{" "}
          <code className="dash__code">{shareUrl}</code>
        </div>
      )}

      {error && (
        <p className="panel__error" role="alert">
          {error}
        </p>
      )}

      <form className="dash-form" onSubmit={handleSubmit}>
        <div className="dash-form__grid">
          <div className="field">
            <label className="field__label" htmlFor="shipment-reference">
              {t("shipmentsPage.referenceLabel")}
            </label>
            <input
              id="shipment-reference"
              className="field__input"
              value={form.reference}
              onChange={(e) => setForm((prev) => ({ ...prev, reference: e.target.value }))}
              required
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="shipment-status">
              {t("shipmentsPage.statusLabel")}
            </label>
            <select
              id="shipment-status"
              className="field__input"
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as Shipment["status"] }))}
            >
              {SHIPMENT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {shipmentStatusLabel(status, t)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="shipment-origin">
              {t("shipmentsPage.originLabel")}
            </label>
            <input
              id="shipment-origin"
              className="field__input"
              value={form.origin}
              onChange={(e) => setForm((prev) => ({ ...prev, origin: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="shipment-destination">
              {t("shipmentsPage.destinationLabel")}
            </label>
            <input
              id="shipment-destination"
              className="field__input"
              value={form.destination}
              onChange={(e) => setForm((prev) => ({ ...prev, destination: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="shipment-etd">
              {t("shipmentsPage.etdLabel")}
            </label>
            <input
              id="shipment-etd"
              type="date"
              className="field__input"
              value={form.etd}
              onChange={(e) => setForm((prev) => ({ ...prev, etd: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="shipment-eta">
              {t("shipmentsPage.etaLabel")}
            </label>
            <input
              id="shipment-eta"
              type="date"
              className="field__input"
              value={form.eta}
              onChange={(e) => setForm((prev) => ({ ...prev, eta: e.target.value }))}
            />
          </div>
          <div className="field field--full">
            <label className="field__label" htmlFor="shipment-client">
              {t("shipmentsPage.clientLabel")}
            </label>
            <select
              id="shipment-client"
              className="field__input"
              value={form.clientId}
              onChange={(e) => setForm((prev) => ({ ...prev, clientId: e.target.value }))}
            >
              <option value="">{t("shipmentsPage.noClient")}</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field field--full">
            <label className="field__label" htmlFor="shipment-notes">
              {t("shipmentsPage.notesLabel")}
            </label>
            <textarea
              id="shipment-notes"
              className="field__input"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>

        <div className="panel__subhead">{t("shipmentsPage.containersTitle")}</div>
        <div className="dash-form dash-form--inline">
          <div className="field field--grow">
            <label className="field__label" htmlFor="shipment-container-number">
              {t("shipmentsPage.containerNumberLabel")}
            </label>
            <input
              id="shipment-container-number"
              className="field__input"
              value={form.containerNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, containerNumber: e.target.value }))}
              placeholder="MSCU1234567"
            />
          </div>
          <div className="dash-form__actions">
            <button type="button" className="btn btn--secondary" onClick={addContainer}>
              {t("shipmentsPage.addContainer")}
            </button>
          </div>
        </div>

        {containers.length > 0 && (
          <ul className="dash-chip-list">
            {containers.map((c) => (
              <li key={c.containerNumber} className="dash-chip">
                <span>{c.containerNumber}</span>
                <button
                  type="button"
                  className="dash-chip__remove"
                  aria-label={t("shipmentsPage.removeContainer")}
                  onClick={() =>
                    setContainers((prev) => prev.filter((row) => row.containerNumber !== c.containerNumber))
                  }
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="dash-form__actions dash-form__actions--end">
          <Link to="/dashboard/shipments" className="btn btn--ghost">
            {t("shipmentsPage.cancel")}
          </Link>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? t("shipmentsPage.saving") : t("shipmentsPage.save")}
          </button>
        </div>
      </form>

      {!isNew && (
        <div className="panel__subpanel">
          <h3 className="panel__subhead">{t("shipmentsPage.timelineTitle")}</h3>
          <form className="dash-form dash-form--inline" onSubmit={handleAddEvent}>
            <div className="field field--grow">
              <label className="field__label" htmlFor="shipment-event-message">
                {t("shipmentsPage.addEventLabel")}
              </label>
              <input
                id="shipment-event-message"
                className="field__input"
                value={eventMessage}
                onChange={(e) => setEventMessage(e.target.value)}
                placeholder={t("shipmentsPage.addEventPlaceholder")}
              />
            </div>
            <div className="dash-form__actions">
              <button type="submit" className="btn btn--secondary" disabled={addingEvent}>
                {addingEvent ? t("shipmentsPage.addingEvent") : t("shipmentsPage.addEvent")}
              </button>
            </div>
          </form>
          <ShipmentTimeline events={events} emptyLabel={t("shipmentsPage.timelineEmpty")} />
        </div>
      )}
    </section>
  );
}
