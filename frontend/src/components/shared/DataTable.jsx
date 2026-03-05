// src/components/shared/DataTable.jsx
export default function DataTable({ columns, data, emptyText = "No records found" }) {
  if (!data.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">◈</div>
        <div className="empty-text">{emptyText}</div>
        <div className="empty-sub">No data on the ledger yet</div>
      </div>
    );
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.key} className={c.mono ? "mono" : ""}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
