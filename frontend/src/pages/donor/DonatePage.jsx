// src/pages/donor/DonatePage.jsx
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import PageHeader   from "../../components/shared/PageHeader";
import Badge        from "../../components/shared/Badge";
import { bankApi, fundApi, tokenApi } from "../../services/api";

const LEDGER_QUERY_CERT = "govUserTom";
const fmt = (n) => n?.toLocaleString() ?? "–";
const toSafeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const getTokenRemaining = (token) => {
  const directRemaining = toSafeNumber(token?.remainingAmount);
  if (directRemaining > 0) return directRemaining;
  const minted = toSafeNumber(token?.amount);
  const spent = toSafeNumber(token?.spentAmount);
  const fallbackRemaining = minted - spent;
  return fallbackRemaining > 0 ? fallbackRemaining : 0;
};
const getRaisedAmount = (fund) => {
  const fromTotalTokens = toSafeNumber(fund?.totalTokens);
  if (fromTotalTokens > 0) return fromTotalTokens;

  const fromCurrentAmount = toSafeNumber(fund?.currentAmount);
  if (fromCurrentAmount > 0) return fromCurrentAmount;

  const fromRaised = toSafeNumber(fund?.raised);
  if (fromRaised > 0) return fromRaised;

  if (Array.isArray(fund?.donations)) {
    return fund.donations.reduce((sum, item) => sum + toSafeNumber(item?.amount), 0);
  }

  return 0;
};
const normalizeBanks = (rawBanks) =>
  (Array.isArray(rawBanks) ? rawBanks : [])
    .map((bank) => {
      const bankId = String(bank?.bankId || bank?.userCert || "").trim();
      if (!bankId) return null;
      return {
        bankId,
        name: bank?.name || bankId || "Unknown Bank",
      };
    })
    .filter(Boolean);

export default function DonatePage() {
  const toast = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState({
    userCert: "",
    donorId: user?.userCert || "",
    fundId: "",
    tokenId: "",
    amount: "",
    bankId: "",
  });
  const [banks, setBanks] = useState([]);
  const [funds, setFunds] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [loadingFunds, setLoadingFunds] = useState(false);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const upd = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const openFunds = useMemo(
    () => funds.filter((f) => String(f.status || "").toUpperCase() === "ACTIVE"),
    [funds]
  );

  const selectedFund = useMemo(
    () => openFunds.find((f) => f.fundId === form.fundId),
    [openFunds, form.fundId]
  );

  const totalRemaining = useMemo(
    () => tokens.reduce((sum, token) => sum + getTokenRemaining(token), 0),
    [tokens]
  );

  const dropdownBanks = useMemo(() => {
    const mapped = normalizeBanks(banks);

    if (form.bankId && !mapped.some((bank) => bank?.bankId === form.bankId)) {
      mapped.unshift({ bankId: form.bankId, name: `${form.bankId} (Current Cert)` });
    }
    return mapped;
  }, [banks, form.bankId]);

  const loadBanks = async () => {
    if (!LEDGER_QUERY_CERT) {
      setBanks([]);
      return;
    }

    setLoadingBanks(true);
    try {
      const res = await bankApi.getAll({ userCert: LEDGER_QUERY_CERT });
      const bankList = normalizeBanks(res?.data);
      setBanks(bankList);
      if (bankList.length > 0) {
        const firstBankId = String(bankList[0]?.bankId || "").trim();
        if (firstBankId) {
          setForm((prev) => {
            if (prev.bankId && prev.userCert) return prev;
            return {
              ...prev,
              bankId: prev.bankId || firstBankId,
              userCert: prev.userCert || firstBankId,
            };
          });
        }
      }
    } catch (err) {
      setBanks([]);
      toast(err?.response?.data?.error || err.message || "Failed to load banks", "error");
    } finally {
      setLoadingBanks(false);
    }
  };

  const loadFunds = async () => {
    if (!LEDGER_QUERY_CERT) return;
    setLoadingFunds(true);
    try {
      const res = await fundApi.getAll({ userCert: LEDGER_QUERY_CERT });
      setFunds(res.data || []);
    } catch (err) {
      toast(err?.response?.data?.error || err.message || "Failed to load funds", "error");
    } finally {
      setLoadingFunds(false);
    }
  };

  const loadTokens = async () => {
    if (!LEDGER_QUERY_CERT || !form.donorId) return;
    setLoadingTokens(true);
    try {
      const res = await tokenApi.getByDonor({ userCert: LEDGER_QUERY_CERT, donorId: form.donorId, bankId: form.bankId });
      const result = res.data || [];
      setTokens(result);
      if (!form.tokenId && Array.isArray(result) && result.length > 0 && result[0]?.tokenId) {
        setForm((prev) => ({ ...prev, tokenId: result[0].tokenId }));
      }
    } catch (err) {
      toast(err?.response?.data?.error || err.message || "Failed to load donor tokens", "error");
    } finally {
      setLoadingTokens(false);
    }
  };

  useEffect(() => {
    if (LEDGER_QUERY_CERT) {
      loadFunds();
      loadBanks();
    }
  }, []);

  useEffect(() => {
    if (!form.bankId && form.userCert) {
      setForm((prev) => ({ ...prev, bankId: form.userCert }));
    }
  }, [form.userCert, form.bankId]);

  useEffect(() => {
    if (!form.donorId || !form.bankId) return;
    loadTokens();
  }, [form.donorId, form.bankId]);

  const handleDonate = async () => {
    if (!form.userCert || !form.donorId || !form.fundId || !form.tokenId || !form.amount) {
      toast("UserCert, donorId, fundId, tokenId and amount are required", "error");
      return;
    }

    setSubmitting(true);
    try {
      await fundApi.donate({
        fundId: form.fundId,
        userCert: form.userCert,
        donorId: form.donorId,
        tokenId: form.tokenId,
        amount: form.amount,
      });
      toast(`Donation of ${form.amount} tokens submitted`, "success");
      setForm((prev) => ({ ...prev, amount: "" }));
      await Promise.all([loadFunds(), loadTokens()]);
    } catch (err) {
      toast(err?.response?.data?.error || err.message || "Donation failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Make a Donation" desc="Support a cause by donating tokens to an open fund" />
      <div className="grid-2">
        {/* Fund selector */}
        <div className="card">
          <div className="card-title" style={{ marginBottom:14 }}>Select Fund</div>
          <div className="section-gap">
            {openFunds.map((f) => {
              const target = toSafeNumber(f.fundTarget);
              const raised = getRaisedAmount(f);
              const pct = target > 0 ? Math.round((raised / target) * 100) : 0;
              return (
                <div
                  key={f.fundId}
                  onClick={() => setForm((prev) => ({ ...prev, fundId: f.fundId }))}
                  style={{ padding:14, borderRadius:"var(--radius)", border:`1px solid ${form.fundId===f.fundId?"rgba(212,168,67,.5)":"var(--border)"}`, background: form.fundId===f.fundId ? "var(--gold-glow)" : "var(--bg-surface)", cursor:"pointer", transition:"all .15s" }}
                >
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, flexWrap:"wrap", gap:4 }}>
                    <span style={{ fontWeight:700, fontSize:13 }}>{f.title}</span>
                    <Badge type="teal">{f.fundId}</Badge>
                  </div>
                  <div style={{ fontSize:12, color:"var(--text-3)", marginBottom:8 }}>
                    {fmt(raised)} / {fmt(target)} tokens · NGO: {f.ngoId}
                  </div>
                  <div className="progress-track"><div className="progress-fill" style={{ width:`${pct}%` }} /></div>
                  <div style={{ fontSize:11, color:"var(--gold)", marginTop:4, fontFamily:"'DM Mono',monospace" }}>{pct}% funded</div>
                </div>
              );
            })}
            {loadingFunds && <p style={{ color:"var(--text-3)" }}>Loading funds...</p>}
          </div>
        </div>

        {/* Donation form */}
        <div className="card">
          <div className="card-title" style={{ marginBottom:14 }}>Donation Details</div>
          <div className="form-grid section-gap">
            <div className="stat-card gold">
              <div className="stat-label">Your Remaining Token Balance</div>
              <div className="stat-value gold">{fmt(totalRemaining)}</div>
            </div>
            <div className="form-group"><label>Donor ID</label><input value={form.donorId} onChange={upd("donorId")} placeholder="donor001" /></div>
            <div className="form-group">
              <label>Bank ID (for token query)</label>
              <select
                value={form.bankId}
                onChange={(e) => {
                  const selectedBankId = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    bankId: selectedBankId,
                    userCert: selectedBankId,
                  }));
                }}
              >
                <option value="">Select bank...</option>
                {dropdownBanks.map((bank) => (
                  <option key={bank?.bankId} value={bank?.bankId}>{bank?.name}</option>
                ))}
              </select>
              <span className="input-hint">{loadingBanks ? "Loading bank list..." : "Used to resolve tokens and auto-fill donation cert."}</span>
            </div>
            <div className="form-group">
              <label>Selected Fund</label>
              <input readOnly value={selectedFund ? `${selectedFund.title} (${selectedFund.fundId})` : ""} placeholder="Select a fund from the list..." />
            </div>
            <div className="form-group">
              <label>Token ID</label>
              <select value={form.tokenId} onChange={upd("tokenId")}>
                <option value="">Select token...</option>
                {(Array.isArray(tokens) ? tokens : []).map((token) => (
                  <option key={token?.tokenId} value={token?.tokenId}>
                    {token?.tokenId} (remaining: {token?.remainingAmount ?? token?.amount})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Amount (Tokens)</label>
              <input value={form.amount} onChange={upd("amount")} type="number" placeholder="e.g. 100" />
              <span className="input-hint">Must be ≤ selected token remaining amount</span>
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={loadBanks} disabled={loadingBanks}>
                {loadingBanks ? "Refreshing..." : "Refresh Banks"}
              </button>
              <button className="btn btn-secondary" onClick={loadTokens} disabled={loadingTokens || !form.donorId}>
                {loadingTokens ? "Loading Tokens..." : "Load Donor Tokens"}
              </button>
              <button className="btn btn-primary full-width" style={{ justifyContent:"center" }} onClick={handleDonate}>
                {submitting ? "Submitting..." : "♡ Donate Now"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
