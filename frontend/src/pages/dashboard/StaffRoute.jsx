import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";

// Portal cliente: solo resumen + lista; rutas solo staff redirigen aquí.
export function StaffRoute({ children }) {
  const { user } = useAuth();
  if (user?.isClientPortal) {
    return <Navigate to="/dashboard/list" replace />;
  }
  return children;
}
