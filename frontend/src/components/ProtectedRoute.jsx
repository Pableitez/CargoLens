import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) {
    return (
      <div className="gate-loading">
        <div className="gate-loading__card" role="status" aria-live="polite" aria-busy="true">
          <div className="gate-loading__spinner" aria-hidden />
          <p className="gate-loading__text">Checking your session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  }

  return children;
}
