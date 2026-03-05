import { useState } from 'react';
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
  const [ngos, setNgos] = useState([]);

  const fetchNgos = async () => {
    if (!userCert) {
      toast('UserCert is required', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await ngoApi.getAllNGOs({ userCert });
      const data = res?.data ?? [];
      setNgos(Array.isArray(data) ? data : [data]);
      if (!data || (Array.isArray(data) && data.length === 0)) {
        toast('No NGOs found', 'info');
      }
    } catch (err) {
      toast(err?.response?.data?.error || err.message || 'Failed to fetch NGOs', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="NGO Details" desc="View NGO registry data from blockchain" />

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
            <label>User Cert</label>
            <input value={userCert} onChange={(e) => setUserCert(e.target.value)} placeholder="govUserTom" />
          </div>
          <button className="btn btn-primary" onClick={fetchNgos} disabled={loading || !userCert}>
            {loading ? 'Loading…' : 'Load NGOs'}
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
          data={ngos}
          emptyText="No NGO records found"
        />
      </div>
    </div>
  );
}
