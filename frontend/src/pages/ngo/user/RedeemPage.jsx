// src/pages/ngo/user/RedeemPage.jsx
import { useState } from "react";
import { useToast } from "../../../context/ToastContext";
import PageHeader   from "../../../components/shared/PageHeader";
import { funds }    from "../../../data/mockData";

const fmt = (n) => n?.toLocaleString() ?? "–";
const openFunds = funds.filter((f) => f.ngo === "NGO001" && f.status === "open");
const allMyFunds = funds.filter((f) => f.ngo === "NGO001");

export default function RedeemPage() {
  const toast = useToast();
  const [form, setForm] = useState({ fund:"", amount:"", bank:"", purpose:"" });
  const upd = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div>
      <PageHeader title="Redeem Tokens" desc="Convert fund tokens to fiat through an authorized bank" />
      <div className="grid-2">
        <div className="card">
          <div className="form-grid section-gap">
            <div className="form-group">
              <label>Fund</label>
              <select value={form.fund} onChange={upd("fund")}>
                <option value="">Select fund...</option>
                {openFunds.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Amount to Redeem</label><input value={form.amount} onChange={upd("amount")} type="number" placeholder="Token amount" /></div>
            <div className="form-group"><label>Bank Account / Reference</label><input value={form.bank} onChange={upd("bank")} placeholder="Receiving bank details" /></div>
            <div className="form-group"><label>Purpose</label><textarea value={form.purpose} onChange={upd("purpose")} placeholder="What will the funds be used for..." /></div>
            <div className="form-actions">
              <button className="btn btn-secondary">Clear</button>
              <button className="btn btn-primary" onClick={() => toast("Redemption request submitted for bank approval", "success")}>Request Redemption ◈</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom:4 }}>Token Balances by Fund</div>
          <div style={{ marginTop:14 }}>
            {allMyFunds.map((f) => (
              <div key={f.id} style={{ display:"flex", justifyContent:"space-between", padding:"12px 0", borderBottom:"1px solid var(--border)" }}>
                <span style={{ fontSize:13 }}>{f.name}</span>
                <span style={{ color:"var(--gold)", fontFamily:"'DM Mono',monospace", fontWeight:600 }}>◈ {fmt(f.raised)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
