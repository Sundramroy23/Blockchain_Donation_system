import { useState } from 'react';
import PageHeader from '../../../components/shared/PageHeader';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { fundApi } from '../../../services/api';

export default function DonateFundPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState({
    userCert: user?.userCert || '',
    fundId: '',
    donorId: '',
    tokenId: '',
    amount: '',
  });
  const [loading, setLoading] = useState(false);

  const onChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async () => {
    if (!form.userCert || !form.fundId || !form.donorId || !form.tokenId || !form.amount) {
      toast('All fields are required', 'error');
      return;
    }
    setLoading(true);

    try {
      await fundApi.donate(form);
      toast('Donation successful', 'success');
      setForm((prev) => ({ ...prev, tokenId: '', amount: '' }));
    } catch (err) {
      toast(err?.response?.data?.error || err.message || 'Donation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Donate to Fund" desc="Submit a donation record to a specific fund" />
      <div className="card">
        <div className="form-grid section-gap">
          <div className="form-group"><label>User Cert</label><input name="userCert" value={form.userCert} onChange={onChange} placeholder="donor001" /></div>
          <div className="form-group"><label>Fund ID</label><input name="fundId" value={form.fundId} onChange={onChange} placeholder="fund001" /></div>
          <div className="form-group"><label>Donor ID</label><input name="donorId" value={form.donorId} onChange={onChange} placeholder="donor001" /></div>
          <div className="form-group"><label>Token ID</label><input name="tokenId" value={form.tokenId} onChange={onChange} placeholder="TOKEN_bank001_donor001_..." /></div>
          <div className="form-group"><label>Amount</label><input name="amount" value={form.amount} onChange={onChange} type="number" placeholder="300" /></div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setForm((prev) => ({ ...prev, tokenId: '', amount: '' }))}>Clear</button>
            <button className="btn btn-primary" onClick={onSubmit} disabled={loading}>{loading ? 'Submitting...' : 'Submit Donation'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}