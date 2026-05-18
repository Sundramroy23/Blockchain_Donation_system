// src/pages/ngo/user/RedeemPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../../context/ToastContext";
import PageHeader   from "../../../components/shared/PageHeader";
import { useAuth } from "../../../context/AuthContext";
import { approvalsApi, bankApi } from "../../../services/api";

const fmt = (n) => n?.toLocaleString() ?? "–";

export default function RedeemPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [ngoId, setNgoId] = useState(String(user?.userCert || window.localStorage.getItem('ngoId') || '').trim());
  const [loading, setLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [approvals, setApprovals] = useState([]);
  const [banks, setBanks] = useState([]);
  const [form, setForm] = useState({ approvalId: "", bankId: "", amount: "", purpose: "" });
  const upd = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const approvedTotal = useMemo(
    () => approvals.reduce((sum, item) => sum + Number(item?.approvedAmount || 0), 0),
    [approvals]
  );
  const remainingTotal = useMemo(
    () => approvals.reduce((sum, item) => sum + Number(item?.remainingAmount || 0), 0),
    [approvals]
  );
  const redeemedTotal = useMemo(
    () => approvals.reduce((sum, item) => sum + Number(item?.redeemedAmount || 0), 0),
    [approvals]
  );
  const redeemHistory = useMemo(
    () => approvals
      .filter((item) => Number(item?.redeemedAmount || 0) > 0)
      .sort((a, b) => new Date(b?.redeemedAt || b?.approvedAt || b?.createdAt || 0) - new Date(a?.redeemedAt || a?.approvedAt || a?.createdAt || 0)),
    [approvals]
  );

  useEffect(() => {
    const resolved = String(user?.userCert || window.localStorage.getItem('ngoId') || '').trim();
    setNgoId(resolved);
  }, [user?.userCert]);

  const loadApprovals = async () => {
    if (!ngoId) return;
    try {
      const res = await approvalsApi.ngoApprovals(ngoId);
      setApprovals(res.data?.approvals || res?.approvals || []);
    } catch (err) {
      setApprovals([]);
      toast(err?.response?.data?.error || err.message || 'Failed to load approvals', 'error');
    }
  };

  const loadBanks = async () => {
    try {
      const res = await bankApi.getAll();
      setBanks(res.data || res);
    } catch (err) {
      setBanks([]);
    }
  };

  useEffect(() => {
    if (ngoId) {
      setLoading(true);
      Promise.all([loadApprovals(), loadBanks()]).finally(() => setLoading(false));
      const intervalId = setInterval(() => {
        loadApprovals();
      }, 8000);
      return () => clearInterval(intervalId);
    }
  }, [ngoId]);

  const handleRedeem = async () => {
    if (!ngoId || !form.approvalId) {
      toast('Select an approval to redeem from', 'error');
      return;
    }
    const amt = Number(form.amount || 0);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast('Enter a valid amount to redeem', 'error');
      return;
    }

    const approval = approvals.find((a) => a.approvalId === form.approvalId);
    const remaining = Number(approval?.remainingAmount || 0);
    if (amt > remaining) {
      toast(`Requested amount exceeds remaining approved amount (${remaining})`, 'error');
      return;
    }

    setRedeeming(true);
    try {
      await approvalsApi.redeem({ approvalId: form.approvalId, ngoId, amount: amt, bankId: form.bankId });
      toast('Redeemed successfully', 'success');
      setForm({ approvalId: '', bankId: '', amount: '', purpose: '' });
      await loadApprovals();
    } catch (error) {
      toast(error?.response?.data?.error || error.message || 'Redeem failed', 'error');
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div>
      <PageHeader title="Redeem Tokens" desc="Redeem tokens for the currently logged-in NGO" />
      <div className="grid-2">
        <div className="card">
          <div className="card-title">Redeem Approved Amount</div>
          <div className="form-grid section-gap">
            <div className="form-group">
              <label>Approval</label>
              <select value={form.approvalId} onChange={(e) => setForm((p) => ({ ...p, approvalId: e.target.value }))}>
                <option value="">Select approval...</option>
                {approvals.filter((a) => a.status === 'APPROVED' && Number(a.remainingAmount || 0) > 0).map((a) => (
                  <option key={a.approvalId} value={a.approvalId}>{a.approvalId} — Remaining: {a.remainingAmount || 0}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Bank</label>
              <select value={form.bankId} onChange={(e) => setForm((p) => ({ ...p, bankId: e.target.value }))}>
                <option value="">Select bank...</option>
                {banks.map((b) => <option key={b.bankId || b.id || b.name} value={b.bankId || b.id || b.name}>{b.bankName || b.name || b.bankId}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Amount</label>
              <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Purpose</label>
              <textarea value={form.purpose} onChange={upd("purpose")} placeholder="Optional internal note for this redeem action" />
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setForm({ approvalId: '', bankId: '', amount: '', purpose: '' })}>Clear</button>
              <button className="btn btn-secondary" onClick={() => { setLoading(true); Promise.all([loadApprovals(), loadBanks()]).finally(() => setLoading(false)); }} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh"}
              </button>
              <button className="btn btn-primary" onClick={handleRedeem} disabled={redeeming || !form.approvalId || !ngoId}>
                {redeeming ? "Redeeming..." : "Redeem"}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 8 }}>Redeem Dashboard</div>
          <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
            <div className="stat-card"><div className="stat-label">Approved Amount</div><div className="stat-value">{fmt(approvedTotal)}</div></div>
            <div className="stat-card"><div className="stat-label">Remaining Amount</div><div className="stat-value">{fmt(remainingTotal)}</div></div>
            <div className="stat-card"><div className="stat-label">Redeemed Amount</div><div className="stat-value">{fmt(redeemedTotal)}</div></div>
          </div>

          <div className="card-title" style={{ marginBottom: 6 }}>Redeem Token History</div>
          <div style={{ maxHeight: 240, overflowY: 'auto', borderTop: '1px solid var(--border)' }}>
            {redeemHistory.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', padding: '10px 0' }}>No redeem activity yet.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Approval ID</th>
                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Fund</th>
                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Redeemed</th>
                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {redeemHistory.map((item) => (
                    <tr key={item.approvalId} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 0', fontSize: 12, color: 'var(--text-muted)' }}>{item.approvalId}</td>
                      <td style={{ padding: '8px 0' }}>{item.fundId || 'N/A'}</td>
                      <td style={{ padding: '8px 0', fontWeight: 600 }}>{fmt(Number(item.redeemedAmount || 0))}</td>
                      <td style={{ padding: '8px 0', fontSize: 12, color: 'var(--text-muted)' }}>
                        {item.redeemedAt ? new Date(item.redeemedAt).toLocaleString() : 'Timestamp unavailable'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
