// src/pages/gov/DonationsQueryPage.jsx
import { useState }   from "react";
import { useToast }   from "../../context/ToastContext";
import { useAuth }    from "../../context/AuthContext";
import PageHeader     from "../../components/shared/PageHeader";
import DataTable      from "../../components/shared/DataTable";
import { fundApi }    from "../../services/api";

const fmt   = (n) => n?.toLocaleString() ?? "–";
const short = (s) => s?.length > 12 ? s.slice(0,12)+"…" : s;

export default function DonationsQueryPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [userCert, setUserCert] = useState(user?.userCert || "");
  const [donorId,  setDonorId]  = useState("");
  const [results,  setResults]  = useState(null);
  const [loading, setLoading] = useState(false);

  const query = async () => {
    if (!userCert || !donorId) {
      toast("UserCert and Donor ID are required", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fundApi.getByDonor(donorId, { userCert });
      const data = res.data || [];
      const flattened = data.flatMap((fundRecord) =>
        (fundRecord.donations || []).map((donation, idx) => ({
          id: `${fundRecord.fundId}-${idx + 1}`,
          donorId: donation.donorId,
          fundId: fundRecord.fundId,
          ngoId: fundRecord.ngoId,
          amount: Number(donation.amount || 0),
          tokenId: donation.tokenId,
          timestamp: donation.timestamp,
        }))
      );
      setResults(flattened);
      toast(`Found ${flattened.length} donation(s)`, "info");
    } catch (err) {
      toast(err?.response?.data?.error || err.message || "Query failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Donations Query" desc="Look up all donations made by a specific donor" />

      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ display:"flex", gap:12, alignItems:"flex-end", flexWrap:"wrap" }}>
          <div className="form-group" style={{ flex:1, minWidth:180 }}>
            <label>User Cert</label>
            <input value={userCert} onChange={(e) => setUserCert(e.target.value)} placeholder="govUserTom" />
          </div>
          <div className="form-group" style={{ flex:1, minWidth:180 }}>
            <label>Donor ID</label>
            <input value={donorId} onChange={(e) => setDonorId(e.target.value)} placeholder="e.g. donor001" />
          </div>
          <button className="btn btn-primary" onClick={query} disabled={loading}>{loading ? "Querying..." : "Query Ledger"}</button>
        </div>
      </div>

      {results !== null && (
        <div className="card">
          <div className="card-title" style={{ marginBottom:16 }}>Results · {results.length} record(s)</div>
          <DataTable
            columns={[
              { key:"id",     label:"ID",      mono:true },
              { key:"donorId",label:"Donor",   mono:true },
              { key:"fundId", label:"Fund",    mono:true },
              { key:"ngoId",  label:"NGO",     mono:true },
              { key:"amount", label:"Amount",  render:(r) => <><span className="text-gold">◈</span> {fmt(r.amount)}</> },
              { key:"tokenId",label:"Token",   mono:true, render:(r) => short(r.tokenId) },
              { key:"timestamp", label:"Date", mono:true },
            ]}
            data={results}
            emptyText="No donations match this query"
          />
        </div>
      )}
    </div>
  );
}
