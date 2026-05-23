import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../../components/shared/PageHeader';
import DataTable from '../../../components/shared/DataTable';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { ngoApi } from '../../../services/api';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const regNoRegex = /^[A-Za-z0-9\-/]{3,40}$/;
const contactRegex = /^\d{10}$/;
const ngoIdRegex = /^[A-Za-z0-9_-]{3,40}$/;

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
    email: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingRegistry, setLoadingRegistry] = useState(false);
  const [registryRows, setRegistryRows] = useState([]);
  const [removedLogRows, setRemovedLogRows] = useState([]);
  const [actionNgoId, setActionNgoId] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const activeRows = useMemo(
    () => registryRows.filter((row) => !row?.isDisabled),
    [registryRows]
  );

  const disabledRows = useMemo(
    () => registryRows.filter((row) => row?.isDisabled),
    [registryRows]
  );

  const loadNgoRegistry = async () => {
    if (!form.userCert) return;
    setLoadingRegistry(true);
    try {
      const [allRes, removedRes] = await Promise.all([
        ngoApi.getAll({ userCert: form.userCert }),
        ngoApi.getRemoved({ userCert: form.userCert }),
      ]);
      setRegistryRows(Array.isArray(allRes?.data) ? allRes.data : []);
      setRemovedLogRows(Array.isArray(removedRes?.data) ? removedRes.data : []);
    } catch (err) {
      toast(err?.response?.data?.error || err.message || 'Failed to load NGO registry', 'error');
    } finally {
      setLoadingRegistry(false);
    }
  };

  useEffect(() => {
    if (form.userCert) {
      loadNgoRegistry();
    }
  }, []);

  const toggleNgoStatus = async (ngoId, shouldDisable) => {
    if (!form.userCert || !ngoId) {
      toast('userCert and ngoId are required', 'error');
      return;
    }

    setActionNgoId(ngoId);
    try {
      if (shouldDisable) {
        await ngoApi.disable({ userCert: form.userCert, ngoId });
        toast(`NGO ${ngoId} disabled`, 'success');
      } else {
        await ngoApi.restore({ userCert: form.userCert, ngoId });
        toast(`NGO ${ngoId} restored`, 'success');
      }
      await loadNgoRegistry();
    } catch (err) {
      toast(err?.response?.data?.error || err.message || 'Failed to update NGO status', 'error');
    } finally {
      setActionNgoId('');
    }
  };

  const validateForm = () => {
    const payload = {
      userCert: String(form.userCert || '').trim(),
      ngoId: String(form.ngoId || '').trim(),
      name: String(form.name || '').trim(),
      regNo: String(form.regNo || '').trim(),
      address: String(form.address || '').trim(),
      contact: String(form.contact || '').trim(),
      email: String(form.email || '').trim().toLowerCase(),
      description: String(form.description || '').trim(),
    };

    if (!payload.userCert || !payload.name || !payload.regNo || !payload.address || !payload.contact || !payload.email || !payload.description) {
      toast('User Cert, name, reg no, address, contact, email and description are required', 'error');
      return null;
    }
    if (payload.ngoId && !ngoIdRegex.test(payload.ngoId)) {
      toast('NGO ID must be 3-40 chars and only contain letters, numbers, _ or -', 'error');
      return null;
    }
    if (payload.name.length < 2 || payload.name.length > 120) {
      toast('Name must be between 2 and 120 characters', 'error');
      return null;
    }
    if (!regNoRegex.test(payload.regNo)) {
      toast('Reg No must be 3-40 chars and contain only letters, numbers, - or /', 'error');
      return null;
    }
    if (payload.address.length < 5 || payload.address.length > 250) {
      toast('Address must be between 5 and 250 characters', 'error');
      return null;
    }
    if (!contactRegex.test(payload.contact)) {
      toast('Contact must be exactly 10 digits', 'error');
      return null;
    }
    if (!emailRegex.test(payload.email)) {
      toast('Email format is invalid', 'error');
      return null;
    }
    if (payload.description.length < 10 || payload.description.length > 500) {
      toast('Description must be between 10 and 500 characters', 'error');
      return null;
    }

    return payload;
  };

  const onSubmit = async () => {
    const payload = validateForm();
    if (!payload) return;

    setLoading(true);
    try {
      if (!payload.ngoId) {
        delete payload.ngoId;
      }

      const response = await ngoApi.registerNGO(payload);
      const generatedId = response?.data?.generatedId || response?.data?.data?.ngoId;
      toast(`NGO registered successfully${generatedId ? `: ${generatedId}` : ''}`, 'success');
      setForm((prev) => ({ ...prev, ngoId: '', name: '', regNo: '', address: '', contact: '', email: '', description: '' }));
      await loadNgoRegistry();
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
          <div className="form-group"><label>Contact</label><input name="contact" value={form.contact} onChange={onChange} placeholder="10 digit mobile number" maxLength={10} inputMode="numeric" /></div>
          <div className="form-group"><label>Email</label><input name="email" type="email" value={form.email} onChange={onChange} placeholder="ngo@example.org" /></div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={onChange} placeholder="Mission and focus area" />
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setForm((prev) => ({ ...prev, ngoId: '', name: '', regNo: '', address: '', contact: '', email: '', description: '' }))}>Clear</button>
            <button className="btn btn-secondary" onClick={loadNgoRegistry} disabled={loadingRegistry || !form.userCert}>{loadingRegistry ? 'Refreshing...' : 'Refresh NGO List'}</button>
            <button className="btn btn-primary" onClick={onSubmit} disabled={loading}>{loading ? 'Registering...' : 'Register NGO'}</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title" style={{ marginBottom: 12 }}>Active NGOs</div>
        <DataTable
          columns={[
            { key: 'ngoId', label: 'NGO ID', mono: true },
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'status', label: 'Status', mono: true },
            {
              key: 'action',
              label: 'Action',
              render: (row) => (
                <button
                  className="btn btn-secondary"
                  onClick={() => toggleNgoStatus(row.ngoId, true)}
                  disabled={!row?.ngoId || actionNgoId === row.ngoId}
                >
                  {actionNgoId === row.ngoId ? 'Updating...' : 'Disable NGO'}
                </button>
              ),
            },
          ]}
          data={activeRows}
          emptyText="No active NGOs found"
        />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title" style={{ marginBottom: 12 }}>Removed / Disabled NGOs</div>
        <DataTable
          columns={[
            { key: 'ngoId', label: 'NGO ID', mono: true },
            { key: 'email', label: 'Email' },
            { key: 'status', label: 'Current Status', mono: true },
            { key: 'removedAt', label: 'Removed At', mono: true },
            { key: 'restoredAt', label: 'Restored At', mono: true },
            {
              key: 'action',
              label: 'Action',
              render: (row) => (
                <button
                  className="btn btn-primary"
                  onClick={() => toggleNgoStatus(row.ngoId, !row?.isDisabled)}
                  disabled={!row?.ngoId || actionNgoId === row.ngoId}
                >
                  {actionNgoId === row.ngoId ? 'Updating...' : row?.isDisabled ? 'Restore NGO' : 'Disable Again'}
                </button>
              ),
            },
          ]}
          data={removedLogRows}
          emptyText="No disabled NGO history yet"
        />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title" style={{ marginBottom: 12 }}>Currently Disabled NGOs</div>
        <DataTable
          columns={[
            { key: 'ngoId', label: 'NGO ID', mono: true },
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'removedAt', label: 'Removed At', mono: true },
            {
              key: 'action',
              label: 'Action',
              render: (row) => (
                <button
                  className="btn btn-primary"
                  onClick={() => toggleNgoStatus(row.ngoId, false)}
                  disabled={!row?.ngoId || actionNgoId === row.ngoId}
                >
                  {actionNgoId === row.ngoId ? 'Updating...' : 'Restore NGO'}
                </button>
              ),
            },
          ]}
          data={disabledRows}
          emptyText="No NGOs are currently disabled"
        />
      </div>
    </div>
  );
}
