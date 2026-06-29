const path = require('path');
const fs = require('fs').promises;
const { getDonorByIdentifier, updateDonorKycState, normalizeKycStatus } = require('./authDb');

const DATA_FILE = path.join(__dirname, '..', 'data', 'donor-kyc.json');
const DOC_DIR = path.join(__dirname, '..', 'data', 'donor-kyc-docs');

const KYC_STATUSES = {
  NOT_SUBMITTED: 'NOT_SUBMITTED',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

function createKycId() {
  return `KYC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function safeSegment(value) {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'file';
}

function inferExtension(mimeType, fileName) {
  const normalized = String(mimeType || '').toLowerCase();
  if (normalized.includes('png')) return '.png';
  if (normalized.includes('jpeg') || normalized.includes('jpg')) return '.jpg';
  if (normalized.includes('webp')) return '.webp';
  if (normalized.includes('pdf')) return '.pdf';
  const match = String(fileName || '').match(/\.[a-z0-9]+$/i);
  return match ? match[0].toLowerCase() : '.bin';
}

function extractBase64(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value) return '';
  const commaIndex = value.indexOf(',');
  return commaIndex >= 0 ? value.slice(commaIndex + 1) : value;
}

function normalizeStatus(status) {
  const value = normalizeKycStatus(status);
  return Object.prototype.hasOwnProperty.call(KYC_STATUSES, value) ? value : KYC_STATUSES.NOT_SUBMITTED;
}

function sortNewestFirst(records) {
  return [...records].sort((left, right) => {
    const rightTime = new Date(right.submittedAt || right.reviewedAt || right.createdAt || 0).getTime();
    const leftTime = new Date(left.submittedAt || left.reviewedAt || left.createdAt || 0).getTime();
    return rightTime - leftTime;
  });
}

async function ensureDirectories() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true }).catch(() => {});
  await fs.mkdir(DOC_DIR, { recursive: true }).catch(() => {});
}

async function readRecords() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeRecords(records) {
  await ensureDirectories();
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2), 'utf8');
}

async function list() {
  return sortNewestFirst(await readRecords());
}

async function getByDonor(donorId) {
  const all = await readRecords();
  return sortNewestFirst(all.filter((r) => String(r.donorId) === String(donorId)));
}

async function storeDocuments(donorId, kycId, documents) {
  await ensureDirectories();

  const grouped = {};
  for (const [index, document] of documents.entries()) {
    const kind = safeSegment(document?.kind || `document-${index + 1}`);
    const fileName = safeSegment(document?.fileName || `${kind}-${index + 1}`);
    const mimeType = String(document?.mimeType || 'application/octet-stream').trim();
    const extension = inferExtension(mimeType, fileName);
    const encoded = extractBase64(document?.dataUrl || document?.base64 || document?.content);
    if (!encoded) {
      continue;
    }

    const buffer = Buffer.from(encoded, 'base64');
    const storedFileName = `${safeSegment(donorId)}-${safeSegment(kycId)}-${kind}-${index + 1}${extension}`;
    const absolutePath = path.join(DOC_DIR, storedFileName);
    await fs.writeFile(absolutePath, buffer);

    const storedDocument = {
      imageId: `${kycId}-${index + 1}`,
      kind,
      fileName,
      mimeType,
      fileUrl: `/local-storage-donor-kyc/${storedFileName}`,
      storedFileName,
    };

    if (!grouped[kind]) {
      grouped[kind] = [];
    }
    grouped[kind].push(storedDocument);
  }

  return grouped;
}

async function persistKycState(donorId, patch) {
  const donor = await getDonorByIdentifier(donorId);
  if (!donor) {
    throw new Error(`Donor ${String(donorId || '').trim() || 'unknown'} not found`);
  }

  return updateDonorKycState(donor.donor_id || donor.donorId || donor.email, patch);
}

async function submit({ donorId, submittedBy, reviewNote, documents = [] }) {
  const cleanDonorId = String(donorId || '').trim();
  if (!cleanDonorId) {
    throw new Error('donorId is required');
  }

  const donor = await getDonorByIdentifier(cleanDonorId);
  if (!donor) {
    throw new Error(`Donor ${cleanDonorId} not found`);
  }

  const currentStatus = normalizeStatus(donor.kyc_status);
  if (currentStatus === KYC_STATUSES.APPROVED) {
    throw new Error('KYC is already approved for this donor');
  }

  const normalizedDocuments = Array.isArray(documents) ? documents.filter(Boolean) : [];
  if (normalizedDocuments.length === 0) {
    throw new Error('At least one document is required');
  }

  const kycId = createKycId();
  const storedDocuments = await storeDocuments(cleanDonorId, kycId, normalizedDocuments);
  const now = new Date().toISOString();
  const records = await readRecords();

  const record = {
    kycId,
    donorId: cleanDonorId,
    donorCertificate: donor.donor_certificate || donor.donorCertificate || null,
    status: KYC_STATUSES.PENDING,
    submittedBy: submittedBy || null,
    reviewNote: reviewNote || null,
    submittedAt: now,
    reviewedAt: null,
    reviewedBy: null,
    documents: storedDocuments,
  };

  records.push(record);
  await writeRecords(records);
  await persistKycState(cleanDonorId, {
    kycStatus: KYC_STATUSES.PENDING,
    kycRecordId: kycId,
    kycSubmittedAt: now,
    kycReviewedAt: null,
  });

  return record;
}

async function review({ kycId, status, reviewedBy, reviewNote }) {
  const records = await readRecords();
  const idx = records.findIndex((r) => r.kycId === kycId);
  if (idx === -1) throw new Error('KYC record not found');

  const nextStatus = normalizeStatus(status);
  if (nextStatus !== KYC_STATUSES.APPROVED && nextStatus !== KYC_STATUSES.REJECTED) {
    throw new Error('status must be APPROVED or REJECTED');
  }

  records[idx].status = nextStatus;
  records[idx].reviewedBy = reviewedBy || records[idx].reviewedBy || null;
  records[idx].reviewNote = reviewNote || records[idx].reviewNote || null;
  records[idx].reviewedAt = new Date().toISOString();

  await writeRecords(records);
  await persistKycState(records[idx].donorId, {
    kycStatus: nextStatus,
    kycRecordId: records[idx].kycId,
    kycSubmittedAt: records[idx].submittedAt,
    kycReviewedAt: records[idx].reviewedAt,
  });
  return records[idx];
}

module.exports = { list, getByDonor, submit, review };
