import { useMemo, useState } from 'react';
import PageHeader from '../../../components/shared/PageHeader';
import DataTable from '../../../components/shared/DataTable';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { fundApi } from '../../../services/api';

export default function CreateFundsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const userCert = useMemo(() => String(user?.userCert || '').trim(), [user?.userCert]);
  const ngoId = userCert;
  const [loading, setLoading] = useState(false);
  const [funds, setFunds] = useState([]);

  const onSubmit = async () => {
    if (!userCert || !ngoId) {
      toast('Current NGO certificate is required', 'error');
      return;
    }

    setLoading(true);
    setFunds([]);
    try {
      const res = await fundApi.getByNGO(ngoId, { userCert });
      const data = res?.data ?? [];
      if (!data || (Array.isArray(data) && data.length === 0)) {
        toast('No funds found for current NGO.', 'info');
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
            <input value={userCert} disabled placeholder="ngo001" />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 240 }}>
            <label>Resolved NGO ID</label>
            <input value={ngoId} disabled placeholder="Derived from login cert" />
          </div>
          <button className="btn btn-primary" onClick={onSubmit} disabled={loading || !userCert || !ngoId}>
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