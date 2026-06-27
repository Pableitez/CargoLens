import {
  DOCUMENTS_MODULE,
  INSIGHTS_MODULE,
  OPERATIONS_MODULES,
  SETTINGS_MODULE,
  STAFF_TRACKING_CONTAINER_LINKS,
  TRACKING_LINKS,
  type ModuleGroupDef,
} from "../../config/moduleRegistry";
import { useDashboardWorkspace } from "../../pages/dashboard/DashboardWorkspaceContext.jsx";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { ModuleHubPage, ModulePlaceholderPage, OperationsIndexPage } from "./ModuleHubPage";

export { OperationsIndexPage };

function useModuleBreadcrumbs(group: ModuleGroupDef) {
  const { t } = useAppTranslation();
  const items: { label: string; to?: string }[] = [{ label: t("modules.nav.home"), to: "/dashboard/home" }];
  if (OPERATIONS_MODULES.some((m) => m.id === group.id)) {
    items.push({ label: t("modules.operations.indexTitle"), to: "/dashboard/operations" });
  }
  items.push({ label: t(group.i18nTitleKey) });
  return items;
}

export function DashboardOperationalFinanceHub() {
  const { t } = useAppTranslation();
  return (
    <ModuleHubPage
      groupId="operationalFinance"
      titleKey="modules.operationalFinance.title"
      leadKey="modules.operationalFinance.lead"
      submodules={[]}
      breadcrumbs={[
        { label: t("modules.nav.home"), to: "/dashboard/home" },
        { label: t("modules.operationalFinance.title") },
      ]}
    />
  );
}

export function DashboardTasksHub() {
  const { t } = useAppTranslation();
  return (
    <ModuleHubPage
      groupId="tasks"
      titleKey="modules.tasks.title"
      leadKey="modules.tasks.lead"
      submodules={[]}
      breadcrumbs={[
        { label: t("modules.nav.home"), to: "/dashboard/home" },
        { label: t("modules.tasks.title") },
      ]}
    />
  );
}

export function DashboardTrackingHub() {
  const { isClientPortal } = useDashboardWorkspace();
  const { t } = useAppTranslation();
  return (
    <ModuleHubPage
      groupId="tracking"
      titleKey="modules.tracking.title"
      leadKey="modules.tracking.lead"
      submodules={TRACKING_LINKS}
      extraLinks={isClientPortal ? undefined : STAFF_TRACKING_CONTAINER_LINKS}
      breadcrumbs={[
        { label: t("modules.nav.home"), to: "/dashboard/home" },
        { label: t("modules.tracking.title") },
      ]}
    />
  );
}

function groupHub(group: ModuleGroupDef) {
  return function GroupHub() {
    const breadcrumbs = useModuleBreadcrumbs(group);
    return (
      <ModuleHubPage
        groupId={group.id}
        titleKey={group.i18nTitleKey}
        leadKey={group.i18nLeadKey}
        submodules={group.submodules}
        breadcrumbs={breadcrumbs}
      />
    );
  };
}

export const DashboardExportHub = groupHub(OPERATIONS_MODULES[0]);
export const DashboardTransportHub = groupHub(OPERATIONS_MODULES[1]);
export const DashboardWarehouseHub = groupHub(OPERATIONS_MODULES[2]);
export const DashboardImportHub = groupHub(OPERATIONS_MODULES[3]);
export const DashboardDocumentsHub = groupHub(DOCUMENTS_MODULE);
export const DashboardInsightsHub = groupHub(INSIGHTS_MODULE);
export const DashboardSettingsHub = groupHub(SETTINGS_MODULE);

export type PlaceholderRouteDef = {
  path: string;
  titleKey: string;
  parent: ModuleGroupDef;
};

export function toDashboardRoutePath(fullRoute: string): string {
  const prefix = "/dashboard/";
  if (fullRoute.startsWith(prefix)) return fullRoute.slice(prefix.length);
  return fullRoute.replace(/^\//, "");
}

function collectPlaceholderRoutes(): PlaceholderRouteDef[] {
  const groups = [...OPERATIONS_MODULES, DOCUMENTS_MODULE, INSIGHTS_MODULE];
  return groups.flatMap((group) =>
    group.submodules
      .filter((sub) => !sub.implemented)
      .map((sub) => ({
        path: toDashboardRoutePath(sub.route),
        titleKey: sub.i18nKey,
        parent: group,
      }))
  );
}

export const MODULE_PLACEHOLDER_ROUTES = collectPlaceholderRoutes();

export function ModulePlaceholderByRoute({ titleKey, parent }: { titleKey: string; parent: ModuleGroupDef }) {
  return <ModulePlaceholderPage titleKey={titleKey} parent={parent} />;
}
