import React, { useEffect, useMemo, useState } from 'react';
import { approvalsApi, fundApi } from '../../../services/api';
import PageHeader from '../../../components/shared/PageHeader';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

function SuccessSplash({ amount, onClose }) {
  useEffect(() => {
    const id = setTimeout(onClose, 2200);
    return () => clearTimeout(id);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center',
      background: 'rgba(5,8,16,0.72)', backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        width: 'min(520px, calc(100vw - 32px))', padding: 28, borderRadius: 20,
        background: 'linear-gradient(135deg, rgba(11,18,32,0.96), rgba(21,28,44,0.96))',
        border: '1px solid rgba(79, 210, 143, 0.3)', boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 12 }}>✓</div>
        <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Payment successful</div>
        <div style={{ color: 'var(--text-dim)', marginBottom: 18 }}>
          {amount} has been redeemed from the approved amount.
        </div>
        <button className="btn btn-primary" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default function NGOApprovalsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [ngoId, setNgoId] = useState(String(user?.userCert || window.localStorage.getItem('ngoId') || '').trim());
  const [data, setData] = useState(null);
  const [request, setRequest] = useState({ fundId: '', amount: '', description: '' });
  const [fundBalance, setFundBalance] = useState(null);
  const [fundBalanceLoading, setFundBalanceLoading] = useState(false);
  const [redeemingId, setRedeemingId] = useState('');
  const [splash, setSplash] = useState(null);

  const load = async (value = ngoId) => {
    if (!value) return;
    try {
      const res = await approvalsApi.ngoApprovals(value);
      setData(res.data || res);
    } catch (err) {
      console.error(err);
      toast(err?.response?.data?.error || 'Failed to load approvals', 'error');
    }
  };

  useEffect(() => {
    const resolved = String(user?.userCert || window.localStorage.getItem('ngoId') || '').trim();
    setNgoId(resolved);
  }, [user?.userCert]);

  useEffect(() => {
    if (!ngoId) return;
    load(ngoId);
    const intervalId = setInterval(() => load(ngoId), 8000);
    return () => clearInterval(intervalId);
  }, [ngoId]);

  useEffect(() => {
    let cancelled = false;

    const loadFundBalance = async () => {
      if (!request.fundId || !ngoId) {
        setFundBalance(null);
        return;
      }

      setFundBalanceLoading(true);
      try {
        const res = await fundApi.getFund(request.fundId, { userCert: ngoId });
        const fund = res?.data || {};
        if (!cancelled) {
          setFundBalance(Number(fund?.totalTokens ?? fund?.currentAmount ?? fund?.raised ?? 0));
        }
      } catch (err) {
        if (!cancelled) {
          setFundBalance(null);
        }
      } finally {
        if (!cancelled) {
          setFundBalanceLoading(false);
        }
      }
    };

    loadFundBalance();
    return () => {
      cancelled = true;
    };
  }, [request.fundId, ngoId]);

  const totals = useMemo(() => data?.totals || {}, [data]);

  const handleRequest = async (e) => {
    e.preventDefault();
    const requestedAmount = Number(request.amount);
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      toast('Requested amount must be greater than zero', 'error');
      return;
    }

    if (fundBalance != null && requestedAmount > fundBalance) {
      toast(`Insufficient fund balance. Available: ${fundBalance}, requested: ${requestedAmount}`, 'error');
      return;
    }

    try {
      await approvalsApi.create({
        createdBy: ngoId,
        ngoId,
        fundId: request.fundId,
        amount: request.amount,
        description: request.description,
        note: 'Expense approval request',
      });
      setRequest({ fundId: '', amount: '', description: '' });
      await load();
      toast('Approval requested', 'success');
    } catch (err) {
      console.error(err);
      toast(err?.response?.data?.error || 'Failed to create approval', 'error');
    }
  };

  const handleRedeem = async (approval) => {
    const amount = Number(approval.remainingAmount || 0);
    if (!amount) return;
    setRedeemingId(approval.approvalId);
    try {
      await approvalsApi.redeem({ approvalId: approval.approvalId, ngoId, amount });
      setSplash(amount);
      await load();
    } catch (err) {
      console.error(err);
      toast(err?.response?.data?.error || 'Redeem failed', 'error');
    } finally {
      setRedeemingId('');
    }
  };

  return (
    <div>
      {splash != null && <SuccessSplash amount={splash} onClose={() => setSplash(null)} />}
      <PageHeader title="NGO Approvals" desc="Request expense approval, then redeem approved allowance when ready" />

      <div className="grid-2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 10 }}>Request Expense Approval</div>
          <form onSubmit={handleRequest} className="form-grid section-gap">
            <div className="form-group">
              <label>NGO Id</label>
              <input value={ngoId} onChange={(e) => setNgoId(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Fund Id</label>
              <input value={request.fundId} onChange={(e) => setRequest((p) => ({ ...p, fundId: e.target.value }))} required />
              <span className="input-hint">
                {fundBalanceLoading
                  ? 'Checking fund balance...'
                  : fundBalance != null
                    ? `Available balance: ${fundBalance}`
                    : 'Enter a fund id to see available balance'}
              </span>
            </div>
            <div className="form-group">
              <label>Approved Amount Requested</label>
              <input type="number" step="0.01" value={request.amount} onChange={(e) => setRequest((p) => ({ ...p, amount: e.target.value }))} required />
              {fundBalance != null && (
                <span className="input-hint">
                  Requested amount should be {'<='} {fundBalance}
                </span>
              )}
            </div>
            <div className="form-group">
              <label>Description</label>
              <input value={request.description} onChange={(e) => setRequest((p) => ({ ...p, description: e.target.value }))} placeholder="Medicine, transport, food..." />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={fundBalanceLoading || (fundBalance != null && Number(request.amount || 0) > fundBalance)}>
                Request Approval
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 10 }}>Balance Summary</div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="stat-card gold"><div className="stat-label">Requested Amount</div><div className="stat-value gold">{totals.requestedAmount ?? 0}</div></div>
            <div className="stat-card"><div className="stat-label">Approved Amount</div><div className="stat-value">{totals.approvedAmount ?? 0}</div></div>
            <div className="stat-card"><div className="stat-label">Redeemed Amount</div><div className="stat-value">{totals.redeemedAmount ?? 0}</div></div>
            <div className="stat-card"><div className="stat-label">Remaining Amount</div><div className="stat-value">{totals.remainingAmount ?? 0}</div></div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title" style={{ marginBottom: 10 }}>Approval Activity</div>
        {!data?.approvals?.length ? (
          <div className="text-dim">No approvals yet</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Id</th>
                <th style={{ textAlign: 'left' }}>Fund</th>
                <th style={{ textAlign: 'left' }}>Requested</th>
                <th style={{ textAlign: 'left' }}>Approved</th>
                <th style={{ textAlign: 'left' }}>Remaining</th>
                <th style={{ textAlign: 'left' }}>Status</th>
                <th style={{ textAlign: 'left' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.approvals.map((approval) => (
                <tr key={approval.approvalId}>
                  <td>{approval.approvalId}</td>
                  <td>{approval.fundId}</td>
                  <td>{approval.amount}</td>
                  <td>{approval.approvedAmount || 0}</td>
                  <td>{approval.remainingAmount || 0}</td>
                  <td>{approval.status}</td>
                  <td>
                    {String(approval.status).toUpperCase() === 'APPROVED' && Number(approval.remainingAmount || 0) > 0 ? (
                      <button className="btn btn-primary" onClick={() => handleRedeem(approval)} disabled={redeemingId === approval.approvalId}>
                        {redeemingId === approval.approvalId ? 'Redeeming...' : 'Redeem'}
                      </button>
                    ) : (
                      <span className="text-dim">{approval.status === 'REDEEMED' ? 'Completed' : 'Waiting approval'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}