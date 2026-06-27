import { Link } from "react-router-dom";
import { TradeMastersImportKind } from "../../api/tradeMastersImport";
import { PageBreadcrumb } from "../../components/PageBreadcrumb.jsx";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { tradeMastersImportPath, TRADE_MASTERS_IMPORT_HUB } from "./tradeMastersImportUtils";

const IMPORT_KINDS: TradeMastersImportKind[] = [
  "parties",
  "facilities",
  "related_parties",
  "related_facilities",
];

export function DashboardTradeMastersImportHub() {
  const { t } = useAppTranslation();

  return (
    <section
      className="panel panel--trade-setup panel--tm-import"
      aria-labelledby="trade-masters-import-hub-heading"
    >
      <PageBreadcrumb
        items={[
          { label: t("modules.nav.home"), to: "/dashboard/home" },
          { label: t("parties.profileBreadcrumb"), to: "/dashboard/clients/parties" },
          { label: t("tradeMastersImport.hubTitle") },
        ]}
      />

      <h2 id="trade-masters-import-hub-heading" className="sr-only">
        {t("tradeMastersImport.hubTitle")}
      </h2>

      <div className="tm-import-hub-grid">
        {IMPORT_KINDS.map((kind) => (
          <Link key={kind} to={tradeMastersImportPath(kind)} className="tm-import-hub-card">
            <span className="tm-import-hub-card__eyebrow">
              {t(`tradeMastersImport.kind.${kind}.eyebrow`)}
            </span>
            <span className="tm-import-hub-card__title">{t(`tradeMastersImport.kind.${kind}.title`)}</span>
            <span className="tm-import-hub-card__action">{t("tradeMastersImport.hubOpen")}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export { TRADE_MASTERS_IMPORT_HUB };
