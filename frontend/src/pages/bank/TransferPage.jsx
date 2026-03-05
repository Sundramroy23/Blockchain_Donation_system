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
  const [form, setForm] = useState({ userCert: user?.userCert || "", tokenId:"", toId:"" });
  const [loading, setLoading] = useState(false);
  const [loadingNgos, setLoadingNgos] = useState(false);
  const [ngos, setNgos] = useState([]);
  const [history, setHistory] = useState([]);
  const upd = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

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

  useEffect(() => {
    if (form.userCert) {
      loadNgos();
    }
  }, []);

  const handleTransfer = async () => {
    if (!form.userCert || !form.tokenId || !form.toId) {
      toast("UserCert, tokenId and toId are required", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await tokenApi.transfer(form);
      const record = res?.data?.data || res?.data;
      setHistory((prev) => [record, ...prev].slice(0, 10));
      toast("Token transferred successfully", "success");
      setForm((prev) => ({ ...prev, tokenId: "", toId: "" }));
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
            <div className="form-group"><label>Token ID</label><input value={form.tokenId} onChange={upd("tokenId")} placeholder="TOKEN_bank001_donor001_..." /></div>
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
