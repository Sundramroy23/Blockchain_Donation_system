import { useState } from 'react';
import PageHeader from '../../../components/shared/PageHeader';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { ngoApi } from '../../../services/api';

export default function CreateFunds() {
  const toast = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState({
    userCert: user?.userCert || '',
    fundId: '',
    ngoId: '',
    title: '',
    purpose: '',
    fundTarget: '',
  });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async () => {
    if (!form.userCert || !form.fundId || !form.ngoId || !form.title || !form.purpose || !form.fundTarget) {
      toast('All fields are required', 'error');
      return;
    }
    setLoading(true);
    try {
      await ngoApi.createFund(form);
      toast('Fund created successfully', 'success');
      setForm((prev) => ({ ...prev, fundId: '', title: '', purpose: '', fundTarget: '' }));
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
          <div className="form-group"><label>Fund ID</label><input name="fundId" value={form.fundId} onChange={onChange} placeholder="fund001" /></div>
          <div className="form-group"><label>NGO ID</label><input name="ngoId" value={form.ngoId} onChange={onChange} placeholder="ngo2" /></div>
          <div className="form-group"><label>Title</label><input name="title" value={form.title} onChange={onChange} placeholder="Medical Aid" /></div>
          <div className="form-group"><label>Purpose</label><input name="purpose" value={form.purpose} onChange={onChange} placeholder="Emergency treatment support" /></div>
          <div className="form-group"><label>Fund Target</label><input name="fundTarget" value={form.fundTarget} onChange={onChange} type="number" placeholder="5000" /></div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setForm((prev) => ({ ...prev, fundId: '', title: '', purpose: '', fundTarget: '' }))}>Clear</button>
            <button className="btn btn-primary" onClick={onSubmit} disabled={loading}>{loading ? 'Creating...' : 'Create Fund'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}