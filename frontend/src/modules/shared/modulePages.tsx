import {
  DOCUMENTS_MODULE,
  INSIGHTS_MODULE,
  OPERATIONS_MODULES,
  STAFF_WORKSPACE_TOOL_LINKS,
  TRACKING_LINKS,
  type ModuleGroupDef,
} from "../../config/moduleRegistry";
import { useDashboardWorkspace } from "../../pages/dashboard/DashboardWorkspaceContext.jsx";
import { ModuleHubPage, ModulePlaceholderPage, OperationsIndexPage } from "./ModuleHubPage";

export { OperationsIndexPage };

export function DashboardCasesHub() {
  return <ModuleHubPage titleKey="modules.cases.title" leadKey="modules.cases.lead" submodules={[]} />;
}

export function DashboardOperationalFinanceHub() {
  return (
    <ModuleHubPage
      titleKey="modules.operationalFinance.title"
      leadKey="modules.operationalFinance.lead"
      submodules={[]}
    />
  );
}

export function DashboardTasksHub() {
  return <ModuleHubPage titleKey="modules.tasks.title" leadKey="modules.tasks.lead" submodules={[]} />;
}

export function DashboardTrackingHub() {
  const { isClientPortal } = useDashboardWorkspace();
  return (
    <ModuleHubPage
      titleKey="modules.tracking.title"
      leadKey="modules.tracking.lead"
      submodules={TRACKING_LINKS}
      extraLinks={isClientPortal ? undefined : STAFF_WORKSPACE_TOOL_LINKS}
    />
  );
}

function groupHub(group: ModuleGroupDef) {
  return function GroupHub() {
    return (
      <ModuleHubPage
        titleKey={group.i18nTitleKey}
        leadKey={group.i18nLeadKey}
        submodules={group.submodules}
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
    group.submodules.map((sub) => ({
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
