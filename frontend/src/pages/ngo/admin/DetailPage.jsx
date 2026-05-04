import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../../components/shared/PageHeader';
import DataTable from '../../../components/shared/DataTable';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { ngoApi } from '../../../services/api';

export default function DetailPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [userCert, setUserCert] = useState(user?.userCert || '');
  const [loading, setLoading] = useState(false);
  const [ngo, setNgo] = useState(null);

  const resolvedNgoId = useMemo(() => String(user?.userCert || '').trim(), [user?.userCert]);

  const fetchNgo = async () => {
    if (!userCert) {
      toast('UserCert is required', 'error');
      return;
    }
    if (!resolvedNgoId) {
      toast('Unable to resolve NGO ID from current login certificate', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await ngoApi.getNGO({ userCert, ngoId: resolvedNgoId });
      const data = res?.data?.data ?? res?.data;
      if (!data || (Array.isArray(data) && data.length === 0)) {
        setNgo(null);
        toast('No NGO details found for current certificate', 'info');
        return;
      }
      setNgo(Array.isArray(data) ? data[0] : data);
    } catch (err) {
      setNgo(null);
      toast(err?.response?.data?.error || err.message || 'Failed to fetch NGO details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userCert && resolvedNgoId) {
      fetchNgo();
    }
  }, [userCert, resolvedNgoId]);

  return (
    <div>
      <PageHeader title="NGO Details" desc="View details for the currently logged-in NGO" />

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
            <label>User Cert</label>
            <input value={userCert} onChange={(e) => setUserCert(e.target.value)} placeholder="ngo001" />
          </div>
          <div className="form-group" style={{ minWidth: 220 }}>
            <label>Resolved NGO ID</label>
            <input value={resolvedNgoId} disabled placeholder="Derived from login cert" />
          </div>
          <button className="btn btn-primary" onClick={fetchNgo} disabled={loading || !userCert || !resolvedNgoId}>
            {loading ? 'Loading…' : 'Load My NGO'}
          </button>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={[
            { key: 'ngoId', label: 'NGO ID', mono: true },
            { key: 'name', label: 'Name' },
            { key: 'regNo', label: 'Reg No' },
            { key: 'address', label: 'Address' },
            { key: 'contact', label: 'Contact' },
            { key: 'description', label: 'Description' },
          ]}
          data={ngo ? [ngo] : []}
          emptyText="No NGO record found for current certificate"
        />
      </div>
    </div>
  );
}
