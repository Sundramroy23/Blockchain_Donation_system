const path = require('path');
const fs = require('fs').promises;

const DATA_FILE = path.join(__dirname, '..', 'data', 'donor-kyc.json');

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
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true }).catch(() => {});
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2), 'utf8');
}

async function list() {
  return await readRecords();
}

async function getByDonor(donorId) {
  const all = await readRecords();
  return all.filter((r) => String(r.donorId) === String(donorId));
}

async function review({ kycId, status, reviewedBy, reviewNote }) {
  const records = await readRecords();
  const idx = records.findIndex((r) => r.kycId === kycId);
  if (idx === -1) throw new Error('KYC record not found');

  records[idx].status = status;
  records[idx].reviewedBy = reviewedBy || records[idx].reviewedBy || null;
  records[idx].reviewNote = reviewNote || records[idx].reviewNote || null;
  records[idx].reviewedAt = new Date().toISOString();

  await writeRecords(records);
  return records[idx];
}

module.exports = { list, getByDonor, review };
