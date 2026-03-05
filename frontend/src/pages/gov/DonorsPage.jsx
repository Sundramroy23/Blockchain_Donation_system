// src/pages/gov/DonorsPage.jsx
import { useState, useEffect } from "react";
import { useToast }            from "../../context/ToastContext";
import { useAuth }             from "../../context/AuthContext";
import PageHeader              from "../../components/shared/PageHeader";
import DataTable               from "../../components/shared/DataTable";
import Badge                   from "../../components/shared/Badge";
import { donorApi }            from "../../services/api";

const short = (s) => s?.length > 12 ? s.slice(0, 12) + "…" : s;

export default function DonorsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [userCert, setUserCert] = useState(user?.userCert || "");
  const [donors,   setDonors]  = useState([]);
  const [fetching, setFetching] = useState(true);

  const loadDonors = async () => {
    if (!userCert) {
      toast("UserCert is required", "error");
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

  useEffect(() => {
    setFetching(false);
  }, []);

  return (
    <div>
      <PageHeader title="All Donors" desc="Complete donor registry on the ledger" />
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
            <label>User Cert</label>
            <input value={userCert} onChange={(e) => setUserCert(e.target.value)} placeholder="Enter userCert" />
          </div>
          <button className="btn btn-primary" onClick={loadDonors} disabled={fetching}>
            {fetching ? "Loading…" : "Load Donors"}
          </button>
        </div>
      </div>
      <div className="card">
        {fetching ? (
          <p style={{ color: "var(--text-muted)" }}>Loading…</p>
        ) : (
          <DataTable
            columns={[
              { key: "donorId",     label: "Donor ID", mono: true },
              { key: "name",   label: "Name" },
              { key: "email",  label: "Email" },
              { key: "alias",  label: "Alias" },
              { key: "badgeCid", label: "Badge CID", mono: true, render: (r) => short(r.badgeCid || "") || "—" },
              { key: "org",    label: "Org", render: () => <Badge type="blue">Org2</Badge> },
            ]}
            data={donors}
          />
        )}
      </div>
    </div>
  );
}
