// src/pages/gov/RegisterDonorPage.jsx
import { useState } from "react";
import { useToast }            from "../../context/ToastContext";
import { useAuth }             from "../../context/AuthContext";
import PageHeader              from "../../components/shared/PageHeader";
import DataTable               from "../../components/shared/DataTable";
import { donorApi }            from "../../services/api";

// Fields match controller: { userCert, donorId, name, email, alias }
const EMPTY = { userCert: "", donorId: "", name: "", email: "", alias: "" };

export default function RegisterDonorPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [form,    setForm]    = useState({ ...EMPTY, userCert: user?.userCert || "" });
  const [donors,  setDonors]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching,setFetching]= useState(false);

  const upd = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const loadDonors = async (userCert) => {
    if (!userCert) {
      return;
    }
    setFetching(true);
    try {
      const res = await donorApi.getAll({ userCert });
      setDonors(res.data || []);
    } catch (err) {
      toast(err?.response?.data?.error || err.message || "Failed to load donors", "error");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.userCert || !form.donorId || !form.name || !form.email) {
      toast("UserCert, donor ID, name, and email are required", "error");
      return;
    }
    setLoading(true);
    try {
      await donorApi.register(form);
      toast("Donor registered on ledger", "success");
      await loadDonors(form.userCert);
      setForm((prev) => ({ ...EMPTY, userCert: prev.userCert }));
    } catch (err) {
      toast(err.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Register Donor" desc="Onboard a new donor onto the blockchain ledger" />
      <div className="grid-2">
        <div className="card">
          <div className="form-grid section-gap">
            <div className="form-group"><label>User Cert</label><input value={form.userCert} onChange={upd("userCert")} placeholder="User certificate ID" /></div>
            <div className="form-group"><label>Donor ID</label><input value={form.donorId} onChange={upd("donorId")} placeholder="e.g. DNR001" /></div>
            <div className="form-group"><label>Full Name</label><input value={form.name} onChange={upd("name")} placeholder="Full legal name" /></div>
            <div className="form-group"><label>Email</label><input value={form.email} onChange={upd("email")} type="email" placeholder="donor@email.com" /></div>
            <div className="form-group"><label>Alias</label><input value={form.alias} onChange={upd("alias")} placeholder="Preferred alias / username" /></div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setForm((prev) => ({ ...EMPTY, userCert: prev.userCert }))}>Clear</button>
              <button className="btn btn-secondary" onClick={() => loadDonors(form.userCert)} disabled={fetching || !form.userCert}>
                {fetching ? "Loading…" : "Load Donors"}
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? "Registering…" : "Register Donor"}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 4 }}>Registered Donors</div>
          <div className="card-sub" style={{ marginBottom: 14 }}>
            Total: {fetching ? "…" : donors.length}
          </div>
          {fetching ? (
            <p style={{ color: "var(--text-muted)" }}>Loading…</p>
          ) : (
            <DataTable
              columns={[
                { key: "donorId", label: "Donor ID", mono: true },
                { key: "name",    label: "Name" },
                { key: "email",   label: "Email" },
                { key: "alias",   label: "Alias" },
              ]}
              data={donors}
            />
          )}
        </div>
      </div>
    </div>
  );
}
