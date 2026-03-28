import { DashboardPageSkeleton } from "./DashboardPageSkeleton.jsx";

// Esqueleto a pantalla completa mientras cargan rutas lazy (mejor que solo un spinner).
export function RouteFallback() {
  return (
    <div className="route-fallback route-fallback--skeleton">
      <DashboardPageSkeleton rows={5} />
    </div>
  );
}
