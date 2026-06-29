import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../../components/shared/PageHeader';
import DataTable from '../../../components/shared/DataTable';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { fundApi } from '../../../services/api';

export default function CreateFundsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const sessionUserCert = useMemo(() => String(user?.userCert || '').trim(), [user?.userCert]);
  const [userCert, setUserCert] = useState(sessionUserCert || 'ngo001');
  const [loading, setLoading] = useState(false);
  const [funds, setFunds] = useState([]);
  const [rawResponse, setRawResponse] = useState(null);

  useEffect(() => {
    setUserCert(sessionUserCert || 'ngo001');
  }, [sessionUserCert]);

  const onSubmit = async () => {
    const resolvedUserCert = String(userCert || '').trim();

    if (!resolvedUserCert) {
      toast('Current NGO certificate is required', 'error');
      return;
    }

    setLoading(true);
    setFunds([]);
    setRawResponse(null);
    try {
      const target = resolvedUserCert;
      const res = await fundApi.getByNGO(target, { userCert: target });
      setRawResponse(res?.data ?? res);
      const data = res?.data ?? [];
      const list = Array.isArray(data) ? data : (data ? [data] : []);
      if (!list || list.length === 0) {
        toast('No funds found for current NGO.', 'info');
      } else {
        setFunds(list);
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
            <input
              value={userCert}
              onChange={(e) => setUserCert(e.target.value)}
              placeholder="ngo001"
            />
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
      {funds.length === 0 && rawResponse && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, marginBottom: 8 }}>API Response (for debugging)</div>
          <pre style={{ maxHeight: 240, overflow: 'auto', background: 'var(--bg-muted)', padding: 12 }}>{JSON.stringify(rawResponse, null, 2)}</pre>
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        <Link to="/ngo/approvals">View Approvals</Link>
      </div>
    </div>
  );
}