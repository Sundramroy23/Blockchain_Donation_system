// src/layout/AppShell.jsx
// Persistent shell: sidebar navigation + topbar.
// Reads the current route from react-router to highlight active nav items.

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth }  from "../context/AuthContext";
import { ROUTES, ROLES_META } from "../router/routes";

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const explorerUrl = process.env.REACT_APP_EXPLORER_URL || "http://localhost:8081";

  const roleInfo  = ROLES_META.find((r) => r.id === user?.role);
  const navRoutes = ROUTES.filter((r) => r.roles.includes(user?.role));
  const current   = ROUTES.find((r) => r.path === location.pathname);

  const go = (path) => { navigate(path); setSidebarOpen(false); };
  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">⛓</div>
            <div>
              <div>ChainDonate</div>
              <div className="logo-sub">v2.0 · Mainnet</div>
            </div>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Navigation</div>
          {navRoutes.map((r) => (
            <div
              key={r.path}
              className={`nav-item ${location.pathname === r.path ? "active" : ""}`}
              onClick={() => go(r.path)}
            >
              <span className="nav-icon">{r.icon}</span>
              <span>{r.label}</span>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <button
            className="btn-home"
            style={{ width: "100%", justifyContent: "center", marginBottom: 10 }}
            onClick={handleLogout}
          >
            ← Back to Home
          </button>
          <div className="user-chip">
            <div
              className="user-avatar"
              style={{ background: `linear-gradient(135deg,${roleInfo?.color || "var(--gold)"},#444)` }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{roleInfo?.label}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main">
        <div className="topbar">
          <button className="hamburger" onClick={() => setSidebarOpen((o) => !o)}>☰</button>
          <div>
            <div className="topbar-breadcrumb">{roleInfo?.org}</div>
            <div className="topbar-title">{current?.label || "Dashboard"}</div>
          </div>
          <div className="topbar-actions">
            <a
              className="btn-home"
              href={explorerUrl}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "none" }}
            >
              ↗ Explorer
            </a>
            <button className="btn-home" onClick={handleLogout}>← Home</button>
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 10px", background:"var(--bg-card)", borderRadius:"var(--radius)", border:"1px solid var(--border)" }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:"var(--green)", boxShadow:"0 0 6px var(--green)" }} />
              <span style={{ fontSize:11, color:"var(--text-2)", fontFamily:"'DM Mono',monospace" }}>LIVE</span>
            </div>
          </div>
        </div>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
