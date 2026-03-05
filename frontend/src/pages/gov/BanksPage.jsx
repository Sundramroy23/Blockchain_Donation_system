// src/pages/gov/BanksPage.jsx
import { useState, useEffect } from "react";
import { useToast }            from "../../context/ToastContext";
import { useAuth }             from "../../context/AuthContext";
import PageHeader              from "../../components/shared/PageHeader";
import DataTable               from "../../components/shared/DataTable";
import { bankApi }             from "../../services/api";

const short = (s) => s?.length > 12 ? s.slice(0, 12) + "…" : s;

export default function BanksPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [userCert, setUserCert] = useState(user?.userCert || "");
  const [banks,    setBanks]   = useState([]);
  const [fetching, setFetching] = useState(true);

  const loadBanks = async () => {
    if (!userCert) {
      toast("UserCert is required", "error");
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

  useEffect(() => {
    setFetching(false);
  }, []);

  return (
    <div>
      <PageHeader title="All Banks" desc="Authorized financial institutions" />
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
            <label>User Cert</label>
            <input value={userCert} onChange={(e) => setUserCert(e.target.value)} placeholder="Enter userCert" />
          </div>
          <button className="btn btn-primary" onClick={loadBanks} disabled={fetching}>
            {fetching ? "Loading…" : "Load Banks"}
          </button>
        </div>
      </div>
      <div className="card">
        {fetching ? (
          <p style={{ color: "var(--text-muted)" }}>Loading…</p>
        ) : (
          <DataTable
            columns={[
              { key: "bankId",      label: "Bank ID",     mono: true },
              { key: "name",        label: "Institution" },
              { key: "branch",      label: "Branch" },
              { key: "ifscCode",    label: "IFSC",        mono: true },
              { key: "badgeCid",    label: "Badge CID",   mono: true, render: (r) => short(r.badgeCid || "") || "—" },
            ]}
            data={banks}
          />
        )}
      </div>
    </div>
  );
}
