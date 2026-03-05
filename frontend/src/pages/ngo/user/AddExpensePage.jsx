import { useState } from 'react';
import PageHeader from '../../../components/shared/PageHeader';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { fundApi } from '../../../services/api';

export default function AddExpensePage() {
  const toast = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState({
    userCert: user?.userCert || '',
    fundId: '',
    description: '',
    amount: '',
    spenderId: '',
  });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async () => {
    if (!form.userCert || !form.fundId || !form.description || !form.amount || !form.spenderId) {
      toast('All fields are required', 'error');
      return;
    }
    setLoading(true);
    try {
      const { fundId, ...data } = form;
      await fundApi.addExpense(fundId, data);
      toast('Expense added successfully', 'success');
      setForm((prev) => ({ ...prev, description: '', amount: '', spenderId: '' }));
    } catch (err) {
      toast(err?.response?.data?.error || err.message || 'Failed to add expense', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Add Expense" desc="Record NGO fund spending on the ledger" />
      <div className="card">
        <div className="form-grid section-gap">
          <div className="form-group"><label>User Cert</label><input name="userCert" value={form.userCert} onChange={onChange} placeholder="ngo001" /></div>
          <div className="form-group"><label>Fund ID</label><input name="fundId" value={form.fundId} onChange={onChange} placeholder="fund001" /></div>
          <div className="form-group"><label>Description</label><input name="description" value={form.description} onChange={onChange} placeholder="Purchased medicine kits" /></div>
          <div className="form-group"><label>Amount</label><input name="amount" value={form.amount} onChange={onChange} type="number" placeholder="250" /></div>
          <div className="form-group"><label>Spender ID</label><input name="spenderId" value={form.spenderId} onChange={onChange} placeholder="vendor001" /></div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setForm((prev) => ({ ...prev, description: '', amount: '', spenderId: '' }))}>Clear</button>
            <button className="btn btn-primary" onClick={onSubmit} disabled={loading}>{loading ? 'Submitting...' : 'Add Expense'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}