import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

type StaffRouteProps = {
  children: ReactNode;
};

/** Portal cliente: rutas solo staff redirigen al home del workspace. */
export function StaffRoute({ children }: StaffRouteProps) {
  const { user } = useAuth();
  if (user?.isClientPortal) {
    return <Navigate to="/dashboard/home" replace />;
  }
  return children;
}
