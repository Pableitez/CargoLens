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
  "/dashboard/overview": () => import("../pages/dashboard/DashboardOverview.jsx"),
  "/dashboard/clients": () => import("../pages/dashboard/DashboardClients.jsx"),
  "/dashboard/add": () => import("../pages/dashboard/DashboardAddContainer.jsx"),
  "/dashboard/import": () => import("../pages/dashboard/DashboardImport.jsx"),
  "/dashboard/list": () => import("../pages/dashboard/DashboardSavedList.jsx"),
  "/dashboard/activity": () => import("../pages/dashboard/DashboardActivity.jsx"),
  "/dashboard/attention": () => import("../pages/dashboard/DashboardAttention.jsx"),
  "/dashboard/settings": () => import("../pages/dashboard/DashboardSettings.jsx"),
};

export function prefetchRoute(pathname) {
  const path = pathname.split("?")[0].replace(/\/$/, "") || "/";
  const load = loaders[path];
  if (load) {
    load().catch(() => {});
  }
}
