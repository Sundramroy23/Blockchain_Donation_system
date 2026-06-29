const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

let dbPromise;

const DEFAULT_KYC_STATUS = 'NOT_SUBMITTED';

function normalizeKycStatus(value) {
  const status = String(value || '').trim().toUpperCase();
  return status || DEFAULT_KYC_STATUS;
}

function getAuthDb() {
  if (!dbPromise) {
    dbPromise = open({
      filename: path.join(__dirname, '..', 'data', 'auth.db'),
      driver: sqlite3.Database,
    });
  }

  return dbPromise;
}

async function initAuthDb() {
  const db = await getAuthDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS donor_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      donor_id TEXT NOT NULL UNIQUE,
      donor_certificate TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      kyc_status TEXT NOT NULL DEFAULT 'NOT_SUBMITTED',
      kyc_record_id TEXT,
      kyc_submitted_at TEXT,
      kyc_reviewed_at TEXT,
      failed_login_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_login_at TEXT
    )
  `);

  const columns = await db.all("PRAGMA table_info('donor_users')");
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has('donor_id')) {
    await db.exec('ALTER TABLE donor_users ADD COLUMN donor_id TEXT');
  }

  if (!columnNames.has('donor_certificate')) {
    await db.exec('ALTER TABLE donor_users ADD COLUMN donor_certificate TEXT');
  }

  if (!columnNames.has('kyc_status')) {
    await db.exec(`ALTER TABLE donor_users ADD COLUMN kyc_status TEXT NOT NULL DEFAULT '${DEFAULT_KYC_STATUS}'`);
  }

  if (!columnNames.has('kyc_record_id')) {
    await db.exec('ALTER TABLE donor_users ADD COLUMN kyc_record_id TEXT');
  }

  if (!columnNames.has('kyc_submitted_at')) {
    await db.exec('ALTER TABLE donor_users ADD COLUMN kyc_submitted_at TEXT');
  }

  if (!columnNames.has('kyc_reviewed_at')) {
    await db.exec('ALTER TABLE donor_users ADD COLUMN kyc_reviewed_at TEXT');
  }

  await backfillDonorIdentityFields(db);
  await db.run(
    `UPDATE donor_users
     SET kyc_status = COALESCE(NULLIF(trim(kyc_status), ''), ?)
     WHERE kyc_status IS NULL OR trim(kyc_status) = ''`,
    [DEFAULT_KYC_STATUS]
  );

  await db.exec('CREATE INDEX IF NOT EXISTS idx_donor_users_email ON donor_users(email)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_donor_users_donor_id ON donor_users(donor_id)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_donor_users_donor_certificate ON donor_users(donor_certificate)');
  await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS uq_donor_users_donor_id ON donor_users(donor_id)');
  await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS uq_donor_users_donor_certificate ON donor_users(donor_certificate)');
}

async function existsByField(db, field, value) {
  const row = await db.get(`SELECT id FROM donor_users WHERE ${field} = ? LIMIT 1`, [value]);
  return Boolean(row);
}

async function generateUniqueDonorId(db) {
  let value = generateDonorId();
  while (await existsByField(db, 'donor_id', value)) {
    value = generateDonorId();
  }
  return value;
}

async function generateUniqueDonorCertificate(db) {
  let value = generateDonorCertificate();
  while (await existsByField(db, 'donor_certificate', value)) {
    value = generateDonorCertificate();
  }
  return value;
}

async function findDonorByIdentifier(db, identifier) {
  const value = String(identifier || '').trim();
  if (!value) {
    return null;
  }

  return db.get(
    'SELECT * FROM donor_users WHERE donor_id = ? OR donor_certificate = ? OR email = ? LIMIT 1',
    [value, value, value]
  );
}

async function getDonorByIdentifier(identifier) {
  const db = await getAuthDb();
  return findDonorByIdentifier(db, identifier);
}

async function updateDonorKycState(identifier, patch = {}) {
  const db = await getAuthDb();
  const donor = await findDonorByIdentifier(db, identifier);

  if (!donor) {
    throw new Error(`Donor ${String(identifier || '').trim() || 'unknown'} not found`);
  }

  const nextStatus = normalizeKycStatus(patch.kycStatus != null ? patch.kycStatus : donor.kyc_status);
  const nextRecordId = patch.kycRecordId != null ? patch.kycRecordId : donor.kyc_record_id;
  const nextSubmittedAt = patch.kycSubmittedAt != null ? patch.kycSubmittedAt : donor.kyc_submitted_at;
  const nextReviewedAt = patch.kycReviewedAt != null ? patch.kycReviewedAt : donor.kyc_reviewed_at;

  await db.run(
    `UPDATE donor_users
     SET kyc_status = ?, kyc_record_id = ?, kyc_submitted_at = ?, kyc_reviewed_at = ?
     WHERE id = ?`,
    [nextStatus, nextRecordId || null, nextSubmittedAt || null, nextReviewedAt || null, donor.id]
  );

  return db.get('SELECT * FROM donor_users WHERE id = ? LIMIT 1', [donor.id]);
}

async function backfillDonorIdentityFields(db) {
  const rows = await db.all(`
    SELECT id, donor_id, donor_certificate
    FROM donor_users
    WHERE donor_id IS NULL OR trim(donor_id) = '' OR donor_certificate IS NULL OR trim(donor_certificate) = ''
  `);

  for (const row of rows) {
    const donorId = row.donor_id && String(row.donor_id).trim()
      ? row.donor_id
      : await generateUniqueDonorId(db);

    const donorCertificate = row.donor_certificate && String(row.donor_certificate).trim()
      ? row.donor_certificate
      : await generateUniqueDonorCertificate(db);

    await db.run(
      'UPDATE donor_users SET donor_id = ?, donor_certificate = ? WHERE id = ?',
      [donorId, donorCertificate, row.id]
    );
  }
}

function generateDonorId() {
  // Format: DONOR-YYYYMMDD-XXXXX
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `DONOR-${year}${month}${date}-${random}`;
}

function generateDonorCertificate() {
  // Format: CERT-TIMESTAMP-RANDOM
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 12).toUpperCase();
  return `CERT-${timestamp}-${random}`;
}

module.exports = {
  getAuthDb,
  initAuthDb,
  generateDonorId,
  generateDonorCertificate,
  getDonorByIdentifier,
  updateDonorKycState,
  normalizeKycStatus,
};
