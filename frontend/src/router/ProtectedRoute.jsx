// src/router/ProtectedRoute.jsx
// Wraps a route and blocks access if the current user's role
// is not in the route's allowed roles list.

import { Navigate } from "react-router-dom";
import { useAuth }  from "../context/AuthContext";
import { ROUTES }   from "./routes";

export default function ProtectedRoute({ children, path }) {
  const { user } = useAuth();

  // Not logged in → redirect to login
  if (!user) return <Navigate to="/login" replace />;

  // Find the route definition
  const route = ROUTES.find((r) => r.path === path);

  // Role not permitted → show access denied
  if (route && !route.roles.includes(user.role)) {
    return (
      <div className="empty-state" style={{ marginTop: 80 }}>
        <div className="empty-icon">🔒</div>
        <div className="empty-text">Access Denied</div>
        <div className="empty-sub">
          Your role <strong>{user.role}</strong> does not have permission for this page.
        </div>
      </div>
    );
  }

  return children;
}
