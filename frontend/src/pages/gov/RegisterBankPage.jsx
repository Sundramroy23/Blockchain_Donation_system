// src/pages/gov/RegisterBankPage.jsx
import { useState } from "react";
import { useToast }            from "../../context/ToastContext";
import { useAuth }             from "../../context/AuthContext";
import PageHeader              from "../../components/shared/PageHeader";
import DataTable               from "../../components/shared/DataTable";
import { bankApi }             from "../../services/api";

const fmt   = (n) => n?.toLocaleString() ?? "–";
// Fields match controller: { userCert, bankId, name, branch, ifscCode }
const EMPTY = { userCert: "", bankId: "", name: "", branch: "", ifscCode: "" };

export default function RegisterBankPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [form,    setForm]    = useState({ ...EMPTY, userCert: user?.userCert || "" });
  const [banks,   setBanks]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching,setFetching]= useState(false);

  const upd = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const loadBanks = async (userCert) => {
    if (!userCert) {
      return;
    }
    setFetching(true);
    try {
      const res = await bankApi.getAll({ userCert });
      setBanks(res.data || []);
    } catch (err) {
      toast(err?.response?.data?.error || err.message || "Failed to load banks", "error");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.userCert || !form.bankId || !form.name || !form.branch || !form.ifscCode) {
      toast("UserCert and all bank fields are required", "error");
      return;
    }
    setLoading(true);
    try {
      await bankApi.register(form);
      toast("Bank registered successfully", "success");
      await loadBanks(form.userCert);
      setForm((prev) => ({ ...EMPTY, userCert: prev.userCert }));
    } catch (err) {
      toast(err.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Register Bank" desc="Add a financial institution authorized to issue tokens" />
      <div className="grid-2">
        <div className="card">
          <div className="form-grid section-gap">
            <div className="form-group"><label>User Cert</label><input value={form.userCert} onChange={upd("userCert")} placeholder="User certificate ID" /></div>
            <div className="form-group"><label>Bank ID</label><input value={form.bankId} onChange={upd("bankId")} placeholder="e.g. BANK001" /></div>
            <div className="form-group"><label>Bank Name</label><input value={form.name} onChange={upd("name")} placeholder="Institution name" /></div>
            <div className="form-group"><label>Branch</label><input value={form.branch} onChange={upd("branch")} placeholder="e.g. Mumbai Main Branch" /></div>
            <div className="form-group"><label>IFSC Code</label><input value={form.ifscCode} onChange={upd("ifscCode")} placeholder="e.g. SBIN0001234" /></div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setForm((prev) => ({ ...EMPTY, userCert: prev.userCert }))}>Clear</button>
              <button className="btn btn-secondary" onClick={() => loadBanks(form.userCert)} disabled={fetching || !form.userCert}>
                {fetching ? "Loading…" : "Load Banks"}
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? "Registering…" : "Register Bank"}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 4 }}>Registered Banks</div>
          <div className="card-sub" style={{ marginBottom: 14 }}>Authorized token issuers</div>
          {fetching ? (
            <p style={{ color: "var(--text-muted)" }}>Loading…</p>
          ) : (
            <DataTable
              columns={[
                { key: "bankId", label: "Bank ID",  mono: true },
                { key: "name",   label: "Bank" },
                { key: "branch", label: "Branch" },
                { key: "ifscCode", label: "IFSC" },
              ]}
              data={banks}
            />
          )}
        </div>
      </div>
    </div>
  );
}
