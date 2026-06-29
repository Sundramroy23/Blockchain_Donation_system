import { useEffect, useMemo, useState } from "react";
import { API_BASE, donorKycApi } from "../../services/api";
import PageHeader from "../../components/shared/PageHeader";
import Badge from "../../components/shared/Badge";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const DOCUMENT_FIELDS = [
  { key: "identityFront", label: "Identity Document Front", required: true, accept: "image/*,application/pdf" },
  { key: "identityBack", label: "Identity Document Back", required: false, accept: "image/*,application/pdf" },
  { key: "addressProof", label: "Address Proof", required: false, accept: "image/*,application/pdf" },
];

const KYC_META = {
  APPROVED: { tone: "green", label: "Approved" },
  PENDING: { tone: "gold", label: "Pending" },
  REJECTED: { tone: "red", label: "Rejected" },
  NOT_SUBMITTED: { tone: "teal", label: "Not submitted" },
};

const prettyDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

const normalizeStatus = (value) => String(value || "NOT_SUBMITTED").trim().toUpperCase() || "NOT_SUBMITTED";

const flattenDocuments = (documents) => Object.values(documents || {}).flat().filter(Boolean);

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ""));
  reader.onerror = () => reject(new Error(`Failed to read ${file?.name || "file"}`));
  reader.readAsDataURL(file);
});

const labelForDocument = (doc) => {
  const kind = String(doc?.kind || "").toLowerCase();
  if (kind.includes("identityfront")) return "Identity Front";
  if (kind.includes("identityback")) return "Identity Back";
  if (kind.includes("addressproof")) return "Address Proof";
  return doc?.fileName || "Document";
};

const initialFiles = DOCUMENT_FIELDS.reduce((acc, field) => {
  acc[field.key] = null;
  return acc;
}, {});

export default function KycPage() {
  const { user } = useAuth();
  const toast = useToast();
  const donorId = String(user?.donorId || user?.userCert || "").trim();
  const [notes, setNotes] = useState("");
  const [fullName, setFullName] = useState(user?.name || "");
  const [files, setFiles] = useState(initialFiles);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const latestRecord = useMemo(() => records[0] || null, [records]);
  const currentStatus = normalizeStatus(user?.kycStatus || latestRecord?.status || "NOT_SUBMITTED");
  const statusMeta = KYC_META[currentStatus] || KYC_META.NOT_SUBMITTED;

  const loadKyc = async () => {
    if (!donorId) {
      setRecords([]);
      return;
    }

    setLoading(true);
    try {
      const res = await donorKycApi.getByDonor(donorId);
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast(error?.response?.data?.error || error.message || "Failed to load KYC records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFullName(user?.name || "");
    loadKyc();
  }, [donorId, user?.name]);

  const updateFile = (key) => (event) => {
    const file = event.target.files?.[0] || null;
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const clearForm = () => {
    setNotes("");
    setFiles(initialFiles);
    setFullName(user?.name || "");
  };

  const handleSubmit = async () => {
    if (!donorId) {
      toast("Donor ID is required", "error");
      return;
    }

    const selected = DOCUMENT_FIELDS.filter((field) => files[field.key]);
    if (selected.length === 0) {
      toast("Upload at least one KYC document", "error");
      return;
    }

    setSubmitting(true);
    try {
      const documents = [];
      for (const field of selected) {
        const file = files[field.key];
        const dataUrl = await readFileAsDataUrl(file);
        documents.push({
          kind: field.key,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          dataUrl,
        });
      }

      await donorKycApi.submit({
        donorId,
        submittedBy: user?.email || user?.name || donorId,
        reviewNote: notes,
        documents,
      });

      toast("KYC documents submitted", "success");
      clearForm();
      await loadKyc();
    } catch (error) {
      toast(error?.response?.data?.error || error.message || "Failed to submit KYC", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="KYC Verification"
        desc="Upload your identity documents so a gov admin can approve your donor account before you donate or receive tokens."
      />

      <div className="grid-2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>Your Status</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
            <Badge type={statusMeta.tone}>{statusMeta.label}</Badge>
            <div className="card-sub">Donor ID: {donorId || "—"}</div>
          </div>
          <div className="section-gap">
            <div className="form-group">
              <label>Display Name</label>
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" />
            </div>
            <div className="form-group">
              <label>Notes for reviewer</label>
              <textarea
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional context for the gov admin reviewing your documents"
              />
            </div>
            <div className="section-gap">
              {DOCUMENT_FIELDS.map((field) => {
                const selectedFile = files[field.key];
                return (
                  <div key={field.key} className="form-group">
                    <label>
                      {field.label}
                      {field.required ? " *" : ""}
                    </label>
                    <input type="file" accept={field.accept} onChange={updateFile(field.key)} />
                    <span className="input-hint">{selectedFile ? `Selected: ${selectedFile.name}` : "No file selected"}</span>
                  </div>
                );
              })}
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" type="button" onClick={clearForm} disabled={submitting}>
                Clear
              </button>
              <button className="btn btn-secondary" type="button" onClick={loadKyc} disabled={loading || !donorId}>
                {loading ? "Refreshing..." : "Refresh Status"}
              </button>
              <button className="btn btn-primary" type="button" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit KYC"}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>Submission History</div>
          {loading ? (
            <p style={{ color: "var(--text-muted)" }}>Loading...</p>
          ) : records.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>No KYC submission found yet.</p>
          ) : (
            <div className="section-gap">
              {records.map((record) => {
                const meta = KYC_META[normalizeStatus(record.status)] || KYC_META.NOT_SUBMITTED;
                const docs = flattenDocuments(record.documents);
                return (
                  <div key={record.kycId} className="card" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                      <strong>{record.kycId}</strong>
                      <Badge type={meta.tone}>{meta.label}</Badge>
                    </div>
                    <div className="card-sub" style={{ marginBottom: 6 }}>Submitted: {prettyDate(record.submittedAt)}</div>
                    <div className="card-sub" style={{ marginBottom: 12 }}>Reviewed: {prettyDate(record.reviewedAt)}</div>
                    {record.reviewNote && <div style={{ marginBottom: 12 }}>Reviewer note: {record.reviewNote}</div>}
                    {docs.length > 0 ? (
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {docs.map((doc) => {
                          const isImage = String(doc?.mimeType || "").startsWith("image/");
                          const src = doc?.fileUrl ? `${API_BASE}${doc.fileUrl}` : "";
                          return (
                            <a
                              key={doc.imageId || doc.fileUrl || doc.fileName}
                              href={src}
                              target="_blank"
                              rel="noreferrer"
                              title={doc.fileName}
                              style={{
                                display: "inline-flex",
                                flexDirection: "column",
                                gap: 6,
                                textDecoration: "none",
                                color: "inherit",
                              }}
                            >
                              <div style={{ width: 88, height: 88, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg-card)", display: "grid", placeItems: "center" }}>
                                {isImage ? (
                                  <img src={src} alt={doc.fileName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                  <span style={{ fontSize: 12, color: "var(--text-muted)", padding: 8, textAlign: "center" }}>View file</span>
                                )}
                              </div>
                              <span style={{ fontSize: 12, maxWidth: 88 }}>{labelForDocument(doc)}</span>
                            </a>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-dim">No documents stored for this submission.</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
