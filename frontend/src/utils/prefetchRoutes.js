// Precarga de chunks al hover (best-effort; duplicados no importan).
const loaders = {
  "/": () => import("../pages/HomePage.jsx"),
  "/track": () => import("../pages/TrackPage.jsx"),
  "/privacy": () => import("../pages/PrivacyPolicyPage.jsx"),
  "/terms": () => import("../pages/TermsOfServicePage.jsx"),
  "/vessels": () => import("../pages/VesselsPage.jsx"),
  "/login": () => import("../pages/LoginPage.jsx"),
  "/register": () => import("../pages/RegisterPage.jsx"),
  "/how-it-works": () => import("../pages/HowItWorksPage.jsx"),
  "/how-it-works/track": () => import("../pages/HowItWorksPage.jsx"),
  "/changelog": () => import("../pages/ChangelogPage.jsx"),
  "/dashboard": () => import("../pages/dashboard/DashboardLayout.jsx"),
  "/dashboard/home": () => import("../pages/dashboard/DashboardHome.jsx"),
  "/dashboard/tracking/overview": () => import("../pages/dashboard/DashboardOverview.jsx"),
  "/dashboard/overview": () => import("../pages/dashboard/DashboardOverview.jsx"),
  "/dashboard/clients": () => import("../features/export/DashboardTradeSetup.tsx"),
  "/dashboard/add": () => import("../pages/dashboard/DashboardAddContainer.jsx"),
  "/dashboard/import": () => import("../pages/dashboard/DashboardImport.jsx"),
  "/dashboard/list": () => import("../pages/dashboard/DashboardSavedList.jsx"),
  "/dashboard/activity": () => import("../pages/dashboard/DashboardActivity.jsx"),
  "/dashboard/attention": () => import("../pages/dashboard/DashboardAttention.jsx"),
  "/dashboard/tracking": () => import("../modules/shared/modulePages.tsx"),
  "/dashboard/documents": () => import("../modules/shared/modulePages.tsx"),
  "/dashboard/insights": () => import("../modules/shared/modulePages.tsx"),
  "/dashboard/messages": () => import("../features/messages/DashboardMessages.jsx"),
  "/dashboard/operations": () => import("../modules/shared/modulePages.tsx"),
  "/dashboard/operations/export": () => import("../modules/shared/modulePages.tsx"),
  "/dashboard/clients/parties": () => import("../features/export/DashboardTradeSetup.tsx"),
  "/dashboard/clients/facilities": () => import("../features/export/DashboardFacilities.tsx"),
  "/dashboard/trade-setup": () => import("../features/export/DashboardTradeSetup.tsx"),
  "/dashboard/operations/export/trade-setup": () => import("../features/export/DashboardTradeSetup.tsx"),
  "/dashboard/operations/export/order/import": () => import("../features/orders/DashboardOrdersImport.tsx"),
  "/dashboard/operations/export/shipper-booking": () =>
    import("../features/shipperBookings/DashboardShipperBookings.tsx"),
  "/dashboard/operations/export/shipper-booking/import": () =>
    import("../features/shipperBookings/DashboardShipperBookingsImport.tsx"),
  "/dashboard/operations/transport": () => import("../modules/shared/modulePages.tsx"),
  "/dashboard/operations/warehouse": () => import("../modules/shared/modulePages.tsx"),
  "/dashboard/operations/import": () => import("../modules/shared/modulePages.tsx"),
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
