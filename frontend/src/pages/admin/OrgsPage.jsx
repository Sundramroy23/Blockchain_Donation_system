// src/pages/admin/OrgsPage.jsx
import PageHeader from "../../components/shared/PageHeader";
import DataTable  from "../../components/shared/DataTable";
import Badge      from "../../components/shared/Badge";
import { orgs }   from "../../data/mockData";

export default function OrgsPage() {
  return (
    <div>
      <PageHeader title="Organizations" desc="All MSP organizations on the Hyperledger network" />
      <div className="card">
        <DataTable
          columns={[
            { key:"id",     label:"Org ID",   mono:true },
            { key:"name",   label:"MSP Name"  },
            { key:"type",   label:"Type",     render:(r) => <Badge type={r.type==="Platform"?"gold":r.type==="Government"?"blue":"purple"}>{r.type}</Badge> },
            { key:"status", label:"Status",   render:(r) => <Badge type="green">{r.status}</Badge> },
          ]}
          data={orgs}
        />
      </div>
    </div>
  );
}
