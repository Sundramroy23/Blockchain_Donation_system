// src/pages/login/LoginPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { ROLES_META } from "../../router/routes";

export default function LoginPage() {
  const { login, register, loginWithRole, loading } = useAuth();
  const toast = useToast();
  const navigate  = useNavigate();
  const [accessMode, setAccessMode] = useState("secure");
  const [mode, setMode] = useState("login");
  const [submitting, setSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState("donor");
  const [roleName, setRoleName] = useState("Demo User");
  const [roleUserCert, setRoleUserCert] = useState("govUserTom");
  const [form, setForm] = useState({
    donorId: "",
    name: "",
    email: "",
    password: "",
  });

  const title = useMemo(
    () => (mode === "login" ? "Welcome Back" : "Create Donor Account"),
    [mode]
  );

  const subtitle = useMemo(
    () => (mode === "login"
      ? "Sign in with your donor credentials"
      : "Register securely and start donating"),
    [mode]
  );

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const roleDefaults = {
    donor: "donor001",
    govAdmin: "govUserTom",
    govUser: "govUserTom",
    bankUser: "bank001",
    ngoAdmin: "ngoAdminUser",
    ngoUser: "ngo001",
  };

  useEffect(() => {
    const nextDefault = roleDefaults[selectedRole] || "govUserTom";
    setRoleUserCert((current) => {
      const trimmed = String(current || "").trim();
      const knownDefaults = new Set(Object.values(roleDefaults));
      if (!trimmed || knownDefaults.has(trimmed)) {
        return nextDefault;
      }
      return current;
    });
  }, [selectedRole]);

  const handleSubmit = async () => {
    if (loading || submitting) return;

    if (!form.email || !form.password || (mode === "register" && !form.name)) {
      toast("Please fill all required fields", "error");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "register") {
        await register({
          donorId: form.donorId || undefined,
          name: form.name,
          email: form.email,
          password: form.password,
        });
        toast("Registration successful", "success");
      } else {
        await login({
          email: form.email,
          password: form.password,
        });
        toast("Login successful", "success");
      }

      navigate("/dashboard");
    } catch (error) {
      toast(error?.response?.data?.error || error.message || "Authentication failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleAccess = () => {
    if (!selectedRole || !roleUserCert) {
      toast("Select role and user cert", "error");
      return;
    }

    loginWithRole({
      role: selectedRole,
      name: roleName,
      userCert: roleUserCert,
    });
    toast("Role access granted", "success");
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
            <h1 className="hero-title">Secure Donor<br />Access for<br /><span>ChainDonate</span></h1>
            <p className="hero-sub">
              Your donor account now uses secure session-based authentication with
              encrypted passwords and protected cookies. Blockchain flows remain
              unchanged for transparent donation tracking.
            </p>
            <div className="hero-stats">
              {[["Session","Cookie-based"],["bcrypt","Password Hash"],["24h","Session TTL"],["15 min","Lockout Window"]].map(([v,l]) => (
                <div key={l} className="hero-stat">
                  <div className="hero-stat-val">{v}</div>
                  <div className="hero-stat-lbl">{l}</div>
                </div>
              ))}
            </div>
            <div className="hero-badges">
              {[["#4ade80","Session Auth"],["#60a5fa","Rate Limited"],["#d4a843","Fabric Integrated"]].map(([c,t]) => (
                <div key={t} className="hero-badge">
                  <div className="hero-badge-dot" style={{ background: c }} />{t}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Form ── */}
        <div className="login-form-panel">
          <div className="login-form-title">{title}</div>
          <div className="login-form-sub">{subtitle}</div>

          <div className="access-mode-row">
            <button
              type="button"
              className={`access-mode-btn ${accessMode === "secure" ? "active" : ""}`}
              onClick={() => setAccessMode("secure")}
            >
              Secure Donor Auth
            </button>
            <button
              type="button"
              className={`access-mode-btn ${accessMode === "role" ? "active" : ""}`}
              onClick={() => setAccessMode("role")}
            >
              Role Based Access
            </button>
          </div>

          {accessMode === "secure" ? (
            <>
              <div className="auth-mode-row">
                <button
                  type="button"
                  className={`auth-mode-btn ${mode === "login" ? "active" : ""}`}
                  onClick={() => setMode("login")}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`auth-mode-btn ${mode === "register" ? "active" : ""}`}
                  onClick={() => setMode("register")}
                >
                  Register
                </button>
              </div>

              <div className="auth-form-grid">
                {mode === "register" && (
                  <>
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        value={form.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Donor ID (Optional)</label>
                      <input
                        value={form.donorId}
                        onChange={(e) => updateField("donorId", e.target.value)}
                        placeholder="donor001"
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder="At least 8 characters"
                  />
                </div>
              </div>

              <button
                className="btn btn-primary full-width"
                style={{ marginTop:16, justifyContent:"center" }}
                onClick={handleSubmit}
                disabled={loading || submitting}
              >
                {submitting
                  ? "Please wait..."
                  : mode === "register"
                    ? "Create Account →"
                    : "Sign In →"}
              </button>
            </>
          ) : (
            <>
              <div className="auth-form-grid">
                <div className="form-group">
                  <label>Display Name</label>
                  <input
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="Demo User"
                  />
                </div>

                <div className="form-group">
                  <label>User Cert</label>
                  <input
                    value={roleUserCert}
                    onChange={(e) => setRoleUserCert(e.target.value)}
                    placeholder={roleDefaults[selectedRole] || "govUserTom"}
                  />
                </div>
              </div>

              <div className="role-grid">
                {ROLES_META.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`role-btn ${selectedRole === r.id ? "selected" : ""}`}
                    onClick={() => setSelectedRole(r.id)}
                  >
                    <div className="role-btn-name" style={{ color: selectedRole === r.id ? r.color : undefined }}>
                      {r.label}
                    </div>
                    <div className="role-btn-org">{r.org}</div>
                  </button>
                ))}
              </div>

              <button
                className="btn btn-primary full-width"
                style={{ marginTop: 6, justifyContent: "center" }}
                onClick={handleRoleAccess}
              >
                Continue as {ROLES_META.find((r) => r.id === selectedRole)?.label || "Role"} →
              </button>
            </>
          )}

          <div style={{ marginTop:24, paddingTop:20, borderTop:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"var(--green)", boxShadow:"0 0 8px var(--green)" }} />
            <span style={{ fontSize:11, color:"var(--text-3)", fontFamily:"'DM Mono',monospace" }}>
              SECURE AUTH · SQLITE SESSION STORE · FABRIC LEDGER READY
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
