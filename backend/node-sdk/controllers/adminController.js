const path = require('path');
const fs = require('fs').promises;

const DATA_DIR = path.join(__dirname, '..', 'data');

async function rmSafe(p) {
  try {
    await fs.rm(p, { recursive: true, force: true });
  } catch (err) {
    // ignore
  }
}

async function clearLocalState(req, res) {
  try {
    const adminKey = process.env.ADMIN_API_KEY;
    if (adminKey) {
      const provided = req.headers['x-admin-key'] || req.query.adminKey || req.body?.adminKey;
      if (!provided || String(provided) !== String(adminKey)) {
        return res.status(403).json({ error: 'admin key required' });
      }
    }

    const targets = [
      path.join(DATA_DIR, 'approvals.json'),
      path.join(DATA_DIR, 'donor-kyc.json'),
      path.join(DATA_DIR, 'ngoRegistry.json'),
      path.join(DATA_DIR, 'govUsers.json'),
      path.join(DATA_DIR, 'auth.db'),
      path.join(DATA_DIR, 'sessions.sqlite'),
      path.join(DATA_DIR, 'sessions.sqlite-shm'),
      path.join(DATA_DIR, 'sessions.sqlite-wal'),
      path.join(DATA_DIR, 'approval-receipts'),
      path.join(DATA_DIR, 'donor-kyc-docs'),
    ];

    await Promise.all(targets.map((t) => rmSafe(t)));

    // also clear wallet
    await rmSafe(path.join(__dirname, '..', 'wallet'));

    return res.json({ success: true, message: 'Local state cleared' });
  } catch (err) {
    console.error('clearLocalState error', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}

module.exports = { clearLocalState };
