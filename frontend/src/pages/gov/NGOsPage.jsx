// src/pages/gov/NGOsPage.jsx
import { useState, useEffect } from "react";
import { useToast }            from "../../context/ToastContext";
import { useAuth }             from "../../context/AuthContext";
import PageHeader              from "../../components/shared/PageHeader";
import DataTable               from "../../components/shared/DataTable";
import { ngoApi }              from "../../services/api";

export default function NGOsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [userCert, setUserCert] = useState(user?.userCert || "");
  const [ngos,     setNgos]    = useState([]);
  const [fetching, setFetching] = useState(true);

  const loadNGOs = async () => {
    if (!userCert) {
      toast("UserCert is required", "error");
      return;
    }
    setFetching(true);
    try {
      const res = await ngoApi.getAll({ userCert });
      setNgos(res.data || []);
    } catch (err) {
      toast(err?.response?.data?.error || err.message || "Failed to load NGOs", "error");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    setFetching(false);
  }, []);

  return (
    <div>
      <PageHeader title="All NGOs" desc="Non-governmental organizations on the platform" />
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
            <label>User Cert</label>
            <input value={userCert} onChange={(e) => setUserCert(e.target.value)} placeholder="Enter userCert" />
          </div>
          <button className="btn btn-primary" onClick={loadNGOs} disabled={fetching}>
            {fetching ? "Loading…" : "Load NGOs"}
          </button>
        </div>
      </div>
      <div className="card">
        {fetching ? (
          <p style={{ color: "var(--text-muted)" }}>Loading…</p>
        ) : (
          <DataTable
            columns={[
              { key: "ngoId",       label: "NGO ID",      mono: true },
              { key: "name",     label: "Organization" },
              { key: "regNo",    label: "Reg No" },
              { key: "address",  label: "Address" },
              { key: "contact",  label: "Contact" },
              { key: "description", label: "Description" },
            ]}
            data={ngos}
          />
        )}
      </div>
    </div>
  );
}
