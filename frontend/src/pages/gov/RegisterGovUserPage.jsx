// src/pages/gov/RegisterGovUserPage.jsx
import { useState, useEffect } from "react";
import { useToast }            from "../../context/ToastContext";
import { useAuth }             from "../../context/AuthContext";
import PageHeader              from "../../components/shared/PageHeader";
import DataTable               from "../../components/shared/DataTable";
import Badge                   from "../../components/shared/Badge";
import { govUserApi }          from "../../services/api";

const EMPTY = { userCert: "", govUserId: "", name: "", email: "", designation: "" };

export default function RegisterGovUserPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [form,    setForm]    = useState({ ...EMPTY, userCert: user?.userCert || "" });
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching,setFetching]= useState(false);

  const loadGovUsers = async (userCert) => {
    if (!userCert) return;
    setFetching(true);
    try {
      const res = await govUserApi.getAll({ userCert });
      setUsers(res.data || []);
    } catch (err) {
      toast(err?.response?.data?.error || err.message || "Failed to load gov users", "error");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (form.userCert) {
      loadGovUsers(form.userCert);
    }
  }, [form.userCert]);

  const upd = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.userCert || !form.govUserId || !form.name || !form.email) {
      toast("UserCert, user ID, name, and email are required", "error");
      return;
    }
    setLoading(true);
    try {
      await govUserApi.register(form);
      toast("Government user registered successfully", "success");
      await loadGovUsers(form.userCert);
      setForm((prev) => ({ ...EMPTY, userCert: prev.userCert }));
    } catch (err) {
      toast(err?.response?.data?.error || err.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Register Gov User" desc="Onboard a new government portal user onto the network" />
      <div className="grid-2">
        <div className="card">
          <div className="form-grid section-gap">
            <div className="form-group">
              <label>User Cert</label>
              <input value={form.userCert} onChange={upd("userCert")} placeholder="e.g. govUserTom" />
            </div>
            <div className="form-group">
              <label>User ID</label>
              <input value={form.govUserId} onChange={upd("govUserId")} placeholder="e.g. GOV001" />
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input value={form.name} onChange={upd("name")} placeholder="Full legal name" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input value={form.email} onChange={upd("email")} type="email" placeholder="user@gov.org" />
            </div>
            <div className="form-group">
              <label>Designation</label>
              <input value={form.designation} onChange={upd("designation")} placeholder="e.g. Compliance Officer" />
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setForm((prev) => ({ ...EMPTY, userCert: prev.userCert }))}>Clear</button>
              <button className="btn btn-secondary" onClick={() => loadGovUsers(form.userCert)} disabled={fetching || !form.userCert}>
                {fetching ? "Loading…" : "Load Gov Users"}
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? "Registering…" : "Register Gov User"}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 4 }}>Registered Gov Users</div>
          <div className="card-sub" style={{ marginBottom: 14 }}>
            Total: {fetching ? "…" : users.length}
          </div>
          {fetching ? (
            <p style={{ color: "var(--text-muted)" }}>Loading…</p>
          ) : (
            <DataTable
              columns={[
                { key: "govUserId",    label: "User ID",     mono: true },
                { key: "name",         label: "Name" },
                { key: "email",        label: "Email" },
                { key: "createdBy",    label: "Created By", mono: true },
                { key: "designation",  label: "Designation", render: (r) => <Badge type="blue">{r.designation || "—"}</Badge> },
              ]}
              data={users}
            />
          )}
        </div>
      </div>
    </div>
  );
}
