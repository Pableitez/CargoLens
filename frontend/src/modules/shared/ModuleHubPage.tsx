import { Link } from "react-router-dom";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import type { ModuleGroupDef, SubmoduleDef } from "../../config/moduleRegistry";

type ModuleHubPageProps = {
  titleKey: string;
  leadKey: string;
  submodules: SubmoduleDef[];
  legacyLinks?: SubmoduleDef[];
};

export function ModuleHubPage({ titleKey, leadKey, submodules, legacyLinks }: ModuleHubPageProps) {
  const { t } = useAppTranslation();

  return (
    <section className="panel panel--dash-form" aria-labelledby="module-hub-heading">
      <header className="panel__head">
        <h1 id="module-hub-heading" className="panel__title">
          {t(titleKey)}
        </h1>
        <p className="panel__lead">{t(leadKey)}</p>
        <p className="panel__meta">{t("modules.hubLead")}</p>
      </header>

      <ul className="module-hub-grid">
        {submodules.map((item) => (
          <li key={item.id} className="module-hub-card">
            <Link to={item.route} className="module-hub-card__link">
              <span className="module-hub-card__title">{t(item.i18nKey)}</span>
              {!item.implemented ? (
                <span className="module-hub-card__badge">{t("modules.comingSoon")}</span>
              ) : null}
              <span className="module-hub-card__cta">{t("modules.openModule")}</span>
            </Link>
          </li>
        ))}
      </ul>

      {legacyLinks?.length ? (
        <div className="module-hub-legacy">
          <h2 className="module-hub-legacy__title">{t("modules.legacy.title")}</h2>
          <ul className="module-hub-grid module-hub-grid--compact">
            {legacyLinks.map((item) => (
              <li key={item.id} className="module-hub-card module-hub-card--muted">
                <Link to={item.route} className="module-hub-card__link">
                  <span className="module-hub-card__title">{t(item.i18nKey)}</span>
                  <span className="module-hub-card__cta">{t("modules.openModule")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

type ModulePlaceholderPageProps = {
  titleKey: string;
  parent?: ModuleGroupDef;
};

export function ModulePlaceholderPage({ titleKey, parent }: ModulePlaceholderPageProps) {
  const { t } = useAppTranslation();

  return (
    <section className="panel panel--dash-form" aria-labelledby="module-placeholder-heading">
      <header className="panel__head">
        {parent ? (
          <p className="panel__meta">
            <Link to={parent.route}>{t(parent.i18nTitleKey)}</Link>
          </p>
        ) : null}
        <h1 id="module-placeholder-heading" className="panel__title">
          {t(titleKey)}
        </h1>
        <p className="panel__lead">{t("modules.comingSoon")}</p>
      </header>
    </section>
  );
}

export function OperationsIndexPage() {
  const { t } = useAppTranslation();

  return (
    <section className="panel panel--dash-form" aria-labelledby="operations-index-heading">
      <header className="panel__head">
        <h1 id="operations-index-heading" className="panel__title">
          {t("modules.operations.indexTitle")}
        </h1>
        <p className="panel__lead">{t("modules.operations.indexLead")}</p>
      </header>
      <ul className="module-hub-grid">
        {[
          { id: "export", route: "/dashboard/operations/export", i18nKey: "modules.export.title" },
          { id: "transport", route: "/dashboard/operations/transport", i18nKey: "modules.transport.title" },
          { id: "warehouse", route: "/dashboard/operations/warehouse", i18nKey: "modules.warehouse.title" },
          { id: "import", route: "/dashboard/operations/import", i18nKey: "modules.import.title" },
        ].map((item) => (
          <li key={item.id} className="module-hub-card">
            <Link to={item.route} className="module-hub-card__link">
              <span className="module-hub-card__title">{t(item.i18nKey)}</span>
              <span className="module-hub-card__cta">{t("modules.openModule")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
