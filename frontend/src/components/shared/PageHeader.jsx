// src/components/shared/PageHeader.jsx
export default function PageHeader({ title, desc, action }) {
  return (
    <div className="page-header">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">{title}</h1>
          {desc && <p className="page-desc">{desc}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
