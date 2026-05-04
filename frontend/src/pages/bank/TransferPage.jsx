// src/pages/bank/TransferPage.jsx
import { useEffect, useMemo, useState }  from "react";
import { useToast }  from "../../context/ToastContext";
import { useAuth }   from "../../context/AuthContext";
import PageHeader    from "../../components/shared/PageHeader";
import DataTable     from "../../components/shared/DataTable";
import { ngoApi, tokenApi }  from "../../services/api";

const fmt = (n) => n?.toLocaleString() ?? "–";

export default function TransferPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState({ userCert: user?.userCert || "govUserTom", tokenId:"", toId:"" });
  const [loading, setLoading] = useState(false);
  const [loadingNgos, setLoadingNgos] = useState(false);
  const [ngos, setNgos] = useState([]);
  const [bankTokens, setBankTokens] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingBankTokens, setLoadingBankTokens] = useState(false);
  const upd = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const transferableTokens = useMemo(() => (
    (bankTokens || []).filter((token) => {
      if (!token || typeof token !== "object") return false;
      const status = String(token.status || "").toUpperCase();
      const remaining = Number(token?.remainingAmount ?? token?.amount ?? 0);
      return status === "ISSUED" && Number.isFinite(remaining) && remaining > 0;
    })
  ), [bankTokens]);

  const ngoOptions = useMemo(() => {
    const mapped = (ngos || [])
      .map((ngo) => ({ ngoId: String(ngo?.ngoId || "").trim(), name: ngo?.name || ngo?.ngoId || "Unknown NGO" }))
      .filter((ngo) => ngo.ngoId);

    if (form.toId && !mapped.some((ngo) => ngo.ngoId === form.toId)) {
      mapped.unshift({ ngoId: form.toId, name: `${form.toId} (manual)` });
    }
    return mapped;
  }, [ngos, form.toId]);

  const loadNgos = async () => {
    if (!form.userCert) {
      setNgos([]);
      return;
    }
    setLoadingNgos(true);
    try {
      const res = await ngoApi.getAll({ userCert: form.userCert });
      setNgos(res.data || []);
    } catch (err) {
      setNgos([]);
      toast(err?.response?.data?.error || err.message || "Failed to load NGO registry", "error");
    } finally {
      setLoadingNgos(false);
    }
  };

  const loadBankTokens = async () => {
    if (!form.userCert) {
      setBankTokens([]);
      return;
    }
    setLoadingBankTokens(true);
    try {
      const res = await tokenApi.getByBank({ userCert: form.userCert, bankId: form.userCert });
      const list = Array.isArray(res?.data?.data)
        ? res.data.data
        : (Array.isArray(res?.data) ? res.data : []);
      setBankTokens(list);
      if (!form.tokenId && list.length > 0) {
        const firstTransferable = list.find((token) => {
          const status = String(token?.status || "").toUpperCase();
          const remaining = Number(token?.remainingAmount ?? token?.amount ?? 0);
          return status === "ISSUED" && Number.isFinite(remaining) && remaining > 0;
        });
        if (firstTransferable?.tokenId) {
          setForm((prev) => ({ ...prev, tokenId: firstTransferable.tokenId }));
        }
      }
    } catch (err) {
      setBankTokens([]);
      toast(err?.response?.data?.error || err.message || "Failed to load bank tokens", "error");
    } finally {
      setLoadingBankTokens(false);
    }
  };

  useEffect(() => {
    if (form.userCert) {
      loadNgos();
      loadBankTokens();
    }
  }, []);

  useEffect(() => {
    if (form.userCert) {
      loadBankTokens();
    }
  }, [form.userCert]);

  const handleTransfer = async () => {
    if (!form.userCert || !form.tokenId || !form.toId) {
      toast("UserCert, tokenId and toId are required", "error");
      return;
    }

    const selected = transferableTokens.find((token) => token?.tokenId === form.tokenId);
    if (!selected) {
      toast("Selected token is not transferable. Choose an ISSUED token with remaining balance.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await tokenApi.transfer(form);
      const record = res?.data?.data || res?.data;
      setHistory((prev) => [record, ...prev].slice(0, 10));
      toast("Token transferred successfully", "success");
      setForm((prev) => ({ ...prev, tokenId: "", toId: "" }));
      await loadBankTokens();
    } catch (err) {
      toast(err?.response?.data?.error || err.message || "Transfer failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Transfer Tokens" desc="Move tokens between wallets on the ledger" />
      <div className="grid-2">
        <div className="card">
          <div className="form-grid section-gap">
            <div className="form-group"><label>User Cert</label><input value={form.userCert} onChange={upd("userCert")} placeholder="bank001" /></div>
            <div className="form-group">
              <label>Token ID</label>
              <select value={form.tokenId} onChange={upd("tokenId")}>
                <option value="">Select token...</option>
                {transferableTokens.map((token) => (
                  <option key={token?.tokenId} value={token?.tokenId}>
                    {token?.tokenId} (status: {token?.status}, remaining: {token?.remainingAmount ?? token?.amount})
                  </option>
                ))}
              </select>
              <span className="input-hint">{loadingBankTokens ? "Loading bank tokens..." : "Only ISSUED tokens with balance are shown."}</span>
            </div>
            <div className="form-group">
              <label>To ID (NGO ID)</label>
              <input list="ngo-id-list" value={form.toId} onChange={upd("toId")} placeholder="ngo2" />
              <datalist id="ngo-id-list">
                {ngoOptions.map((ngo) => (
                  <option key={ngo.ngoId} value={ngo.ngoId}>{ngo.name}</option>
                ))}
              </datalist>
              <span className="input-hint">{loadingNgos ? "Loading NGO list..." : "You can type manually or choose from suggestions."}</span>
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setForm((prev) => ({ ...prev, tokenId: "", toId: "" }))}>Clear</button>
              <button className="btn btn-secondary" onClick={loadNgos} disabled={loadingNgos || !form.userCert}>
                {loadingNgos ? "Refreshing..." : "Refresh NGOs"}
              </button>
              <button className="btn btn-secondary" onClick={loadBankTokens} disabled={loadingBankTokens || !form.userCert}>
                {loadingBankTokens ? "Refreshing..." : "Refresh Tokens"}
              </button>
              <button className="btn btn-primary" onClick={handleTransfer} disabled={loading}>{loading ? "Submitting..." : "Submit Transfer ⇄"}</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom:14 }}>Recent Transfers</div>
          <DataTable
            columns={[
              { key:"tokenId", label:"Token", mono:true },
              { key:"ownerId", label:"Owner" },
              { key:"toId",    label:"To ID" },
              { key:"amount", label:"Amount", render:(r) => <span className="text-gold">{fmt(r.amount)}</span> },
              { key:"status", label:"Status", mono:true },
            ]}
            data={history}
          />
        </div>
      </div>
    </div>
  );
}
