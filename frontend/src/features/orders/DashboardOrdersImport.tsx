import { ChangeEvent, useState } from "react";
import { Link } from "react-router-dom";
import { ImportSpecGroup } from "../../components/import/ImportSpecGroup";
import * as ordersApi from "../../api/orders";
import { useBackgroundJobsOptional } from "../../contexts/BackgroundJobsContext";
import { PageBreadcrumb } from "../../components/PageBreadcrumb.jsx";
import { useSpreadsheetImport } from "../../hooks/useSpreadsheetImport";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { downloadOrdersXlsxTemplate } from "./orderImportUtils";

const ORDER_BASE = "/dashboard/operations/export/order";

const REQUIRED_COLS = [
  "order_number",
  "contractual_code",
  "customer_order_line_key",
  "sku_number",
  "quantity",
  "uom",
];

const CONDITIONAL_REQUIRED_COLS = ["operating_shipper_code", "operating_consignee_code"];

const OPTIONAL_COLS = [
  "operating_shipper_code",
  "operating_consignee_code",
  "customer",
  "shipper",
  "consignee",
  "external_business_identifier",
  "shipping_window_start",
  "shipping_window_end",
  "transport_mode",
  "place_of_receipt",
  "port_of_loading",
  "port_of_discharge",
  "place_of_delivery",
  "incoterm",
  "description_of_goods",
  "commodity_country_of_origin",
  "total_gross_weight",
  "total_cbm",
];

export function DashboardOrdersImport() {
  const { t } = useAppTranslation();
  const backgroundJobs = useBackgroundJobsOptional();
  const {
    preview,
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
      templateFailed: "ordersImport.templateFailed",
      loadFailed: "ordersImport.loadFailed",
      importFailed: "ordersImport.importFailed",
    },
    resultKey: "ordersImport.result",
    previewFile: ordersApi.previewOrderImport,
    importFile: ordersApi.importOrdersFile,
    downloadTemplate: downloadOrdersXlsxTemplate,
    backgroundJobKind: "import.orders",
    onJobQueued: () => {
      void backgroundJobs?.refreshJobs();
    },
  });

  return (
    <section className="panel panel--dash-form panel--orders" aria-labelledby="orders-import-heading">
      <PageBreadcrumb
        items={[
          { label: t("modules.nav.home"), to: "/dashboard/home" },
          { label: t("modules.export.title"), to: "/dashboard/operations/export" },
          { label: t("modules.export.order"), to: ORDER_BASE },
          { label: t("ordersImport.title") },
        ]}
      />
      <h2 id="orders-import-heading" className="sr-only">
        {t("ordersImport.title")}
      </h2>

      <ImportSpecGroup
        title={t("ordersImport.requiredSection")}
        cols={REQUIRED_COLS}
        required
        i18nPrefix="ordersImport"
        t={t}
      />
      <ImportSpecGroup
        title={t("ordersImport.conditionalSection")}
        cols={CONDITIONAL_REQUIRED_COLS}
        required
        i18nPrefix="ordersImport"
        t={t}
      />
      <ImportSpecGroup
        title={t("ordersImport.optionalSection")}
        cols={OPTIONAL_COLS}
        required={false}
        i18nPrefix="ordersImport"
        t={t}
      />

      <div className="import-row">
        <label className={`btn btn--primary import-file-label${busy ? " import-file-label--busy" : ""}`}>
          {busy ? t("ordersImport.busy") : t("ordersImport.chooseFile")}
          <input type="file" accept=".xlsx,.xls" className="sr-only" onChange={handleFile} disabled={busy} />
        </label>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => void handleDownloadTemplate()}
          disabled={downloadingTemplate || busy}
        >
          {downloadingTemplate ? t("ordersImport.busy") : t("ordersImport.xlsxTemplate")}
        </button>
        <Link to={ORDER_BASE} className="btn btn--ghost">
          {t("ordersImport.back")}
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
        <div className="panel__callout panel__subpanel">
          <p>
            {t("ordersImport.previewSummary", {
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
          {preview.preview.length > 0 && (
            <div className="dash-table-wrap dash-table-wrap--mt">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>{t("ordersImport.thRow")}</th>
                    <th>{t("ordersImport.thOrder")}</th>
                    <th>{t("ordersImport.thLine")}</th>
                    <th>{t("ordersImport.thErrors")}</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((row) => (
                    <tr key={row.rowNumber}>
                      <td>{row.rowNumber}</td>
                      <td>
                        <span className="order-code">{row.orderNumber}</span>
                      </td>
                      <td>{row.lineKey}</td>
                      <td className={row.valid ? "dash-table__muted" : undefined}>
                        {row.valid ? "—" : row.errors.join("; ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {preview.valid > 0 && (
            <div className="dash-form__actions dash-form__actions--start">
              <button
                type="button"
                className="btn btn--primary"
                disabled={busy}
                onClick={() => void handleImport()}
              >
                {busy ? t("ordersImport.busy") : t("backgroundJobs.queueImport", { count: preview.valid })}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
