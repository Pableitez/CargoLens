import { useState } from "react";
import { DataSourceBadge } from "./DataSourceBadge.jsx";
import { StatusBadge } from "./StatusBadge.jsx";
import { formatDateTime } from "../utils/format.js";
import { useTranslation } from "../i18n/LanguageContext.jsx";

export function ShipmentHeader({ data, workspaceSavedRow = null, onWorkspaceLifecycleChange }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);

  function copyId() {
    const n = data?.containerNumber;
    if (!n || !navigator.clipboard?.writeText) return;
    void navigator.clipboard.writeText(n).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const isDemo = data.source === "mock";

  return (
    <div className="shipment-header">
      {isDemo && (
        <p className="shipment-header__demo-banner" role="status">
          {t("components.shipmentHeader.demoBanner")}
        </p>
      )}
      {workspaceSavedRow && onWorkspaceLifecycleChange ? (
        <div className="shipment-header__workspace" role="group" aria-label={t("track.workspaceLifecycleAria")}>
          <p className="shipment-header__workspace-hint">{t("track.workspaceLifecycleHint")}</p>
          <button
            type="button"
            className="btn btn--secondary btn--sm shipment-header__workspace-btn"
            disabled={lifecycleBusy}
            onClick={async () => {
              setLifecycleBusy(true);
              try {
                await onWorkspaceLifecycleChange(workspaceSavedRow.id, {
                  lifecycleStatus: workspaceSavedRow.lifecycleStatus === "completed" ? "active" : "completed",
                });
              } finally {
                setLifecycleBusy(false);
              }
            }}
          >
            {workspaceSavedRow.lifecycleStatus === "completed"
              ? t("dashboardPage.list.reopenActive")
              : t("dashboardPage.list.markCompleted")}
          </button>
        </div>
      ) : null}
      <div className="shipment-header__top">
        <div className="shipment-header__id-block">
          <span className="shipment-header__label">{t("components.shipmentHeader.container")}</span>
          <div className="shipment-header__id-row">
            <span className="shipment-header__id">{data.containerNumber}</span>
            <button
              type="button"
              className="shipment-header__copy"
              onClick={copyId}
              aria-label={t("components.shipmentHeader.copyAria")}
            >
              {copied ? t("components.shipmentHeader.copied") : t("components.shipmentHeader.copy")}
            </button>
          </div>
        </div>
        <div className="shipment-header__badges">
          <DataSourceBadge source={data.source} />
          <StatusBadge code={data.status} label={data.statusLabel} />
        </div>
      </div>
      {data.updatedAt && (
        <p className="shipment-header__refreshed" role="status">
          {t("components.shipmentHeader.refreshed")} {formatDateTime(data.updatedAt)}
        </p>
      )}
      <div className="shipment-header__eta">
        <div className="eta-block">
          <span className="eta-block__label">{t("components.shipmentHeader.etaDest")}</span>
          <span className="eta-block__port">{data.eta?.port}</span>
          {data.eta?.locode && (
            <span className="eta-block__locode">{data.eta.locode}</span>
          )}
        </div>
        <div className="eta-block eta-block--date">
          <span className="eta-block__label">{t("components.shipmentHeader.etaWhen")}</span>
          <span className="eta-block__when">{formatDateTime(data.eta?.date)}</span>
        </div>
        <div className="shipment-header__carrier">
          <span className="shipment-header__carrier-label">{t("components.shipmentHeader.carrier")}</span>
          <span className="shipment-header__carrier-name">{data.carrier?.name}</span>
        </div>
      </div>
      <p className="shipment-header__summary">{data.summary}</p>
    </div>
  );
}
