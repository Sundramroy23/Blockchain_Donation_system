import { useState } from 'react';
import PageHeader from '../../../components/shared/PageHeader';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { ngoApi } from '../../../services/api';

export default function RegisterNGO() {
  const toast = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState({
    userCert: user?.userCert || '',
    ngoId: '',
    name: '',
    regNo: '',
    address: '',
    contact: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async () => {
    if (!form.userCert || !form.name || !form.regNo || !form.address || !form.contact || !form.description) {
      toast('User Cert, name, reg no, address, contact and description are required', 'error');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        ngoId: String(form.ngoId || '').trim(),
      };
      if (!payload.ngoId) {
        delete payload.ngoId;
      }

      const response = await ngoApi.registerNGO(payload);
      const generatedId = response?.data?.generatedId || response?.data?.data?.ngoId;
      toast(`NGO registered successfully${generatedId ? `: ${generatedId}` : ''}`, 'success');
      setForm((prev) => ({ ...prev, ngoId: '', name: '', regNo: '', address: '', contact: '', description: '' }));
    } catch (err) {
      toast(err?.response?.data?.error || err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Register NGO" desc="Onboard NGO identity on the blockchain registry" />
      <div className="card">
        <div className="form-grid section-gap">
          <div className="form-group"><label>User Cert</label><input name="userCert" value={form.userCert} onChange={onChange} placeholder="ngoAdmin" /></div>
          <div className="form-group"><label>NGO ID (optional)</label><input name="ngoId" value={form.ngoId} onChange={onChange} placeholder="Leave empty for auto ID" /></div>
          <div className="form-group"><label>Name</label><input name="name" value={form.name} onChange={onChange} placeholder="Helping Hands" /></div>
          <div className="form-group"><label>Reg No</label><input name="regNo" value={form.regNo} onChange={onChange} placeholder="NGO-2026-001" /></div>
          <div className="form-group"><label>Address</label><input name="address" value={form.address} onChange={onChange} placeholder="Mumbai" /></div>
          <div className="form-group"><label>Contact</label><input name="contact" value={form.contact} onChange={onChange} placeholder="+91-9999999999" /></div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={onChange} placeholder="Mission and focus area" />
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setForm((prev) => ({ ...prev, ngoId: '', name: '', regNo: '', address: '', contact: '', description: '' }))}>Clear</button>
            <button className="btn btn-primary" onClick={onSubmit} disabled={loading}>{loading ? 'Registering...' : 'Register NGO'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
