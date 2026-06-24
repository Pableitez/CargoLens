import { ChangeEvent, useState } from "react";
import { Link } from "react-router-dom";
import * as shipmentsApi from "../../api/shipments";
import { PageBreadcrumb } from "../../components/PageBreadcrumb.jsx";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { messageFromApiErrorOrKey } from "../../i18n/apiMessage.js";
import { downloadShipmentsXlsxTemplate } from "./shipmentImportUtils";
import type { ShipmentImportPreview } from "./types";

export function DashboardShipmentsImport() {
  const { t } = useAppTranslation();
  const [preview, setPreview] = useState<ShipmentImportPreview | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [error, setError] = useState("");

  async function handleDownloadTemplate() {
    setDownloadingTemplate(true);
    setError("");
    try {
      await downloadShipmentsXlsxTemplate();
    } catch {
      setError(t("shipmentsImport.templateFailed"));
    } finally {
      setDownloadingTemplate(false);
    }
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBusy(true);
    setError("");
    setImportResult("");
    try {
      setSelectedFile(file);
      const data = await shipmentsApi.previewShipmentImport(file);
      setPreview(data);
    } catch (err) {
      setPreview(null);
      setError(messageFromApiErrorOrKey(err, t, "shipmentsImport.loadFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function handleImport() {
    if (!selectedFile) return;
    setBusy(true);
    setError("");
    try {
      const data = await shipmentsApi.importShipmentsFile(selectedFile);
      setImportResult(
        t("shipmentsImport.result", {
          created: data.created,
          skipped: data.skipped,
        })
      );
      setPreview(null);
      setSelectedFile(null);
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "shipmentsImport.importFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel panel--dash-form" aria-labelledby="shipments-import-heading">
      <PageBreadcrumb
        items={[
          { label: t("workspace.section.overview.topbar"), to: "/dashboard/home" },
          { label: t("workspace.section.shipments.topbar"), to: "/dashboard/shipments" },
          { label: t("shipmentsImport.title") },
        ]}
      />
      <h2 id="shipments-import-heading" className="panel__title panel__title--section">
        {t("shipmentsImport.title")}
      </h2>
      <p className="panel__lead">{t("shipmentsImport.lead")}</p>

      <div className="import-spec" role="table" aria-label={t("shipmentsImport.ariaColumns")}>
        <div className="import-spec__row import-spec__row--head">
          <span>{t("shipmentsImport.colColumn")}</span>
          <span>{t("shipmentsImport.colRequired")}</span>
          <span>{t("shipmentsImport.colDesc")}</span>
        </div>
        {[
          ["reference", "yes", "colReference"],
          ["origin / destination", "no", "colRoute"],
          ["etd / eta", "no", "colDates"],
          ["status", "no", "colStatus"],
          ["container", "no", "colContainer"],
          ["client_invite", "no", "colClient"],
        ].map(([col, req, key]) => (
          <div key={col} className="import-spec__row">
            <span>{col}</span>
            <span>{req === "yes" ? t("shipmentsImport.colYes") : t("shipmentsImport.colNo")}</span>
            <span>{t(`shipmentsImport.${key}`)}</span>
          </div>
        ))}
      </div>

      <div className="import-row">
        <label className={`btn btn--ghost import-file-label${busy ? " import-file-label--busy" : ""}`}>
          {busy ? t("shipmentsImport.busy") : t("shipmentsImport.chooseFile")}
          <input type="file" accept=".xlsx,.xls" className="sr-only" onChange={handleFile} disabled={busy} />
        </label>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => handleDownloadTemplate()}
          disabled={downloadingTemplate || busy}
        >
          {downloadingTemplate ? t("shipmentsImport.busy") : t("shipmentsImport.xlsxTemplate")}
        </button>
        <Link to="/dashboard/shipments" className="btn btn--ghost">
          {t("shipmentsImport.back")}
        </Link>
      </div>

      {error && (
        <p className="panel__error" role="alert">
          {error}
        </p>
      )}
      {importResult && (
        <p className="import-msg" role="status">
          {importResult}
        </p>
      )}

      {preview && (
        <div className="panel__callout">
          <p>
            {t("shipmentsImport.previewSummary", {
              valid: preview.valid,
              invalid: preview.invalid,
              total: preview.rowsTotal,
            })}
          </p>
          {preview.errors.length > 0 && (
            <ul className="import-errors">
              {preview.errors.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleImport}
            disabled={busy || preview.valid === 0}
          >
            {t("shipmentsImport.confirmImport", { count: preview.valid })}
          </button>
        </div>
      )}
    </section>
  );
}
