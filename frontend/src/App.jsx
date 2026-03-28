import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { DASHBOARD_OVERVIEW_PATH } from "./config/paths.js";
import { CommandPalette } from "./components/CommandPalette.jsx";
import { RouteRecentHook } from "./components/RouteRecentHook.jsx";
import { RouteScrollToTop } from "./components/RouteScrollToTop.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { StaffRoute } from "./pages/dashboard/StaffRoute.jsx";
import { I18nDocumentHead } from "./components/I18nDocumentHead.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { RouteFallback } from "./components/RouteFallback.jsx";

const HomePage = lazy(() => import("./pages/HomePage.jsx").then((m) => ({ default: m.HomePage })));
const LoginPage = lazy(() => import("./pages/LoginPage.jsx").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage.jsx").then((m) => ({ default: m.RegisterPage })));
const VesselsPage = lazy(() => import("./pages/VesselsPage.jsx").then((m) => ({ default: m.VesselsPage })));
const PrivacyPolicyPage = lazy(() =>
  import("./pages/PrivacyPolicyPage.jsx").then((m) => ({ default: m.PrivacyPolicyPage }))
);
const TermsOfServicePage = lazy(() =>
  import("./pages/TermsOfServicePage.jsx").then((m) => ({ default: m.TermsOfServicePage }))
);
const DashboardLayout = lazy(() =>
  import("./pages/dashboard/DashboardLayout.jsx").then((m) => ({ default: m.DashboardLayout }))
);
const DashboardOverview = lazy(() =>
  import("./pages/dashboard/DashboardOverview.jsx").then((m) => ({ default: m.DashboardOverview }))
);
const DashboardClients = lazy(() =>
  import("./pages/dashboard/DashboardClients.jsx").then((m) => ({ default: m.DashboardClients }))
);
const DashboardAddContainer = lazy(() =>
  import("./pages/dashboard/DashboardAddContainer.jsx").then((m) => ({ default: m.DashboardAddContainer }))
);
const DashboardImport = lazy(() =>
  import("./pages/dashboard/DashboardImport.jsx").then((m) => ({ default: m.DashboardImport }))
);
const DashboardSavedList = lazy(() =>
  import("./pages/dashboard/DashboardSavedList.jsx").then((m) => ({ default: m.DashboardSavedList }))
);
const DashboardActivity = lazy(() =>
  import("./pages/dashboard/DashboardActivity.jsx").then((m) => ({ default: m.DashboardActivity }))
);
const DashboardAttention = lazy(() =>
  import("./pages/dashboard/DashboardAttention.jsx").then((m) => ({ default: m.DashboardAttention }))
);
const DashboardSettings = lazy(() =>
  import("./pages/dashboard/DashboardSettings.jsx").then((m) => ({ default: m.DashboardSettings }))
);
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx").then((m) => ({ default: m.NotFoundPage })));
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage.jsx").then((m) => ({ default: m.HowItWorksPage })));
const ChangelogPage = lazy(() => import("./pages/ChangelogPage.jsx").then((m) => ({ default: m.ChangelogPage })));

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />
      <Route path="/vessels" element={<VesselsPage />} />
      <Route path="/how-it-works" element={<Navigate to="/how-it-works/track" replace />} />
      <Route path="/how-it-works/:section" element={<HowItWorksPage />} />
      <Route path="/changelog" element={<ChangelogPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<DashboardOverview />} />
        <Route path="track" element={<Navigate to={DASHBOARD_OVERVIEW_PATH} replace />} />
        <Route
          path="clients"
          element={
            <StaffRoute>
              <DashboardClients />
            </StaffRoute>
          }
        />
        <Route
          path="add"
          element={
            <StaffRoute>
              <DashboardAddContainer />
            </StaffRoute>
          }
        />
        <Route
          path="import"
          element={
            <StaffRoute>
              <DashboardImport />
            </StaffRoute>
          }
        />
        <Route path="list" element={<DashboardSavedList />} />
        <Route
          path="activity"
          element={
            <StaffRoute>
              <DashboardActivity />
            </StaffRoute>
          }
        />
        <Route
          path="attention"
          element={
            <StaffRoute>
              <DashboardAttention />
            </StaffRoute>
          }
        />
        <Route
          path="settings"
          element={
            <StaffRoute>
              <DashboardSettings />
            </StaffRoute>
          }
        />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export function App() {
  const location = useLocation();
  return (
    <>
      <RouteRecentHook />
      <I18nDocumentHead />
      <RouteScrollToTop />
      <CommandPalette />
      <ErrorBoundary key={location.pathname}>
        <Suspense fallback={<RouteFallback />}>
          <AppRoutes />
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
