import React, { useEffect, useState } from 'react';
import { API_BASE, approvalsApi } from '../../services/api';
import PageHeader from '../../components/shared/PageHeader';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function ApprovalsPage() {
  const toast = useToast();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const canApprove = (user && (user.role === 'ngoAdmin' || user.role === 'admin'));
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [modalApprovalId, setModalApprovalId] = useState(null);
  const [modalVerificationNote, setModalVerificationNote] = useState('');
  const [approving, setApproving] = useState(false);
  const [openNoteFor, setOpenNoteFor] = useState(null);
  const [openDescriptionFor, setOpenDescriptionFor] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await approvalsApi.list();
      setApprovals(res.data || []);
    } catch (err) {
      console.error(err);
      toast(err?.response?.data?.error || 'Failed to load approvals', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = (approvalId) => {
    // Open themed modal instead of browser confirm/prompt
    setModalApprovalId(approvalId);
    setModalVerificationNote('');
    setApproveModalOpen(true);
  };

  const confirmApprove = async () => {
    const approvalId = modalApprovalId;
    const adminCert = window.localStorage.getItem('userCert') || 'ngoAdmin';
    setApproving(true);
    try {
      await approvalsApi.approve({ approvalId, adminCert, verificationNote: modalVerificationNote });
      setApproveModalOpen(false);
      setModalApprovalId(null);
      await load();
      toast('Approved', 'success');
    } catch (err) {
      console.error(err);
      toast(err?.response?.data?.error || 'Approve failed', 'error');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Approvals (Admin)" />
      <div>
        {approveModalOpen && (
          <div style={{position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center', background: 'rgba(5,8,16,0.6)'}}>
            <div style={{ width: 'min(560px, calc(100vw - 32px))', padding: 20, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Approve request</div>
              <div style={{ color: 'var(--text-2)', marginBottom: 12 }}>Approval Id: {modalApprovalId}</div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Verification note (optional)</label>
                <textarea value={modalVerificationNote} onChange={(e) => setModalVerificationNote(e.target.value)} rows={4} style={{ width: '100%', padding: 8, borderRadius: 8 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => { setApproveModalOpen(false); setModalApprovalId(null); }} disabled={approving}>Cancel</button>
                <button className="btn btn-primary" onClick={confirmApprove} disabled={approving}>{approving ? 'Approving...' : 'Approve'}</button>
              </div>
            </div>
          </div>
        )}
        {loading && <div>Loading...</div>}
        {!loading && approvals.length === 0 && <div>No approvals</div>}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Id</th>
              <th>Token</th>
              <th>NGO</th>
              <th>Amount</th>
              <th>Receipts</th>
              <th>Status</th>
              <th>Verified</th>
              <th>Note</th>
              <th>Description</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {approvals.map((a) => (
              <tr key={a.approvalId}>
                <td>{a.approvalId}</td>
                <td>{a.tokenId}</td>
                <td>{a.ngoId}</td>
                <td>{a.amount}</td>
                <td>
                  {Array.isArray(a.receipts) && a.receipts.length > 0 ? (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {a.receipts.map((receipt) => (
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
                            style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }}
                          />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <span className="text-dim">None</span>
                  )}
                </td>
                <td>{a.status}</td>
                <td>{a.verifiedAt ? `Yes (${a.verifiedBy || 'admin'})` : 'Pending'}</td>
                <td>
                  {String(a.verificationNote || '').trim() ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        type="button"
                        onClick={() => setOpenNoteFor((prev) => (prev === a.approvalId ? null : a.approvalId))}
                        style={{ minWidth: 28, padding: '4px 8px', fontWeight: 700 }}
                        title="View verification note"
                      >
                        i
                      </button>
                      {openNoteFor === a.approvalId && (
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 6px)',
                          width: 260,
                          background: 'var(--bg-surface)',
                          color: 'var(--text-1)',
                          border: '1px solid var(--border-lit)',
                          borderRadius: 10,
                          padding: 10,
                          zIndex: 10,
                          boxShadow: 'var(--shadow)'
                        }}>
                          <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Verification note</div>
                          <div style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>{a.verificationNote}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-dim">-</span>
                  )}
                </td>
                <td>
                  {String(a.description || '').trim() ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        type="button"
                        onClick={() => setOpenDescriptionFor((prev) => (prev === a.approvalId ? null : a.approvalId))}
                        style={{ minWidth: 28, padding: '4px 8px', fontWeight: 700 }}
                        title="View NGO description"
                      >
                        i
                      </button>
                      {openDescriptionFor === a.approvalId && (
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 6px)',
                          width: 260,
                          background: 'var(--bg-surface)',
                          color: 'var(--text-1)',
                          border: '1px solid var(--border-lit)',
                          borderRadius: 10,
                          padding: 10,
                          zIndex: 10,
                          boxShadow: 'var(--shadow)'
                        }}>
                          <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>NGO description</div>
                          <div style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>{a.description}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-dim">-</span>
                  )}
                </td>
                <td>{a.createdAt}</td>
                <td>
                  {a.status === 'PENDING' && canApprove && (
                    <button className="btn btn-primary btn-sm" type="button" onClick={() => handleApprove(a.approvalId)}>Approve</button>
                  )}
                  {a.status === 'PENDING' && !canApprove && (
                    <span className="text-dim">Read-only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
