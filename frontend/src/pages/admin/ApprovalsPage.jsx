import React, { useEffect, useState } from 'react';
import { approvalsApi } from '../../services/api';
import PageHeader from '../../components/shared/PageHeader';
import { useToast } from '../../context/ToastContext';

export default function ApprovalsPage() {
  const toast = useToast();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const handleApprove = async (approvalId) => {
    const adminCert = window.localStorage.getItem('userCert') || 'govAdmin';
    if (!confirm(`Approve ${approvalId} ?`)) return;
    try {
      await approvalsApi.approve({ approvalId, adminCert });
      await load();
      toast('Approved', 'success');
    } catch (err) {
      console.error(err);
      toast(err?.response?.data?.error || 'Approve failed', 'error');
    }
  };

  return (
    <div>
      <PageHeader title="Approvals (Admin)" />
      <div>
        {loading && <div>Loading...</div>}
        {!loading && approvals.length === 0 && <div>No approvals</div>}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Id</th>
              <th>Token</th>
              <th>NGO</th>
              <th>Amount</th>
              <th>Status</th>
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
                <td>{a.status}</td>
                <td>{a.createdAt}</td>
                <td>
                  {a.status === 'PENDING' && (
                    <button onClick={() => handleApprove(a.approvalId)}>Approve</button>
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
