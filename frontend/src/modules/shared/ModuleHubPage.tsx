import { Link } from "react-router-dom";
import { PageBreadcrumb } from "../../components/PageBreadcrumb.jsx";
import { OPERATIONS_MODULES } from "../../config/moduleRegistry";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import type { ModuleGroupDef, SubmoduleDef } from "../../config/moduleRegistry";

type BreadcrumbItem = { label: string; to?: string };

type ModuleHubPageProps = {
  titleKey?: string;
  leadKey?: string;
  submodules: SubmoduleDef[];
  extraLinks?: SubmoduleDef[];
  groupId?: string;
  breadcrumbs?: BreadcrumbItem[];
};

function moduleIconLabel(i18nKey: string, title: string) {
  const leaf = i18nKey.split(".").pop() ?? "";
  if (leaf.length <= 3) return leaf.slice(0, 3).toUpperCase();
  const words = title.trim().split(/\s+/);
  if (words.length >= 2) return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
  return title.slice(0, 2).toUpperCase();
}

function ModuleHubCard({
  item,
  t,
  muted = false,
  primary = false,
}: {
  item: SubmoduleDef;
  t: (key: string) => string;
  muted?: boolean;
  primary?: boolean;
}) {
  const title = t(item.i18nKey);
  const implemented = Boolean(item.implemented);

  const cardClass = [
    "module-hub-card",
    muted ? "module-hub-card--muted" : "",
    primary ? "module-hub-card--primary" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const inner = (
    <>
      <div className="module-hub-card__head">
        <span className="module-hub-card__icon" aria-hidden>
          {moduleIconLabel(item.i18nKey, title)}
        </span>
        <div className="module-hub-card__text">
          <span className="module-hub-card__title">{title}</span>
        </div>
      </div>
      <div className="module-hub-card__foot">
        {implemented ? (
          <span className="module-hub-card__badge module-hub-card__badge--live">
            {t("modules.statusLive")}
          </span>
        ) : (
          <span className="module-hub-card__badge module-hub-card__badge--soon">
            {t("modules.comingSoon")}
          </span>
        )}
        <span className="module-hub-card__cta">
          {implemented ? `${t("modules.openModule")} →` : t("modules.comingSoon")}
        </span>
      </div>
    </>
  );

  return (
    <li className={cardClass}>
      {implemented ? (
        <Link to={item.route} className="module-hub-card__link">
          {inner}
        </Link>
      ) : (
        <div className="module-hub-card__link module-hub-card__link--disabled" aria-disabled="true">
          {inner}
        </div>
      )}
    </li>
  );
}

export function ModuleHubPage({ submodules, extraLinks, groupId, breadcrumbs }: ModuleHubPageProps) {
  const { t } = useAppTranslation();
  const panelClass = groupId
    ? `panel panel--dash-form panel--module-hub panel--module-hub--${groupId}`
    : "panel panel--dash-form panel--module-hub";

  return (
    <section className={panelClass} aria-labelledby="module-hub-heading">
      {breadcrumbs?.length ? <PageBreadcrumb items={breadcrumbs} /> : null}
      <h1 id="module-hub-heading" className="sr-only">
        {t("modules.hubAria")}
      </h1>

      {submodules.length > 0 ? (
        <ul className="module-hub-grid">
          {submodules.map((item) => (
            <ModuleHubCard key={item.id} item={item} t={t} primary={Boolean(item.implemented)} />
          ))}
        </ul>
      ) : (
        <div className="trade-setup-empty">
          <p className="trade-setup-empty__title">{t("modules.comingSoon")}</p>
        </div>
      )}

      {extraLinks?.length ? (
        <div className="module-hub-tools">
          <h2 className="module-hub-tools__title">{t("modules.workspaceTools.title")}</h2>
          <ul className="module-hub-grid module-hub-grid--compact">
            {extraLinks.map((item) => (
              <ModuleHubCard key={item.id} item={item} t={t} muted />
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
  const groupId = parent?.id;
  const panelClass = groupId
    ? `panel panel--dash-form panel--module-hub panel--module-hub--${groupId} panel--module-placeholder`
    : "panel panel--dash-form panel--module-hub panel--module-placeholder";

  return (
    <section className={panelClass} aria-labelledby="module-placeholder-heading">
      {parent ? (
        <PageBreadcrumb
          items={[
            { label: t("modules.nav.home"), to: "/dashboard/home" },
            { label: t(parent.i18nTitleKey), to: parent.route },
            { label: t(titleKey) },
          ]}
        />
      ) : null}

      <div className="module-placeholder__card">
        <p className="module-placeholder__eyebrow">{t("modules.comingSoon")}</p>
        <h1 id="module-placeholder-heading" className="sr-only">
          {t(titleKey)}
        </h1>
        {parent ? (
          <Link to={parent.route} className="module-placeholder__back">
            ← {t("modules.backToHub", { module: t(parent.i18nTitleKey) })}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export function OperationsIndexPage() {
  const { t } = useAppTranslation();

  return (
    <section
      className="panel panel--dash-form panel--module-hub panel--module-hub--operations"
      aria-labelledby="operations-index-heading"
    >
      <PageBreadcrumb
        items={[
          { label: t("modules.nav.home"), to: "/dashboard/home" },
          { label: t("modules.operations.indexTitle") },
        ]}
      />
      <h1 id="operations-index-heading" className="sr-only">
        {t("modules.operations.indexTitle")}
      </h1>

      <ul className="module-hub-grid">
        {OPERATIONS_MODULES.map((group) => (
          <li key={group.id} className="module-hub-card module-hub-card--primary">
            <Link to={group.route} className="module-hub-card__link">
              <div className="module-hub-card__head">
                <span className="module-hub-card__icon" aria-hidden>
                  {group.id.slice(0, 2).toUpperCase()}
                </span>
                <div className="module-hub-card__text">
                  <span className="module-hub-card__title">{t(group.i18nTitleKey)}</span>
                </div>
              </div>
              <div className="module-hub-card__foot">
                <span className="module-hub-card__badge module-hub-card__badge--live">
                  {t("modules.hubSubmoduleCount", {
                    count: group.submodules.filter((s) => s.implemented).length,
                    total: group.submodules.length,
                  })}
                </span>
                <span className="module-hub-card__cta">{t("modules.openModule")} →</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
