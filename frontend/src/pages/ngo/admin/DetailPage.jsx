import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../../components/shared/PageHeader';
import DataTable from '../../../components/shared/DataTable';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { approvalsApi, fundApi, ngoApi } from '../../../services/api';

const toSafeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getRaisedAmount = (fund) => {
  const fromTotalTokens = toSafeNumber(fund?.totalTokens);
  if (fromTotalTokens > 0) return fromTotalTokens;

  const fromCurrentAmount = toSafeNumber(fund?.currentAmount);
  if (fromCurrentAmount > 0) return fromCurrentAmount;

  if (Array.isArray(fund?.donations)) {
    return fund.donations.reduce((sum, item) => sum + toSafeNumber(item?.amount), 0);
  }

  return 0;
};

export default function DetailPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [userCert, setUserCert] = useState(user?.userCert || '');
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [ngo, setNgo] = useState(null);
  const [ngoList, setNgoList] = useState([]);
  const [selectedNgoId, setSelectedNgoId] = useState('');
  const [summary, setSummary] = useState({ donatedAmount: 0, approvedAmount: 0, redeemedAmount: 0 });

  const selectedNgo = useMemo(() => {
    return ngoList.find((item) => String(item?.ngoId || '').trim() === String(selectedNgoId || '').trim()) || null;
  }, [ngoList, selectedNgoId]);

  const loadNgoList = async () => {
    setLoadingList(true);
    try {
      const res = await ngoApi.getAll(userCert ? { userCert } : undefined);
      const list = Array.isArray(res?.data) ? res.data : [];
      setNgoList(list);

      if (!list.length) {
        setSelectedNgoId('');
        setNgo(null);
        toast('No NGOs found', 'info');
        return;
      }

      setSelectedNgoId((prev) => {
        if (prev && list.some((item) => String(item?.ngoId || '').trim() === String(prev).trim())) {
          return prev;
        }
        return String(list[0]?.ngoId || '').trim();
      });
    } catch (err) {
      setNgoList([]);
      setSelectedNgoId('');
      setNgo(null);
      toast(err?.response?.data?.error || err.message || 'Failed to load NGO list', 'error');
    } finally {
      setLoadingList(false);
    }
  };

  const fetchNgo = async (targetNgoId = selectedNgoId) => {
    if (!userCert) {
      toast('UserCert is required', 'error');
      return;
    }
    if (!targetNgoId) {
      toast('Please select an NGO', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await ngoApi.getNGO({ userCert, ngoId: targetNgoId });
      const data = res?.data?.data ?? res?.data;
      if (!data || (Array.isArray(data) && data.length === 0)) {
        setNgo(null);
        toast('No NGO details found for selected NGO', 'info');
        return;
      }
      setNgo(Array.isArray(data) ? data[0] : data);
    } catch (err) {
      // Fallback to list item details so UI still works if single-ngo query fails.
      if (selectedNgo) {
        setNgo(selectedNgo);
        toast('Loaded NGO details from list', 'info');
      } else {
        setNgo(null);
        toast(err?.response?.data?.error || err.message || 'Failed to fetch NGO details', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async (targetNgoId = selectedNgoId) => {
    if (!targetNgoId || !userCert) {
      setSummary({ donatedAmount: 0, approvedAmount: 0, redeemedAmount: 0 });
      return;
    }

    try {
      const [fundsRes, approvalsRes] = await Promise.all([
        fundApi.getByNGO(targetNgoId, { userCert }),
        approvalsApi.ngoApprovals(targetNgoId),
      ]);

      const funds = Array.isArray(fundsRes?.data) ? fundsRes.data : [];
      const donatedAmount = funds.reduce((sum, fund) => sum + getRaisedAmount(fund), 0);

      const approvalTotals = approvalsRes?.data?.totals || {};
      const approvedAmount = toSafeNumber(approvalTotals.approvedAmount);
      const redeemedAmount = toSafeNumber(approvalTotals.redeemedAmount);

      setSummary({ donatedAmount, approvedAmount, redeemedAmount });
    } catch (_) {
      setSummary({ donatedAmount: 0, approvedAmount: 0, redeemedAmount: 0 });
    }
  };

  useEffect(() => {
    if (user?.userCert) {
      setUserCert(user.userCert);
    }
  }, [user?.userCert]);

  useEffect(() => {
    if (userCert) {
      loadNgoList();
    }
  }, [userCert]);

  useEffect(() => {
    if (userCert && selectedNgoId) {
      fetchNgo(selectedNgoId);
      fetchSummary(selectedNgoId);
    }
  }, [userCert, selectedNgoId]);

  return (
    <div>
      <PageHeader title="NGO Details" desc="Select an NGO from the list and view complete details" />

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
            <label>User Cert</label>
            <input value={userCert} onChange={(e) => setUserCert(e.target.value)} placeholder="ngo001" />
          </div>
          <div className="form-group" style={{ minWidth: 220 }}>
            <label>Select NGO</label>
            <select value={selectedNgoId} onChange={(e) => setSelectedNgoId(e.target.value)} disabled={loadingList || !ngoList.length}>
              <option value="">Select NGO...</option>
              {ngoList.map((item) => {
                const id = String(item?.ngoId || '').trim();
                const name = String(item?.name || '').trim();
                return (
                  <option key={id || name} value={id}>
                    {id}{name ? ` - ${name}` : ''}
                  </option>
                );
              })}
            </select>
          </div>
          <button className="btn btn-secondary" onClick={loadNgoList} disabled={loadingList || !userCert}>
            {loadingList ? 'Refreshing...' : 'Refresh NGO List'}
          </button>
          <button className="btn btn-primary" onClick={() => fetchNgo(selectedNgoId)} disabled={loading || !userCert || !selectedNgoId}>
            {loading ? 'Loading…' : 'Load NGO Details'}
          </button>
        </div>
      </div>

      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3, minmax(160px, 1fr))', marginBottom: 16 }}>
        <div className="stat-card gold">
          <div className="stat-label">Donated Amount</div>
          <div className="stat-value gold">{summary.donatedAmount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Approved Amount</div>
          <div className="stat-value">{summary.approvedAmount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Redeemed Amount</div>
          <div className="stat-value">{summary.redeemedAmount}</div>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={[
            { key: 'ngoId', label: 'NGO ID', mono: true },
            { key: 'name', label: 'Name' },
            { key: 'regNo', label: 'Reg No' },
            { key: 'email', label: 'Email' },
            { key: 'address', label: 'Address' },
            { key: 'contact', label: 'Contact' },
            { key: 'status', label: 'Status', mono: true },
            { key: 'description', label: 'Description' },
          ]}
          data={ngo ? [ngo] : []}
          emptyText="No NGO record found for selected NGO"
        />
      </div>
    </div>
  );
}
