import { useEffect, useState } from 'react';
import PageHeader from '../../../components/shared/PageHeader';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { ngoApi } from '../../../services/api';

const slugifyNgoId = (ngoId) => String(ngoId || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'ngo';
const generateFundId = (ngoId) => `fund-${slugifyNgoId(ngoId)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export default function CreateFunds() {
  const toast = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState({
    userCert: user?.userCert || '',
    ngoId: '',
    fundId: '',
    title: '',
    purpose: '',
    fundTarget: '',
  });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    setForm((prev) => {
      const nextNgoId = String(prev.ngoId || '').trim();
      if (!nextNgoId) {
        return prev.fundId ? { ...prev, fundId: '' } : prev;
      }

      const prefix = `fund-${slugifyNgoId(nextNgoId)}-`;
      if (prev.fundId && prev.fundId.startsWith(prefix)) {
        return prev;
      }

      return { ...prev, fundId: generateFundId(nextNgoId) };
    });
  }, [form.ngoId]);

  const onSubmit = async () => {
    if (!form.userCert || !form.ngoId || !form.title || !form.purpose || !form.fundTarget) {
      toast('User Cert, NGO ID, title, purpose and fund target are required', 'error');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, fundId: form.fundId || generateFundId(form.ngoId) };
      const response = await ngoApi.createFund(payload);
      const generatedId = response?.data?.generatedId || response?.data?.data?.fundId || payload.fundId;
      toast(`Fund created successfully${generatedId ? `: ${generatedId}` : ''}`, 'success');
      setForm((prev) => ({ ...prev, fundId: generateFundId(prev.ngoId), title: '', purpose: '', fundTarget: '' }));
    } catch (err) {
      toast(err?.response?.data?.error || err.message || 'Failed to create fund', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Create Fund" desc="Create a new NGO fund on the ledger" />
      <div className="card">
        <div className="form-grid section-gap">
          <div className="form-group"><label>User Cert</label><input name="userCert" value={form.userCert} onChange={onChange} placeholder="ngo001" /></div>
          <div className="form-group"><label>NGO ID</label><input name="ngoId" value={form.ngoId} onChange={onChange} placeholder="ngo2" /></div>
          <div className="form-group"><label>Fund ID</label><input name="fundId" value={form.fundId} readOnly placeholder="Auto-generated after NGO ID is entered" /></div>
          <div className="form-group"><label>Title</label><input name="title" value={form.title} onChange={onChange} placeholder="Medical Aid" /></div>
          <div className="form-group"><label>Purpose</label><input name="purpose" value={form.purpose} onChange={onChange} placeholder="Emergency treatment support" /></div>
          <div className="form-group"><label>Fund Target</label><input name="fundTarget" value={form.fundTarget} onChange={onChange} type="number" placeholder="5000" /></div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setForm((prev) => ({ ...prev, fundId: prev.ngoId ? generateFundId(prev.ngoId) : '', title: '', purpose: '', fundTarget: '' }))}>Clear</button>
            <button className="btn btn-primary" onClick={onSubmit} disabled={loading}>{loading ? 'Creating...' : 'Create Fund'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}