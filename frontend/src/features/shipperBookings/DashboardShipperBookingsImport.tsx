import { Link } from "react-router-dom";
import { ImportSpecGroup } from "../../components/import/ImportSpecGroup";
import * as shipperBookingsApi from "../../api/shipperBookings";
import { useBackgroundJobsOptional } from "../../contexts/BackgroundJobsContext";
import { PageBreadcrumb } from "../../components/PageBreadcrumb.jsx";
import { useSpreadsheetImport } from "../../hooks/useSpreadsheetImport";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { downloadShipperBookingsXlsxTemplate } from "./shipperBookingImportUtils";

const BOOKING_BASE = "/dashboard/operations/export/shipper-booking";

const REQUIRED_COLS = [
  "booking_reference",
  "customer",
  "shipper",
  "consignee",
  "customer_order_line_key",
  "sku_number",
  "booked_quantity",
  "quantity_unit",
];

const OPTIONAL_COLS = [
  "customer_reference_number",
  "cargo_ready_date",
  "expected_receipt_date",
  "expected_delivery_date",
  "transport_mode",
  "place_of_receipt",
  "port_of_loading",
  "port_of_discharge",
  "place_of_delivery",
  "incoterm",
  "incoterm_location",
  "customer_order_number",
  "description_of_goods",
  "commodity_country_of_origin",
  "booked_volume",
  "booked_weight",
  "external_business_identifier",
];

export function DashboardShipperBookingsImport() {
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
      templateFailed: "shipperBookingsImport.templateFailed",
      loadFailed: "shipperBookingsImport.loadFailed",
      importFailed: "shipperBookingsImport.importFailed",
    },
    resultKey: "shipperBookingsImport.result",
    previewFile: shipperBookingsApi.previewShipperBookingImport,
    importFile: shipperBookingsApi.importShipperBookingsFile,
    downloadTemplate: downloadShipperBookingsXlsxTemplate,
    backgroundJobKind: "import.shipper_bookings",
    onJobQueued: (_job) => {
      void backgroundJobs?.refreshJobs();
    },
  });

  return (
    <section
      className="panel panel--dash-form panel--orders"
      aria-labelledby="shipper-bookings-import-heading"
    >
      <PageBreadcrumb
        items={[
          { label: t("modules.nav.home"), to: "/dashboard/home" },
          { label: t("modules.export.title"), to: "/dashboard/operations/export" },
          { label: t("modules.export.shipperBooking"), to: BOOKING_BASE },
          { label: t("shipperBookingsImport.title") },
        ]}
      />
      <h2 id="shipper-bookings-import-heading" className="sr-only">
        {t("shipperBookingsImport.title")}
      </h2>

      <ImportSpecGroup
        title={t("shipperBookingsImport.requiredSection")}
        cols={REQUIRED_COLS}
        required
        i18nPrefix="shipperBookingsImport"
        t={t}
      />
      <ImportSpecGroup
        title={t("shipperBookingsImport.optionalSection")}
        cols={OPTIONAL_COLS}
        required={false}
        i18nPrefix="shipperBookingsImport"
        t={t}
      />

      <div className="import-row">
        <label className={`btn btn--primary import-file-label${busy ? " import-file-label--busy" : ""}`}>
          {busy ? t("shipperBookingsImport.busy") : t("shipperBookingsImport.chooseFile")}
          <input type="file" accept=".xlsx,.xls" className="sr-only" onChange={handleFile} disabled={busy} />
        </label>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => void handleDownloadTemplate()}
          disabled={downloadingTemplate || busy}
        >
          {downloadingTemplate ? t("shipperBookingsImport.busy") : t("shipperBookingsImport.xlsxTemplate")}
        </button>
        <Link to={BOOKING_BASE} className="btn btn--ghost">
          {t("shipperBookingsImport.back")}
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
            {t("shipperBookingsImport.previewSummary", {
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
                    <th>{t("shipperBookingsImport.thRow")}</th>
                    <th>{t("shipperBookingsImport.thBooking")}</th>
                    <th>{t("shipperBookingsImport.thLine")}</th>
                    <th>{t("shipperBookingsImport.thErrors")}</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((row) => (
                    <tr key={row.rowNumber}>
                      <td>{row.rowNumber}</td>
                      <td>
                        <span className="order-code">{row.bookingReference}</span>
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
                {busy
                  ? t("shipperBookingsImport.busy")
                  : t("backgroundJobs.queueImport", { count: preview.valid })}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
