// src/pages/bank/IssueTokensPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import PageHeader   from "../../components/shared/PageHeader";
import { bankApi, tokenApi } from "../../services/api";

const fmt = (n) => n?.toLocaleString() ?? "–";
const toSafeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function IssueTokensPage() {
  const toast = useToast();
  const { user } = useAuth();
  const EMPTY = { userCert: user?.userCert || "", bankId: user?.userCert || "", ownerId: "", amount: "" };
  const [form, setForm] = useState(EMPTY);
  const [banks, setBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [loading, setLoading] = useState(false);
  const upd = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const dropdownBanks = useMemo(() => {
    const mapped = (banks || []).map((bank) => ({
      bankId: String(bank?.bankId || '').trim(),
      name: bank?.name || bank?.bankId || 'Unknown Bank',
    })).filter((bank) => bank.bankId);

    if (form.userCert && !mapped.some((bank) => bank.bankId === form.userCert)) {
      mapped.unshift({ bankId: form.userCert, name: `${form.userCert} (Current Cert)` });
    }
    return mapped;
  }, [banks, form.userCert]);

  const loadBanks = async (userCert) => {
    if (!userCert) {
      setBanks([]);
      return;
    }
    setLoadingBanks(true);
    try {
      const res = await bankApi.getAll({ userCert });
      setBanks(res.data || []);
    } catch (err) {
      setBanks([]);
      toast(err?.response?.data?.error || err.message || "Failed to load bank registry", "error");
    } finally {
      setLoadingBanks(false);
    }
  };

  useEffect(() => {
    if (form.userCert) {
      loadBanks(form.userCert);
    }
  }, []);

  useEffect(() => {
    if (!form.bankId && form.userCert) {
      setForm((prev) => ({ ...prev, bankId: form.userCert }));
    }
  }, [form.userCert, form.bankId]);

  const handleSubmit = async () => {
    if (!form.userCert || !form.bankId || !form.ownerId || !form.amount) {
      toast("UserCert, bank ID, owner ID and amount are required", "error");
      return;
    }

    setLoading(true);
    try {
      await tokenApi.issue(form);
      toast("Tokens issued successfully", "success");
      setForm((prev) => ({ ...EMPTY, userCert: prev.userCert, bankId: prev.bankId }));
    } catch (err) {
      toast(err?.response?.data?.error || err.message || "Failed to issue tokens", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Issue Tokens" desc="Mint new donation tokens on the blockchain" />
      <div className="grid-2">
        <div className="card">
          <div className="form-grid section-gap">
            <div className="form-group">
              <label>User Cert</label>
              <input value={form.userCert} onChange={upd("userCert")} placeholder="User certificate ID" />
            </div>
            <div className="form-group">
              <label>Issuing Bank</label>
              <select value={form.bankId} onChange={upd("bankId")}>
                <option value="">Select bank...</option>
                {dropdownBanks.map((bank) => <option key={bank.bankId} value={bank.bankId}>{bank.name}</option>)}
              </select>
              <span className="input-hint">{loadingBanks ? "Loading bank list..." : "If list is empty, current User Cert is used as issuing bank."}</span>
            </div>
            <div className="form-group"><label>Owner ID</label><input value={form.ownerId} onChange={upd("ownerId")} placeholder="e.g. DNR001" /></div>
            <div className="form-group"><label>Amount (Tokens)</label><input value={form.amount} onChange={upd("amount")} type="number" placeholder="e.g. 10000" /></div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setForm((prev) => ({ ...EMPTY, userCert: prev.userCert, bankId: prev.bankId || prev.userCert }))}>Clear</button>
              <button className="btn btn-secondary" onClick={() => loadBanks(form.userCert)} disabled={!form.userCert || loadingBanks}>
                {loadingBanks ? "Refreshing..." : "Refresh Banks"}
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? "Issuing..." : "Issue Tokens ◈"}</button>
            </div>
          </div>
        </div>

        <div className="section-gap">
          {dropdownBanks.map((b) => {
            const issued = toSafeNumber(b?.issued);
            const circulating = toSafeNumber(b?.circulating);
            const pct = issued > 0 ? Math.round((circulating / issued) * 100) : 0;
            return (
              <div key={b.bankId} className="stat-card gold">
                <div className="stat-label">{b.name}</div>
                <div className="stat-value gold">{fmt(issued)}</div>
                <div style={{ fontSize:11, color:"var(--green)", fontFamily:"'DM Mono',monospace" }}>Circulating: {fmt(circulating)}</div>
                <div className="progress-track" style={{ marginTop:8 }}>
                  <div className="progress-fill" style={{ width:`${pct}%` }} />
                </div>
              </div>
            );
          })}
          {!loadingBanks && dropdownBanks.length === 0 && (
            <div className="card-sub">No banks available for this cert. Enter a valid `User Cert` and click Refresh Banks.</div>
          )}
        </div>
      </div>
    </div>
  );
}
