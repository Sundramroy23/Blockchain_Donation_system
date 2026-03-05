// src/pages/admin/AddOrgPage.jsx
import { useState } from "react";
import { useToast }  from "../../context/ToastContext";
import PageHeader    from "../../components/shared/PageHeader";
import DataTable     from "../../components/shared/DataTable";
import Badge         from "../../components/shared/Badge";
import { orgs }      from "../../data/mockData";

export default function AddOrgPage() {
  const toast = useToast();
  const [form, setForm] = useState({ name:"", type:"NGO", desc:"", email:"", msp:"" });
  const upd = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div>
      <PageHeader title="Add Organization" desc="Onboard a new MSP to the Hyperledger network" />
      <div className="grid-2">
        <div className="card">
          <div className="form-grid section-gap">
            <div className="form-group">
              <label>Organization Name</label>
              <input value={form.name} onChange={upd("name")} placeholder="e.g. GreenNGOMSP" />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={upd("type")}>
                <option value="NGO">NGO</option>
                <option value="Government">Government</option>
                <option value="Bank">Financial Institution</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Network MSPID</label>
              <input value={form.msp} onChange={upd("msp")} placeholder="e.g. Org4MSP" />
              <span className="input-hint">Must match peer configuration</span>
            </div>
            <div className="form-group">
              <label>Admin Email</label>
              <input value={form.email} onChange={upd("email")} type="email" placeholder="admin@org.com" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={form.desc} onChange={upd("desc")} placeholder="Organization's role..." />
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setForm({ name:"", type:"NGO", desc:"", email:"", msp:"" })}>Clear</button>
              <button className="btn btn-primary" onClick={() => toast("Organization added to network", "success")}>⊕ Add to Network</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom:16 }}>Current Network Members</div>
          <DataTable
            columns={[
              { key:"id",     label:"ID",     mono:true },
              { key:"name",   label:"Name"   },
              { key:"type",   label:"Type",   render:(r) => <Badge type={r.type==="Platform"?"gold":r.type==="Government"?"blue":"purple"}>{r.type}</Badge> },
              { key:"status", label:"Status", render:(r) => <Badge type="green">{r.status}</Badge> },
            ]}
            data={orgs}
          />
        </div>
      </div>
    </div>
  );
}
