import { useState } from "react";
import * as tradeMastersImportApi from "../../api/tradeMastersImport";
import { tradeMastersJobKind } from "../../api/backgroundJobs";
import { useBackgroundJobsOptional } from "../../contexts/BackgroundJobsContext";
import { useSpreadsheetImport } from "../../hooks/useSpreadsheetImport";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import {
  downloadTradeMastersKindExport,
  downloadTradeMastersKindTemplate,
  formatTradeMastersImportResult,
} from "./tradeMastersImportUtils";

function DownloadIcon() {
  return (
    <svg className="tm-import-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 3v10m0 0 4-4m-4 4-4-4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="tm-import-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0 0-3L16.5 4.5a2.1 2.1 0 0 0-3 0L3 15v5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="tm-import-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 21V11m0 0 4 4m-4-4-4 4M5 15v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type TradeMastersImportPanelProps = {
  kind: tradeMastersImportApi.TradeMastersImportKind;
  embedded?: boolean;
  onImportSuccess?: () => void;
};

export function TradeMastersImportPanel({
  kind,
  embedded = false,
  onImportSuccess,
}: TradeMastersImportPanelProps) {
  const { t } = useAppTranslation();
  const backgroundJobs = useBackgroundJobsOptional();
  const [downloading, setDownloading] = useState<"template" | "export" | null>(null);
  const [exportError, setExportError] = useState("");

  const {
    preview,
    selectedFileName,
    importResult,
    busy,
    downloadingTemplate,
    error,
    handleFile,
    handleImport,
    handleDownloadTemplate,
  } = useSpreadsheetImport({
    t,
    errorKeys: {
      templateFailed: "tradeMastersImport.templateFailed",
      loadFailed: "tradeMastersImport.loadFailed",
      importFailed: "tradeMastersImport.importFailed",
    },
    previewFile: (file) => tradeMastersImportApi.previewTradeMastersKindImport(kind, file),
    importFile: (file) => tradeMastersImportApi.importTradeMastersKindFile(kind, file),
    downloadTemplate: () => downloadTradeMastersKindTemplate(kind),
    formatResult: (data, translate) => formatTradeMastersImportResult(kind, data, translate),
    resetFileOnPreviewError: true,
    trackFileName: true,
    backgroundJobKind: tradeMastersJobKind(kind),
    onJobQueued: (job) => {
      void backgroundJobs?.refreshJobs();
      backgroundJobs?.watchJob(job.id, () => {
        onImportSuccess?.();
      });
    },
  });

  const sheetName = kind;
  const displayError = error || exportError;

  async function handleDownloadExport() {
    setDownloading("export");
    setExportError("");
    try {
      await downloadTradeMastersKindExport(kind);
    } catch {
      setExportError(t("tradeMastersImport.exportFailed"));
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className={embedded ? "tm-import-panel tm-import-panel--embedded" : "panel panel--tm-import"}>
      {!embedded ? (
        <h2 id="trade-masters-import-heading" className="sr-only">
          {t(`tradeMastersImport.kind.${kind}.title`)}
        </h2>
      ) : null}

      <div className="tm-import-wizard">
        <article className="tm-import-step">
          <div className="tm-import-step__head">
            <span className="tm-import-step__badge" aria-hidden="true">
              1
            </span>
            <div className="tm-import-step__icon tm-import-step__icon--download">
              <DownloadIcon />
            </div>
            <div>
              <h3 className="tm-import-step__title">{t("tradeMastersImport.step1Title")}</h3>
            </div>
          </div>
          <div className="tm-import-download-grid">
            <button
              type="button"
              className="tm-import-download-card"
              disabled={busy || downloading !== null || downloadingTemplate}
              onClick={() => void handleDownloadTemplate()}
            >
              <span className="tm-import-download-card__label">
                {t("tradeMastersImport.templateCardTitle")}
              </span>
              <span className="tm-import-download-card__action">
                {downloadingTemplate ? t("tradeMastersImport.busy") : t("tradeMastersImport.xlsxTemplate")}
              </span>
            </button>
            <button
              type="button"
              className="tm-import-download-card tm-import-download-card--accent"
              disabled={busy || downloading !== null || downloadingTemplate}
              onClick={() => void handleDownloadExport()}
            >
              <span className="tm-import-download-card__label">
                {t("tradeMastersImport.exportCardTitle")}
              </span>
              <span className="tm-import-download-card__action">
                {downloading === "export" ? t("tradeMastersImport.busy") : t("tradeMastersImport.xlsxExport")}
              </span>
            </button>
          </div>
        </article>

        <article className="tm-import-step">
          <div className="tm-import-step__head">
            <span className="tm-import-step__badge" aria-hidden="true">
              2
            </span>
            <div className="tm-import-step__icon tm-import-step__icon--edit">
              <EditIcon />
            </div>
            <div>
              <h3 className="tm-import-step__title">{t("tradeMastersImport.step2Title")}</h3>
            </div>
          </div>
          <div className="tm-import-sheets">
            <span className="tm-import-sheet tm-import-sheet--info">
              {t("tradeMastersImport.sheet.instructions")}
            </span>
            <span className="tm-import-sheet">{sheetName}</span>
          </div>
        </article>

        <article className="tm-import-step tm-import-step--upload">
          <div className="tm-import-step__head">
            <span className="tm-import-step__badge" aria-hidden="true">
              3
            </span>
            <div className="tm-import-step__icon tm-import-step__icon--upload">
              <UploadIcon />
            </div>
            <div>
              <h3 className="tm-import-step__title">{t("tradeMastersImport.step3Title")}</h3>
            </div>
          </div>
          <label
            className={`tm-import-upload${busy ? " tm-import-upload--busy" : ""}${selectedFileName ? " tm-import-upload--has-file" : ""}`}
          >
            <UploadIcon />
            <span className="tm-import-upload__title">
              {busy ? t("tradeMastersImport.busy") : t("tradeMastersImport.uploadZoneTitle")}
            </span>
            <span className="tm-import-upload__hint">{t("tradeMastersImport.uploadZoneHint")}</span>
            {selectedFileName ? (
              <span className="tm-import-upload__file">{selectedFileName}</span>
            ) : (
              <span className="btn btn--primary btn--sm tm-import-upload__btn">
                {t("tradeMastersImport.chooseFile")}
              </span>
            )}
            <input
              type="file"
              accept=".xlsx,.xls"
              className="sr-only"
              onChange={handleFile}
              disabled={busy}
            />
          </label>
        </article>
      </div>

      {displayError ? (
        <p className="panel__error tm-import-alert" role="alert">
          {displayError}
        </p>
      ) : null}
      {importResult ? (
        <p className="import-msg tm-import-success" role="status">
          {importResult}
        </p>
      ) : null}

      {preview ? (
        <div className="tm-import-preview">
          <div className="tm-import-preview__head">
            <h3 className="tm-import-preview__title">{t("tradeMastersImport.previewTitle")}</h3>
            <div className="tm-import-preview__stats">
              <span className="tm-import-stat tm-import-stat--ok">
                {t("tradeMastersImport.statValid", { count: preview.valid })}
              </span>
              {preview.invalid > 0 ? (
                <span className="tm-import-stat tm-import-stat--err">
                  {t("tradeMastersImport.statInvalid", { count: preview.invalid })}
                </span>
              ) : null}
              <span className="tm-import-stat tm-import-stat--total">
                {t("tradeMastersImport.statTotal", { count: preview.rowsTotal })}
              </span>
            </div>
          </div>

          {preview.errors.length > 0 ? (
            <ul className="import-errors">
              {preview.errors.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          ) : null}

          {preview.preview.length > 0 ? (
            <div className="dash-table-wrap dash-table-wrap--mt">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>{t("tradeMastersImport.thRow")}</th>
                    <th>{t("tradeMastersImport.thLabel")}</th>
                    <th>{t("tradeMastersImport.thErrors")}</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((row) => (
                    <tr key={row.rowNumber} className={row.valid ? undefined : "tm-import-row--invalid"}>
                      <td>{row.rowNumber}</td>
                      <td>{row.label}</td>
                      <td className={row.valid ? "dash-table__muted" : undefined}>
                        {row.valid ? "—" : row.errors.join("; ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {preview.valid > 0 ? (
            <div className="tm-import-preview__actions">
              <button
                type="button"
                className="btn btn--primary"
                disabled={busy}
                onClick={() => void handleImport()}
              >
                {busy
                  ? t("tradeMastersImport.busy")
                  : t("backgroundJobs.queueImport", { count: preview.valid })}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
