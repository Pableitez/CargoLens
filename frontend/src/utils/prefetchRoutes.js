// Precarga de chunks al hover (best-effort; duplicados no importan).
const loaders = {
  "/": () => import("../pages/HomePage.jsx"),
  "/privacy": () => import("../pages/PrivacyPolicyPage.jsx"),
  "/terms": () => import("../pages/TermsOfServicePage.jsx"),
  "/vessels": () => import("../pages/VesselsPage.jsx"),
  "/login": () => import("../pages/LoginPage.jsx"),
  "/register": () => import("../pages/RegisterPage.jsx"),
  "/how-it-works": () => import("../pages/HowItWorksPage.jsx"),
  "/how-it-works/track": () => import("../pages/HowItWorksPage.jsx"),
  "/changelog": () => import("../pages/ChangelogPage.jsx"),
  "/dashboard": () => import("../pages/dashboard/DashboardLayout.jsx"),
  "/dashboard/home": () => import("../pages/dashboard/DashboardOverview.jsx"),
  "/dashboard/overview": () => import("../pages/dashboard/DashboardOverview.jsx"),
  "/dashboard/clients": () => import("../pages/dashboard/DashboardClients.jsx"),
  "/dashboard/add": () => import("../pages/dashboard/DashboardAddContainer.jsx"),
  "/dashboard/import": () => import("../pages/dashboard/DashboardImport.jsx"),
  "/dashboard/list": () => import("../pages/dashboard/DashboardSavedList.jsx"),
  "/dashboard/activity": () => import("../pages/dashboard/DashboardActivity.jsx"),
  "/dashboard/attention": () => import("../pages/dashboard/DashboardAttention.jsx"),
  "/dashboard/settings": () => import("../pages/dashboard/DashboardSettings.jsx"),
  "/dashboard/shipments": () => import("../features/shipments/DashboardShipments.tsx"),
  "/dashboard/cases": () => import("../features/cases/DashboardCases.tsx"),
  "/dashboard/tracking": () => import("../modules/shared/modulePages.tsx"),
  "/dashboard/documents": () => import("../modules/shared/modulePages.tsx"),
  "/dashboard/insights": () => import("../modules/shared/modulePages.tsx"),
  "/dashboard/operations": () => import("../modules/shared/modulePages.tsx"),
  "/dashboard/operations/export": () => import("../modules/shared/modulePages.tsx"),
  "/dashboard/operational-finance": () => import("../modules/shared/modulePages.tsx"),
  "/dashboard/tasks": () => import("../modules/shared/modulePages.tsx"),
};

export function prefetchRoute(pathname) {
  const path = pathname.split("?")[0].replace(/\/$/, "") || "/";
  const load = loaders[path];
  if (load) {
    load().catch(() => {});
  }
}
