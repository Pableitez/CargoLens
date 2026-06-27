import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

type StaffRouteProps = {
  children: ReactNode;
};

/** Portal cliente: solo resumen + lista; rutas solo staff redirigen aquí. */
export function StaffRoute({ children }: StaffRouteProps) {
  const { user } = useAuth();
  if (user?.isClientPortal) {
    return <Navigate to="/dashboard/list" replace />;
  }
  return children;
}
