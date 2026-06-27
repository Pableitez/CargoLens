import { Link, Navigate, useParams } from "react-router-dom";
import { PageBreadcrumb } from "../../components/PageBreadcrumb.jsx";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { TradeMastersImportPanel } from "./TradeMastersImportPanel";
import { TRADE_MASTERS_IMPORT_HUB, tradeMastersImportPath } from "./tradeMastersImportUtils";
import type { TradeMastersImportKind } from "../../api/tradeMastersImport";

const SLUG_TO_KIND: Record<string, TradeMastersImportKind> = {
  parties: "parties",
  facilities: "facilities",
  "related-parties": "related_parties",
  "related-facilities": "related_facilities",
};

export function DashboardTradeMastersImport() {
  const { t } = useAppTranslation();
  const { kind: kindSlug } = useParams<{ kind: string }>();
  const kind = kindSlug ? SLUG_TO_KIND[kindSlug] : undefined;

  if (!kind) {
    return <Navigate to={TRADE_MASTERS_IMPORT_HUB} replace />;
  }

  return (
    <section
      className="panel panel--trade-setup panel--tm-import-page"
      aria-labelledby="trade-masters-import-heading"
    >
      <PageBreadcrumb
        items={[
          { label: t("modules.nav.home"), to: "/dashboard/home" },
          { label: t("parties.profileBreadcrumb"), to: "/dashboard/clients/parties" },
          { label: t("tradeMastersImport.hubTitle"), to: TRADE_MASTERS_IMPORT_HUB },
          { label: t(`tradeMastersImport.kind.${kind}.title`) },
        ]}
      />

      <div className="tm-import-page__back">
        <Link to={TRADE_MASTERS_IMPORT_HUB} className="btn btn--ghost btn--sm">
          {t("tradeMastersImport.hubBack")}
        </Link>
      </div>

      <TradeMastersImportPanel kind={kind} />
    </section>
  );
}

export { tradeMastersImportPath, TRADE_MASTERS_IMPORT_HUB };
