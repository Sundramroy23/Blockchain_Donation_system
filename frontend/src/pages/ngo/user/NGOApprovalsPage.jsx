import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE, approvalsApi, fundApi } from '../../../services/api';
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
  const [ngoFunds, setNgoFunds] = useState([]);
  const [fundsLoading, setFundsLoading] = useState(false);
  const [request, setRequest] = useState({ fundId: '', amount: '', description: '' });
  const [receiptImages, setReceiptImages] = useState([]);
  const [fundBalance, setFundBalance] = useState(null);
  const [fundBalanceLoading, setFundBalanceLoading] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [redeemingId, setRedeemingId] = useState('');
  const [splash, setSplash] = useState(null);

  const toNumberOrNull = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const sumAmountList = (list) => {
    if (!Array.isArray(list)) return null;
    return list.reduce((sum, item) => {
      const amount = Number(item?.amount);
      return Number.isFinite(amount) ? sum + amount : sum;
    }, 0);
  };

  const resolveFundAvailableBalance = (fund) => {
    const directCandidates = [
      toNumberOrNull(fund?.totalTokens),
      toNumberOrNull(fund?.currentAmount),
      toNumberOrNull(fund?.availableBalance),
      toNumberOrNull(fund?.balance),
    ].filter((value) => value != null && value >= 0);

    const donationsTotal = sumAmountList(fund?.donations);
    const expensesTotal = sumAmountList(fund?.expenses);
    const derivedFromEntries = donationsTotal != null
      ? Math.max(0, donationsTotal - (expensesTotal || 0))
      : null;

    const positive = directCandidates.filter((value) => value > 0);
    if (positive.length > 0) {
      return Math.max(...positive);
    }

    if (derivedFromEntries != null && derivedFromEntries > 0) {
      return derivedFromEntries;
    }

    return 0;
  };

  const readReceiptFiles = async (files) => Promise.all(
    Array.from(files || []).map((file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        name: file.name,
        mimeType: file.type,
        dataUrl: String(reader.result || ''),
      });
      reader.onerror = () => reject(reader.error || new Error('Failed to read receipt image'));
      reader.readAsDataURL(file);
    }))
  );

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

    const loadNgoFunds = async () => {
      if (!ngoId) {
        setNgoFunds([]);
        return;
      }

      setFundsLoading(true);
      try {
        const res = await fundApi.getByNGO(ngoId, { userCert: ngoId });
        const funds = Array.isArray(res?.data) ? res.data : [];
        if (!cancelled) {
          setNgoFunds(funds);
          if (request.fundId && !funds.some((fund) => String(fund?.fundId || '') === String(request.fundId))) {
            setRequest((prev) => ({ ...prev, fundId: '' }));
          }
        }
      } catch (err) {
        if (!cancelled) {
          setNgoFunds([]);
          setRequest((prev) => ({ ...prev, fundId: '' }));
        }
      } finally {
        if (!cancelled) {
          setFundsLoading(false);
        }
      }
    };

    loadNgoFunds();
    return () => {
      cancelled = true;
    };
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
          setFundBalance(resolveFundAvailableBalance(fund));
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
  const approvedBalance = Number(totals.remainingAmount ?? 0);

  const handleRequest = async (e) => {
    e.preventDefault();

    if (!ngoId) {
      toast('NGO ID is required', 'error');
      return;
    }
    if (!request.fundId) {
      toast('Please select a fund before requesting approval', 'error');
      return;
    }

    const requestedAmount = Number(request.amount);
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      toast('Requested amount must be greater than zero', 'error');
      return;
    }

    if (fundBalance != null && fundBalance > 0 && requestedAmount > fundBalance) {
      toast(`Insufficient fund balance. Available: ${fundBalance}, requested: ${requestedAmount}`, 'error');
      return;
    }

    if (!receiptImages.length) {
      toast('Upload at least one receipt image before requesting approval', 'error');
      return;
    }

    setSubmittingRequest(true);
    try {
      await approvalsApi.create({
        createdBy: ngoId,
        ngoId,
        fundId: request.fundId,
        amount: request.amount,
        description: request.description,
        note: 'Expense approval request',
        receiptImages,
      });
      setRequest({ fundId: '', amount: '', description: '' });
      setReceiptImages([]);
      await load();
      toast('Approval requested', 'success');
    } catch (err) {
      console.error(err);
      toast(err?.response?.data?.error || 'Failed to create approval', 'error');
    } finally {
      setSubmittingRequest(false);
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
              <label>Fund</label>
              <select value={request.fundId} onChange={(e) => setRequest((p) => ({ ...p, fundId: e.target.value }))} required>
                <option value="">Select fund...</option>
                {ngoFunds.map((fund) => (
                  <option key={fund?.fundId || fund?.id} value={fund?.fundId || ''}>
                    {fund?.fundId || 'Unknown fund'}{fund?.title ? ` - ${fund.title}` : ''}
                  </option>
                ))}
              </select>
              <span className="input-hint">
                {fundsLoading
                  ? 'Loading NGO funds...'
                  : !ngoFunds.length
                    ? 'No funds available for this NGO. Create a fund first.'
                    : fundBalanceLoading
                      ? 'Checking fund balance...'
                  : fundBalance != null
                    ? `Available balance: ${fundBalance}`
                    : 'Select a fund to see available balance'}
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
              <div className="form-group full">
                <label>Receipt Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (event) => {
                    try {
                      const files = event.target.files || [];
                      const images = await readReceiptFiles(files);
                      setReceiptImages(images);
                    } catch (error) {
                      console.error(error);
                      toast('Unable to read one or more receipt images', 'error');
                    }
                  }}
                />
                <span className="input-hint">
                  Upload clear receipt photos. Stored locally and cleared when the network is stopped.
                </span>
                {receiptImages.length > 0 && (
                  <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                    <div className="text-dim">{receiptImages.length} receipt image(s) selected</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {receiptImages.map((image) => (
                        <figure key={image.name} style={{ margin: 0, width: 120 }}>
                          <img
                            src={image.dataUrl}
                            alt={image.name}
                            style={{ width: '100%', height: 96, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border)' }}
                          />
                          <figcaption style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6, wordBreak: 'break-word' }}>{image.name}</figcaption>
                        </figure>
                      ))}
                    </div>
                    <button className="btn btn-secondary" type="button" onClick={() => setReceiptImages([])}>Clear receipts</button>
                  </div>
                )}
              </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={submittingRequest || fundBalanceLoading || fundsLoading}>
                {submittingRequest ? 'Requesting...' : 'Request Approval'}
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 10 }}>Approval Summary</div>
          <div style={{ display: 'grid', gap: 12 }}>
              <div className="stat-card gold"><div className="stat-label">Total Requested</div><div className="stat-value gold">{totals.requestedAmount ?? 0}</div></div>
              <div className="stat-card"><div className="stat-label">Pending Requests</div><div className="stat-value">{totals.pendingAmount ?? 0}</div></div>
              <div className="stat-card"><div className="stat-label">Approved Balance</div><div className="stat-value">{approvedBalance}</div></div>
            <div className="stat-card"><div className="stat-label">Redeemed Amount</div><div className="stat-value">{totals.redeemedAmount ?? 0}</div></div>
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
                <th style={{ textAlign: 'left' }}>Receipts</th>
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
                  <td>
                    {Array.isArray(approval.receipts) && approval.receipts.length > 0 ? (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {approval.receipts.map((receipt) => (
                          <a
                            key={receipt.receiptId || receipt.fileUrl}
                            href={`${API_BASE}${receipt.fileUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            title={receipt.fileName || receipt.receiptId}
                          >
                            <img
                              src={`${API_BASE}${receipt.fileUrl}`}
                              alt={receipt.fileName || receipt.receiptId || 'receipt'}
                              style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }}
                            />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-dim">No receipts</span>
                    )}
                  </td>
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