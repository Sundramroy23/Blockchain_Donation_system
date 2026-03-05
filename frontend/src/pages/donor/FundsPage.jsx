// src/pages/donor/FundsPage.jsx
import { useEffect, useState } from "react";
import PageHeader from "../../components/shared/PageHeader";
import DataTable  from "../../components/shared/DataTable";
import Badge      from "../../components/shared/Badge";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { fundApi } from "../../services/api";

const fmt = (n) => n?.toLocaleString() ?? "–";

export default function FundsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [userCert, setUserCert] = useState(user?.userCert || "");
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadFunds = async () => {
    if (!userCert) {
      toast("UserCert is required", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fundApi.getAll({ userCert });
      setFunds(res.data || []);
    } catch (err) {
      toast(err?.response?.data?.error || err.message || "Failed to load funds", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userCert) {
      loadFunds();
    }
  }, []);

  return (
    <div>
      <PageHeader title="Available Funds" desc="Active funds open for donations" />
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
            <label>User Cert</label>
            <input value={userCert} onChange={(e) => setUserCert(e.target.value)} placeholder="govUserTom" />
          </div>
          <button className="btn btn-primary" onClick={loadFunds} disabled={loading || !userCert}>
            {loading ? "Loading…" : "Load Funds"}
          </button>
        </div>
      </div>
      <div className="card">
        <DataTable
          columns={[
            { key:"fundId",      label:"Fund ID",  mono:true },
            { key:"title",       label:"Fund Name" },
            { key:"ngoId",       label:"NGO",      mono:true },
            { key:"fundTarget",  label:"Target",  render:(r) => <span className="text-gold">{fmt(Number(r.fundTarget || 0))}</span> },
            { key:"totalTokens", label:"Raised",  render:(r) => fmt(Number(r.totalTokens || 0)) },
            { key:"donations",   label:"Donations", render:(r) => Array.isArray(r.donations) ? r.donations.length : 0 },
            { key:"status",  label:"Status",  render:(r) => <Badge type={r.status==="open"?"green":"red"}>{r.status}</Badge> },
          ]}
          data={funds.filter((f) => String(f.status || "").toUpperCase() === "ACTIVE")}
        />
      </div>
    </div>
  );
}
