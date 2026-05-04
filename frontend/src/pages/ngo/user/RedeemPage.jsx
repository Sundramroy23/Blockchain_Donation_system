// src/pages/ngo/user/RedeemPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../../context/ToastContext";
import PageHeader   from "../../../components/shared/PageHeader";
import { useAuth } from "../../../context/AuthContext";
import { fundApi, tokenApi } from "../../../services/api";

const fmt = (n) => n?.toLocaleString() ?? "–";

export default function RedeemPage() {
  const toast = useToast();
  const { user } = useAuth();
  const ngoId = useMemo(() => String(user?.userCert || "").trim(), [user?.userCert]);
  const [loading, setLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [funds, setFunds] = useState([]);
  const [form, setForm] = useState({ fundId:"", tokenId:"", purpose:"" });
  const upd = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const myFunds = useMemo(
    () => (Array.isArray(funds) ? funds.filter((f) => String(f?.ngoId || "") === ngoId) : []),
    [funds, ngoId]
  );

  const openFunds = useMemo(
    () => myFunds.filter((f) => String(f?.status || "").toUpperCase() === "ACTIVE"),
    [myFunds]
  );

  const redeemableTokens = useMemo(() => {
    const tokens = [];
    for (const fund of openFunds) {
      const donations = Array.isArray(fund?.donations) ? fund.donations : [];
      for (const donation of donations) {
        const tokenId = String(donation?.tokenId || "").trim();
        if (!tokenId) continue;
        tokens.push({
          tokenId,
          fundId: fund?.fundId || "",
          fundTitle: fund?.title || fund?.fundId || "Fund",
          amount: Number(donation?.amount || 0),
          donorId: donation?.donorId || "",
        });
      }
    }
    const unique = new Map();
    for (const token of tokens) {
      if (!unique.has(token.tokenId)) {
        unique.set(token.tokenId, token);
      }
    }
    return Array.from(unique.values());
  }, [openFunds]);

  const loadFunds = async () => {
    if (!ngoId) {
      toast("Login certificate is required", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fundApi.getByNGO(ngoId, { userCert: ngoId });
      const list = Array.isArray(res?.data) ? res.data : [];
      setFunds(list);
      if (list.length === 0) {
        toast("No funds found for current NGO", "info");
      }
    } catch (error) {
      setFunds([]);
      toast(error?.response?.data?.error || error.message || "Failed to load NGO funds", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ngoId) {
      loadFunds();
    }
  }, [ngoId]);

  const handleRedeem = async () => {
    if (!ngoId || !form.tokenId) {
      toast("Token selection is required", "error");
      return;
    }

    setRedeeming(true);
    try {
      await tokenApi.redeem({ userCert: ngoId, tokenId: form.tokenId, ngoId });
      toast("Token redeemed successfully", "success");
      setForm({ fundId: "", tokenId: "", purpose: "" });
      await loadFunds();
    } catch (error) {
      toast(error?.response?.data?.error || error.message || "Redeem failed", "error");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div>
      <PageHeader title="Redeem Tokens" desc="Redeem tokens for the currently logged-in NGO" />
      <div className="grid-2">
        <div className="card">
          <div className="form-grid section-gap">
            <div className="form-group">
              <label>Fund</label>
              <select value={form.fundId} onChange={upd("fundId")}> 
                <option value="">Select fund...</option>
                {openFunds.map((f) => <option key={f.fundId} value={f.fundId}>{f.title || f.fundId}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Redeemable Token</label>
              <select value={form.tokenId} onChange={upd("tokenId")}> 
                <option value="">Select token...</option>
                {redeemableTokens
                  .filter((t) => !form.fundId || t.fundId === form.fundId)
                  .map((t) => (
                    <option key={t.tokenId} value={t.tokenId}>
                      {t.tokenId} ({t.fundTitle})
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label>Purpose</label>
              <textarea value={form.purpose} onChange={upd("purpose")} placeholder="Optional internal note for this redeem action" />
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setForm({ fundId: "", tokenId: "", purpose: "" })}>Clear</button>
              <button className="btn btn-secondary" onClick={loadFunds} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh Funds"}
              </button>
              <button className="btn btn-primary" onClick={handleRedeem} disabled={redeeming || !form.tokenId || !ngoId}>
                {redeeming ? "Redeeming..." : "Redeem Token ◈"}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom:4 }}>My NGO Fund Balances</div>
          <div style={{ marginTop:14 }}>
            {myFunds.map((f) => (
              <div key={f.fundId} style={{ display:"flex", justifyContent:"space-between", padding:"12px 0", borderBottom:"1px solid var(--border)" }}>
                <span style={{ fontSize:13 }}>{f.title || f.fundId}</span>
                <span style={{ color:"var(--gold)", fontFamily:"'DM Mono',monospace", fontWeight:600 }}>◈ {fmt(Number(f.totalTokens || f.currentAmount || 0))}</span>
              </div>
            ))}
            {myFunds.length === 0 && (
              <div style={{ color: "var(--text-muted)" }}>No funds found for current NGO certificate.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
