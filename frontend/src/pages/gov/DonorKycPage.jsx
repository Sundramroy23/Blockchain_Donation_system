import React, { useEffect, useState } from 'react';
import { API_BASE, donorKycApi } from '../../services/api';
import PageHeader from '../../components/shared/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function DonorKycPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const getDocumentLabel = (doc) => {
    const kind = String(doc?.kind || '').toLowerCase();
    if (kind.includes('pan-front')) return 'PAN Front';
    if (kind.includes('pan-back')) return 'PAN Back';
    if (kind.includes('aadhaar-front')) return 'Aadhaar Front';
    if (kind.includes('aadhaar-back')) return 'Aadhaar Back';
    return doc?.fileName || 'Document';
  };

  const canApprove = user?.role === 'govAdmin';

  const load = async () => {
    setLoading(true);
    try {
      const res = await donorKycApi.list();
      setRecords(res.data || []);
    } catch (err) {
      console.error('Failed to load donor KYC', err);
      toast(err?.response?.data?.error || 'Failed to load donor KYC', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setLightboxImage(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const openImage = (doc) => {
    setLightboxImage({
      src: `${API_BASE}${doc.fileUrl}`,
      alt: doc.fileName,
      label: getDocumentLabel(doc),
    });
  };

  const closeImage = () => setLightboxImage(null);

  const review = async (kycId, status) => {
    try {
      await donorKycApi.review({
        kycId,
        status,
        reviewedBy: window.localStorage.getItem('userCert') || user?.userCert || user?.email || 'govAdmin',
      });
      toast(`KYC ${status.toLowerCase()}`, 'success');
      await load();
    } catch (err) {
      console.error(err);
      toast(err?.response?.data?.error || `${status} failed`, 'error');
    }
  };

  return (
    <div>
      <PageHeader title="Donor KYC" desc="Gov admin review queue for PAN and Aadhaar submissions" />

      {lightboxImage && (
        <div
          role="presentation"
          onClick={closeImage}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(3, 7, 18, 0.86)',
            display: 'grid',
            placeItems: 'center',
            padding: 20,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Donor KYC image preview"
            onClick={(event) => event.stopPropagation()}
            style={{
              position: 'relative',
              width: 'min(92vw, 1100px)',
              maxHeight: '90vh',
              borderRadius: 20,
              overflow: 'hidden',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
            }}
          >
            <button
              type="button"
              onClick={closeImage}
              aria-label="Close image preview"
              title="Close"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 2,
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#fff',
                fontSize: 22,
                lineHeight: '34px',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
            <div style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
              <div style={{ marginBottom: 12, color: '#e5e7eb', fontSize: 14, fontWeight: 600, letterSpacing: 0.2 }}>
                {lightboxImage.label}
              </div>
              <img
                src={lightboxImage.src}
                alt={lightboxImage.alt}
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  borderRadius: 12,
                  background: '#fff',
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="card">
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : records.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No donor KYC submissions</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>KYC Id</th>
                <th>Donor</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Reviewed</th>
                <th>Images</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.kycId}>
                  <td>{record.kycId}</td>
                  <td>{record.donorId}</td>
                  <td>{record.status || 'PENDING'}</td>
                  <td>{record.submittedAt || record.createdAt || '-'}</td>
                  <td>{record.reviewedAt || '-'}</td>
                  <td>
                    {record.documents ? (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {Object.values(record.documents).flat().map((doc) => (
                          <button
                            key={doc.imageId || doc.fileUrl}
                            type="button"
                            onClick={() => openImage(doc)}
                            title={doc.fileName}
                            style={{
                              padding: 0,
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                            }}
                          >
                            <img
                              src={`${API_BASE}${doc.fileUrl}`}
                              alt={doc.fileName}
                              style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
                            />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-dim">-</span>
                    )}
                  </td>
                  <td>
                    {canApprove && record.status !== 'APPROVED' ? (
                      <>
                        <button className="btn btn-primary btn-sm" type="button" onClick={() => review(record.kycId, 'APPROVED')}>
                          Approve
                        </button>
                        <span style={{ width: 8, display: 'inline-block' }} />
                        <button className="btn btn-secondary btn-sm" type="button" onClick={() => review(record.kycId, 'REJECTED')}>
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-dim">Read-only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
