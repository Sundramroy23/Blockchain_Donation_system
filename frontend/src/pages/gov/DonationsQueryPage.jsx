// src/pages/gov/DonationsQueryPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/shared/PageHeader";
import DataTable from "../../components/shared/DataTable";
import { authApi, donorApi, fundApi } from "../../services/api";

const fmt = (n) => Number(n || 0).toLocaleString();
const short = (s) => (String(s || "").length > 12 ? `${String(s).slice(0, 12)}…` : String(s || ""));

const normalizeDonor = (item) => ({
  donorId: String(item?.donorId || item?.donor_id || "").trim(),
  donorCertificate: String(item?.donorCertificate || item?.donor_certificate || item?.userCert || "").trim(),
  name: String(item?.name || "").trim(),
  email: String(item?.email || "").trim(),
  alias: String(item?.alias || "").trim(),
});

const uniqByDonorId = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const id = String(item?.donorId || "").trim();
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

export default function DonationsQueryPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [userCert, setUserCert] = useState(user?.userCert || "");
  const [donorId, setDonorId] = useState("");
  const [donorList, setDonorList] = useState([]);
  const [donorProfile, setDonorProfile] = useState(null);
  const [loadingDonors, setLoadingDonors] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const selectedDonor = useMemo(
    () => donorList.find((item) => String(item?.donorId || "").trim() === String(donorId || "").trim()) || null,
    [donorList, donorId]
  );

  const summary = useMemo(() => {
    const totalDonationAmount = transactions.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const uniqueFunds = new Set(transactions.map((row) => String(row.fundId || "").trim()).filter(Boolean));
    return {
      totalDonationAmount,
      fundsCount: uniqueFunds.size,
      transactionCount: transactions.length,
    };
  }, [transactions]);

  const loadDonors = async () => {
    if (!userCert) return;
    setLoadingDonors(true);
    try {
      const [authDonorsResult, fundsResult] = await Promise.allSettled([
        authApi.getDonors({ userCert }),
        fundApi.getAll({ userCert }),
      ]);

      const authDonors = authDonorsResult.status === "fulfilled" && Array.isArray(authDonorsResult.value?.data)
        ? authDonorsResult.value.data.map(normalizeDonor)
        : [];

      const funds = fundsResult.status === "fulfilled" && Array.isArray(fundsResult.value?.data)
        ? fundsResult.value.data
        : [];

      const donorIdsFromFunds = funds
        .flatMap((fund) => Array.isArray(fund?.donations) ? fund.donations : [])
        .map((donation) => normalizeDonor({ donorId: donation?.donorId }))
        .filter((item) => item.donorId);

      const merged = uniqByDonorId([...authDonors, ...donorIdsFromFunds]);
      setDonorList(merged);

      if (!donorId && merged.length > 0) {
        setDonorId(merged[0].donorId);
      }

      if (merged.length === 0) {
        toast("No donors found for the current account", "info");
      }
    } catch (err) {
      setDonorList([]);
      toast(err?.response?.data?.error || err.message || "Failed to load donor list", "error");
    } finally {
      setLoadingDonors(false);
    }
  };

  const loadDonorProfile = async (targetDonorId = donorId) => {
    if (!userCert || !targetDonorId) {
      setDonorProfile(null);
      return;
    }

    setLoadingProfile(true);
    try {
      const [authResult, ledgerResult] = await Promise.allSettled([
        authApi.getDonor(targetDonorId, { userCert }),
        donorApi.getDonor({ userCert, donorId: targetDonorId }),
      ]);

      const authProfile = authResult.status === "fulfilled" ? normalizeDonor(authResult.value?.data) : null;
      const ledgerProfile = ledgerResult.status === "fulfilled"
        ? normalizeDonor(ledgerResult.value?.data?.data ?? ledgerResult.value?.data)
        : null;

      const fallbackProfile = normalizeDonor(selectedDonor || { donorId: targetDonorId });
      const mergedProfile = {
        donorId: targetDonorId,
        name: authProfile?.name || ledgerProfile?.name || fallbackProfile.name || targetDonorId,
        email: authProfile?.email || ledgerProfile?.email || fallbackProfile.email || '',
        alias: ledgerProfile?.alias || authProfile?.alias || fallbackProfile.alias || '',
        donorCertificate: authProfile?.donorCertificate || ledgerProfile?.donorCertificate || fallbackProfile.donorCertificate || targetDonorId,
      };

      setDonorProfile(mergedProfile);
    } catch (err) {
      setDonorProfile(normalizeDonor(selectedDonor || { donorId: targetDonorId }));
      if (!selectedDonor) {
        toast(err?.response?.data?.error || err.message || "Failed to load donor details", "error");
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadTransactions = async (targetDonorId = donorId) => {
    if (!userCert || !targetDonorId) {
      setTransactions([]);
      return;
    }

    setLoadingTransactions(true);
    try {
      const res = await fundApi.getByDonor(targetDonorId, { userCert });
      const data = Array.isArray(res?.data) ? res.data : [];
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
      setTransactions(flattened);
      toast(`Found ${flattened.length} donation(s)`, "info");
    } catch (err) {
      setTransactions([]);
      toast(err?.response?.data?.error || err.message || "Query failed", "error");
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (userCert) {
      setDonorId("");
      loadDonors();
    }
  }, [userCert]);

  useEffect(() => {
    if (donorId) {
      loadDonorProfile(donorId);
      loadTransactions(donorId);
    } else {
      setDonorProfile(null);
      setTransactions([]);
    }
  }, [donorId]);

  const refreshSelectedDonor = async () => {
    if (!donorId) return;
    await Promise.all([loadDonorProfile(donorId), loadTransactions(donorId)]);
  };

  return (
    <div>
      <PageHeader title="Donor Lookup" desc="Select a donor to view profile details and donation activity" />

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="form-group" style={{ flex: 1, minWidth: 180 }}>
            <label>User Cert</label>
            <input value={userCert} onChange={(e) => setUserCert(e.target.value)} placeholder="govUserTom" />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
            <label>Select Donor</label>
            <select value={donorId} onChange={(e) => setDonorId(e.target.value)} disabled={loadingDonors}>
              <option value="">Select donor...</option>
              {donorList.map((item) => {
                const id = String(item?.donorId || "").trim();
                const label = item?.name ? `${item.name} (${id})` : id;
                return (
                  <option key={id} value={id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
          <button className="btn btn-secondary" onClick={loadDonors} disabled={loadingDonors || !userCert}>
            {loadingDonors ? "Refreshing..." : "Refresh Donor List"}
          </button>
          <button className="btn btn-primary" onClick={refreshSelectedDonor} disabled={!donorId || loadingProfile || loadingTransactions}>
            {loadingProfile || loadingTransactions ? "Loading..." : "Refresh Details"}
          </button>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>Donor Profile</div>
          {!donorId || !donorProfile ? (
            <div className="text-dim">Select a donor to view full profile details.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <div><strong>Name:</strong> {donorProfile.name || '—'}</div>
              <div><strong>Donor ID:</strong> {donorProfile.donorId || donorId}</div>
              <div><strong>Email:</strong> {donorProfile.email || '—'}</div>
              <div><strong>Alias:</strong> {donorProfile.alias || '—'}</div>
              <div><strong>User Certificate:</strong> {donorProfile.donorCertificate || '—'}</div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>Donation Dashboard</div>
          <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3, minmax(120px, 1fr))', marginBottom: 0 }}>
            <div className="stat-card gold">
              <div className="stat-label">Donation Amount</div>
              <div className="stat-value gold">{fmt(summary.totalDonationAmount)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Funds Donated To</div>
              <div className="stat-value">{summary.fundsCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Transactions</div>
              <div className="stat-value">{summary.transactionCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>Transactions · {transactions.length} record(s)</div>
        <DataTable
          columns={[
            { key: "id", label: "ID", mono: true },
            { key: "donorId", label: "Donor", mono: true },
            { key: "fundId", label: "Fund", mono: true },
            { key: "ngoId", label: "NGO", mono: true },
            { key: "amount", label: "Amount", render: (r) => <><span className="text-gold">◈</span> {fmt(r.amount)}</> },
            { key: "tokenId", label: "Token", mono: true, render: (r) => short(r.tokenId) },
            { key: "timestamp", label: "Date", mono: true },
          ]}
          data={transactions}
          emptyText="No donations match this donor"
        />
      </div>
    </div>
  );
}
