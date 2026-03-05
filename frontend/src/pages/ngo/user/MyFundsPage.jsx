import { useState } from 'react';
import PageHeader from '../../../components/shared/PageHeader';
import DataTable from '../../../components/shared/DataTable';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { ngoApi } from '../../../services/api';

export default function CreateFundsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [userCert, setUserCert] = useState(user?.userCert || '');
  const [loading, setLoading] = useState(false);
  const [funds, setFunds] = useState([]);

  const onSubmit = async () => {
    setLoading(true);
    setFunds([]);
    try {
      const res = await ngoApi.getAllFunds({ userCert });
      const data = res?.data ?? res;
      if (!data || (Array.isArray(data) && data.length === 0)) {
        toast('No funds found for this UserCert.', 'info');
      } else {
        setFunds(Array.isArray(data) ? data : [data]);
      }
    } catch (err) {
      toast(err?.response?.data?.error || err.message || 'Failed to fetch funds', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="My Funds" desc="View all funds linked to your NGO context" />
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 240 }}>
            <label>User Cert</label>
            <input value={userCert} onChange={(e) => setUserCert(e.target.value)} placeholder="ngo001" />
          </div>
          <button className="btn btn-primary" onClick={onSubmit} disabled={loading || !userCert}>
            {loading ? 'Fetching...' : 'Fetch Funds'}
          </button>
        </div>
      </div>

      {funds.length > 0 && (
        <div className="card">
          <DataTable
            columns={[
              { key: 'fundId', label: 'Fund ID', mono: true },
              { key: 'ngoId', label: 'NGO ID', mono: true },
              { key: 'title', label: 'Title' },
              { key: 'purpose', label: 'Purpose' },
              { key: 'fundTarget', label: 'Target' },
              { key: 'totalTokens', label: 'Raised' },
              { key: 'status', label: 'Status', mono: true },
            ]}
            data={funds}
          />
        </div>
      )}
    </div>
  );
}