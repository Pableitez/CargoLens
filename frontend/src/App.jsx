import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { CommandPalette } from "./components/CommandPalette.jsx";
import { RouteRecentHook } from "./components/RouteRecentHook.jsx";
import { RouteScrollToTop } from "./components/RouteScrollToTop.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { StaffRoute } from "./pages/dashboard/StaffRoute.tsx";
import { I18nDocumentHead } from "./components/I18nDocumentHead.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { RouteFallback } from "./components/RouteFallback.jsx";
import { MODULE_PLACEHOLDER_ROUTES } from "./modules/shared/modulePages.tsx";

const HomePage = lazy(() => import("./pages/HomePage.jsx").then((m) => ({ default: m.HomePage })));
const LoginPage = lazy(() => import("./pages/LoginPage.jsx").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() =>
  import("./pages/RegisterPage.jsx").then((m) => ({ default: m.RegisterPage }))
);
const PrivacyPolicyPage = lazy(() =>
  import("./pages/PrivacyPolicyPage.jsx").then((m) => ({ default: m.PrivacyPolicyPage }))
);
const TermsOfServicePage = lazy(() =>
  import("./pages/TermsOfServicePage.jsx").then((m) => ({ default: m.TermsOfServicePage }))
);
const DashboardLayout = lazy(() =>
  import("./pages/dashboard/DashboardLayout.jsx").then((m) => ({ default: m.DashboardLayout }))
);
const DashboardHome = lazy(() =>
  import("./pages/dashboard/DashboardHome.jsx").then((m) => ({ default: m.DashboardHome }))
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage.jsx").then((m) => ({ default: m.NotFoundPage }))
);
const HowItWorksPage = lazy(() =>
  import("./pages/HowItWorksPage.jsx").then((m) => ({ default: m.HowItWorksPage }))
);
const ChangelogPage = lazy(() =>
  import("./pages/ChangelogPage.jsx").then((m) => ({ default: m.ChangelogPage }))
);
const DashboardOrderDetail = lazy(() =>
  import("./features/orders/DashboardOrderDetail.tsx").then((m) => ({
    default: m.DashboardOrderDetail,
  }))
);
const DashboardTradeSetup = lazy(() =>
  import("./features/export/DashboardTradeSetup.tsx").then((m) => ({ default: m.DashboardTradeSetup }))
);
const DashboardFacilities = lazy(() =>
  import("./features/export/DashboardFacilities.tsx").then((m) => ({ default: m.DashboardFacilities }))
);
const DashboardPartyProfile = lazy(() =>
  import("./features/export/DashboardPartyProfile.tsx").then((m) => ({ default: m.DashboardPartyProfile }))
);
const DashboardRelationships = lazy(() =>
  import("./features/export/DashboardRelationships.tsx").then((m) => ({
    default: m.DashboardRelationships,
  }))
);
const DashboardTradeMastersImportHub = lazy(() =>
  import("./features/export/DashboardTradeMastersImportHub.tsx").then((m) => ({
    default: m.DashboardTradeMastersImportHub,
  }))
);
const DashboardTradeMastersImport = lazy(() =>
  import("./features/export/DashboardTradeMastersImport.tsx").then((m) => ({
    default: m.DashboardTradeMastersImport,
  }))
);
const DashboardOrders = lazy(() =>
  import("./features/orders/DashboardOrders.tsx").then((m) => ({ default: m.DashboardOrders }))
);
const DashboardOrdersImport = lazy(() =>
  import("./features/orders/DashboardOrdersImport.tsx").then((m) => ({
    default: m.DashboardOrdersImport,
  }))
);
const DashboardShipperBookings = lazy(() =>
  import("./features/shipperBookings/DashboardShipperBookings.tsx").then((m) => ({
    default: m.DashboardShipperBookings,
  }))
);
const DashboardShipperBookingDetail = lazy(() =>
  import("./features/shipperBookings/DashboardShipperBookingDetail.tsx").then((m) => ({
    default: m.DashboardShipperBookingDetail,
  }))
);
const DashboardShipperBookingsImport = lazy(() =>
  import("./features/shipperBookings/DashboardShipperBookingsImport.tsx").then((m) => ({
    default: m.DashboardShipperBookingsImport,
  }))
);
const DashboardCarrierBookings = lazy(() =>
  import("./features/carrierBookings/DashboardCarrierBookings.tsx").then((m) => ({
    default: m.DashboardCarrierBookings,
  }))
);
const DashboardCarrierBookingNew = lazy(() =>
  import("./features/carrierBookings/DashboardCarrierBookingNew.tsx").then((m) => ({
    default: m.DashboardCarrierBookingNew,
  }))
);
const DashboardCarrierBookingDetail = lazy(() =>
  import("./features/carrierBookings/DashboardCarrierBookingDetail.tsx").then((m) => ({
    default: m.DashboardCarrierBookingDetail,
  }))
);
const DashboardMessages = lazy(() =>
  import("./features/messages/DashboardMessages.jsx").then((m) => ({ default: m.DashboardMessages }))
);
const DashboardOperationalFinanceHub = lazy(() =>
  import("./modules/shared/modulePages.tsx").then((m) => ({ default: m.DashboardOperationalFinanceHub }))
);
const DashboardTasksHub = lazy(() =>
  import("./modules/shared/modulePages.tsx").then((m) => ({ default: m.DashboardTasksHub }))
);
const OperationsIndexPage = lazy(() =>
  import("./modules/shared/modulePages.tsx").then((m) => ({ default: m.OperationsIndexPage }))
);
const DashboardExportHub = lazy(() =>
  import("./modules/shared/modulePages.tsx").then((m) => ({ default: m.DashboardExportHub }))
);
const DashboardTransportHub = lazy(() =>
  import("./modules/shared/modulePages.tsx").then((m) => ({ default: m.DashboardTransportHub }))
);
const DashboardWarehouseHub = lazy(() =>
  import("./modules/shared/modulePages.tsx").then((m) => ({ default: m.DashboardWarehouseHub }))
);
const DashboardImportHub = lazy(() =>
  import("./modules/shared/modulePages.tsx").then((m) => ({ default: m.DashboardImportHub }))
);
const DashboardDocumentsHub = lazy(() =>
  import("./modules/shared/modulePages.tsx").then((m) => ({ default: m.DashboardDocumentsHub }))
);
const DashboardInsightsHub = lazy(() =>
  import("./modules/shared/modulePages.tsx").then((m) => ({ default: m.DashboardInsightsHub }))
);
const DashboardSettingsHub = lazy(() =>
  import("./modules/shared/modulePages.tsx").then((m) => ({ default: m.DashboardSettingsHub }))
);
const ModulePlaceholderByRoute = lazy(() =>
  import("./modules/shared/modulePages.tsx").then((m) => ({ default: m.ModulePlaceholderByRoute }))
);

function RedirectClientToParty() {
  const { clientId } = useParams();
  return <Navigate to={`/dashboard/clients/parties/${clientId}`} replace />;
}

function RedirectLegacyPartyProfile() {
  const { partyId } = useParams();
  return <Navigate to={`/dashboard/clients/parties/${partyId}`} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/track" element={<Navigate to="/" replace />} />
      <Route path="/vessels" element={<Navigate to="/" replace />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />
      <Route path="/how-it-works" element={<Navigate to="/how-it-works/workspace" replace />} />
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
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<DashboardHome />} />
        <Route path="tracking/overview" element={<Navigate to="/dashboard/home" replace />} />
        <Route path="overview" element={<Navigate to="/dashboard/home" replace />} />
        <Route path="tracking" element={<Navigate to="/dashboard/home" replace />} />
        <Route path="track" element={<Navigate to="/dashboard/home" replace />} />
        <Route path="list" element={<Navigate to="/dashboard/home" replace />} />
        <Route path="add" element={<Navigate to="/dashboard/home" replace />} />
        <Route path="import" element={<Navigate to="/dashboard/home" replace />} />
        <Route path="activity" element={<Navigate to="/dashboard/home" replace />} />
        <Route path="attention" element={<Navigate to="/dashboard/home" replace />} />
        <Route
          path="operational-finance"
          element={
            <StaffRoute>
              <DashboardOperationalFinanceHub />
            </StaffRoute>
          }
        />
        <Route
          path="tasks"
          element={
            <StaffRoute>
              <DashboardTasksHub />
            </StaffRoute>
          }
        />
        <Route
          path="operations"
          element={
            <StaffRoute>
              <OperationsIndexPage />
            </StaffRoute>
          }
        />
        <Route
          path="operations/export"
          element={
            <StaffRoute>
              <DashboardExportHub />
            </StaffRoute>
          }
        />
        <Route
          path="operations/export/trade-setup"
          element={<Navigate to="/dashboard/clients/parties" replace />}
        />
        <Route path="trade-setup" element={<DashboardTradeSetup />} />
        <Route path="trade-setup/facilities" element={<DashboardFacilities />} />
        <Route path="trade-setup/parties/:partyId" element={<DashboardPartyProfile />} />
        <Route
          path="clients/parties"
          element={
            <StaffRoute>
              <DashboardTradeSetup />
            </StaffRoute>
          }
        />
        <Route
          path="clients/parties/:partyId"
          element={
            <StaffRoute>
              <DashboardPartyProfile />
            </StaffRoute>
          }
        />
        <Route
          path="clients/facilities"
          element={
            <StaffRoute>
              <DashboardFacilities />
            </StaffRoute>
          }
        />
        <Route
          path="clients/relationships"
          element={
            <StaffRoute>
              <DashboardRelationships />
            </StaffRoute>
          }
        />
        <Route path="clients/party-relationships" element={<Navigate to="../relationships" replace />} />
        <Route path="clients/facility-relationships" element={<Navigate to="../relationships" replace />} />
        <Route
          path="clients/trade-masters/import"
          element={
            <StaffRoute>
              <DashboardTradeMastersImportHub />
            </StaffRoute>
          }
        />
        <Route
          path="clients/trade-masters/import/:kind"
          element={
            <StaffRoute>
              <DashboardTradeMastersImport />
            </StaffRoute>
          }
        />
        <Route path="clients/trade-setup" element={<Navigate to="/dashboard/clients/parties" replace />} />
        <Route
          path="clients/trade-setup/facilities"
          element={<Navigate to="/dashboard/clients/facilities" replace />}
        />
        <Route path="clients/trade-setup/parties/:partyId" element={<RedirectLegacyPartyProfile />} />
        <Route
          path="operations/export/order/import"
          element={
            <StaffRoute>
              <DashboardOrdersImport />
            </StaffRoute>
          }
        />
        <Route path="operations/export/order/:id" element={<DashboardOrderDetail />} />
        <Route path="operations/export/order" element={<DashboardOrders />} />
        <Route
          path="operations/export/shipper-booking/import"
          element={
            <StaffRoute>
              <DashboardShipperBookingsImport />
            </StaffRoute>
          }
        />
        <Route path="operations/export/shipper-booking/:id" element={<DashboardShipperBookingDetail />} />
        <Route path="operations/export/shipper-booking" element={<DashboardShipperBookings />} />
        <Route
          path="operations/transport"
          element={
            <StaffRoute>
              <DashboardTransportHub />
            </StaffRoute>
          }
        />
        <Route
          path="operations/transport/carrier-booking/new/manual"
          element={
            <StaffRoute>
              <DashboardCarrierBookingDetail />
            </StaffRoute>
          }
        />
        <Route
          path="operations/transport/carrier-booking/new/from-sb"
          element={
            <StaffRoute>
              <DashboardCarrierBookingDetail />
            </StaffRoute>
          }
        />
        <Route
          path="operations/transport/carrier-booking/new"
          element={
            <StaffRoute>
              <DashboardCarrierBookingNew />
            </StaffRoute>
          }
        />
        <Route path="operations/transport/carrier-booking/:id" element={<DashboardCarrierBookingDetail />} />
        <Route path="operations/transport/carrier-booking" element={<DashboardCarrierBookings />} />
        <Route
          path="operations/warehouse"
          element={
            <StaffRoute>
              <DashboardWarehouseHub />
            </StaffRoute>
          }
        />
        <Route
          path="operations/import"
          element={
            <StaffRoute>
              <DashboardImportHub />
            </StaffRoute>
          }
        />
        <Route
          path="documents"
          element={
            <StaffRoute>
              <DashboardDocumentsHub />
            </StaffRoute>
          }
        />
        <Route
          path="insights"
          element={
            <StaffRoute>
              <DashboardInsightsHub />
            </StaffRoute>
          }
        />
        <Route path="messages" element={<DashboardMessages />} />
        <Route
          path="insights/customer-messaging-service"
          element={<Navigate to="/dashboard/messages" replace />}
        />
        <Route
          path="settings"
          element={
            <StaffRoute>
              <DashboardSettingsHub />
            </StaffRoute>
          }
        />
        {MODULE_PLACEHOLDER_ROUTES.map(({ path, titleKey, parent }) => (
          <Route
            key={path}
            path={path}
            element={
              <StaffRoute>
                <ModulePlaceholderByRoute titleKey={titleKey} parent={parent} />
              </StaffRoute>
            }
          />
        ))}
        <Route path="clients/new" element={<Navigate to="/dashboard/clients/parties?add=party" replace />} />
        <Route path="clients" element={<Navigate to="/dashboard/clients/parties" replace />} />
        <Route
          path="clients/:clientId"
          element={
            <StaffRoute>
              <RedirectClientToParty />
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
