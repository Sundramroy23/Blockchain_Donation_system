// src/pages/login/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROLES_META } from "../../router/routes";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [selected, setSelected] = useState(null);
  const [username, setUsername] = useState("demo_user");
  const [userCert, setUserCert] = useState("govAdmin");

  const handleConnect = () => {
    if (!selected || !userCert) return;
    login({ role: selected, name: username || "Demo User", userCert });
    navigate("/dashboard");
  };

  return (
    <div className="login-screen">
      <div className="login-bg-grid" />
      <div className="login-orb" style={{ width:500, height:500, background:"radial-gradient(circle,rgba(212,168,67,.07) 0%,transparent 70%)", top:"-10%", left:"-5%" }} />
      <div className="login-orb" style={{ width:400, height:400, background:"radial-gradient(circle,rgba(96,165,250,.05) 0%,transparent 70%)", bottom:"-10%", right:"-5%" }} />

      <div className="login-layout">
        {/* ── Left: Hero ── */}
        <div className="login-hero">
          <div className="hero-content">
            <div className="hero-logo-icon">⛓</div>
            <h1 className="hero-title">Transparent<br />Giving on the<br /><span>Blockchain</span></h1>
            <p className="hero-sub">
              ChainDonate brings full transparency to charitable giving.
              Every donation is recorded on Hyperledger Fabric — immutable, auditable, and real-time.
            </p>
            <div className="hero-stats">
              {[["80,000+","Tokens Issued"],["3","Active NGOs"],["$142K","Total Raised"],["100%","On-Chain"]].map(([v,l]) => (
                <div key={l} className="hero-stat">
                  <div className="hero-stat-val">{v}</div>
                  <div className="hero-stat-lbl">{l}</div>
                </div>
              ))}
            </div>
            <div className="hero-badges">
              {[["#4ade80","Hyperledger Fabric"],["#60a5fa","Multi-Org MSP"],["#d4a843","Token Economy"]].map(([c,t]) => (
                <div key={t} className="hero-badge">
                  <div className="hero-badge-dot" style={{ background: c }} />{t}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Form ── */}
        <div className="login-form-panel">
          <div className="login-form-title">Welcome back</div>
          <div className="login-form-sub">SIGN IN TO YOUR ORGANIZATION PORTAL</div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>User Cert</label>
            <input value={userCert} onChange={(e) => setUserCert(e.target.value)} placeholder="Enter enrolled user certificate ID" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" defaultValue="demo1234" placeholder="••••••••" />
          </div>

          <div className="divider" />
          <div style={{ fontSize:11, color:"var(--text-3)", marginBottom:10, fontFamily:"'DM Mono',monospace", letterSpacing:1, textTransform:"uppercase" }}>
            Select Your Role
          </div>

          <div className="role-grid">
            {ROLES_META.map((r) => (
              <div key={r.id} className={`role-btn ${selected === r.id ? "selected" : ""}`} onClick={() => setSelected(r.id)}>
                <div className="role-btn-name" style={{ color: selected === r.id ? r.color : undefined }}>{r.label}</div>
                <div className="role-btn-org">{r.org}</div>
              </div>
            ))}
          </div>

          <button
            className="btn btn-primary full-width"
            style={{ marginTop:16, justifyContent:"center", opacity: selected && userCert ? 1 : 0.5, cursor: selected && userCert ? "pointer" : "not-allowed" }}
            onClick={handleConnect}
          >
            Connect to Network →
          </button>
          {(!selected || !userCert) && (
            <div style={{ fontSize:11, color:"var(--text-3)", textAlign:"center", marginTop:8, fontFamily:"'DM Mono',monospace" }}>
              ↑ Select a role and enter User Cert to continue
            </div>
          )}

          <div style={{ marginTop:24, paddingTop:20, borderTop:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"var(--green)", boxShadow:"0 0 8px var(--green)" }} />
            <span style={{ fontSize:11, color:"var(--text-3)", fontFamily:"'DM Mono',monospace" }}>
              HYPERLEDGER FABRIC · MAINNET · BLOCK #14,892
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
