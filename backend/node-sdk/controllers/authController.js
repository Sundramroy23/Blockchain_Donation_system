const bcrypt = require('bcryptjs');
const { getAuthDb, generateDonorId } = require('../services/authDb');
const { registerUser } = require('../services/fabricService');

const SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function toErrorMessage(error, fallback = 'unknown error') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error.message) return String(error.message);
  try {
    return JSON.stringify(error);
  } catch (_) {
    return String(error);
  }
}

function sanitizeUserRow(row) {
  return {
    id: row.id,
    donorId: row.donor_id,
    donorCertificate: row.donor_certificate,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  };
}

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

async function ensureWalletIdentity(identityId) {
  const candidate = String(identityId || '').trim();
  if (!candidate) {
    return { ok: false, error: 'wallet identity id is required' };
  }

  const result = await registerUser('Org2', 'govAdmin', candidate, 'donor');
  const message = String(result?.message || '');
  if (result?.status === true || /already been enrolled/i.test(message)) {
    return { ok: true, identity: candidate };
  }

  return { ok: false, error: message || 'failed to register donor identity in wallet' };
}

exports.register = async (req, res) => {
  try {
    let donorId = String(req.body.donorId || '').trim() || null;
    const name = String(req.body.name || '').trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'invalid email format' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'password must be at least 8 characters' });
    }

    // Generate donor ID and certificate if not provided
    if (!donorId) {
      donorId = generateDonorId();
    }
    const donorCertificate = donorId;

    const walletIdentity = await ensureWalletIdentity(donorCertificate);
    if (!walletIdentity.ok) {
      return res.status(500).json({
        error: `Failed to create wallet identity for donor ${donorId}: ${walletIdentity.error}`,
      });
    }

    const db = await getAuthDb();

    const existing = await db.get(
      'SELECT id FROM donor_users WHERE email = ? OR donor_id = ?',
      [email, donorId]
    );

    if (existing) {
      return res.status(409).json({ error: 'account already exists' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await db.run(
      'INSERT INTO donor_users (donor_id, donor_certificate, name, email, password_hash) VALUES (?, ?, ?, ?, ?)',
      [donorId, donorCertificate, name, email, passwordHash]
    );

    const created = await db.get('SELECT * FROM donor_users WHERE id = ?', [result.lastID]);

    await regenerateSession(req);
    req.session.user = {
      id: created.id,
      donorId: created.donor_id,
      donorCertificate: created.donor_certificate,
      role: 'donor',
      email: created.email,
      name: created.name,
    };

    return res.status(201).json({ success: true, user: sanitizeUserRow(created) });
  } catch (error) {
    const message = toErrorMessage(error, 'register failed');
    return res.status(500).json({ error: message });
  }
};

exports.login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const db = await getAuthDb();
    const user = await db.get('SELECT * FROM donor_users WHERE email = ?', [email]);

    if (!user) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const now = Date.now();
    if (user.locked_until && Number(user.locked_until) > now) {
      return res.status(423).json({ error: 'account temporarily locked, try again later' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      const failedAttempts = Number(user.failed_login_attempts || 0) + 1;
      const shouldLock = failedAttempts >= MAX_FAILED_ATTEMPTS;
      const lockedUntil = shouldLock ? now + LOCK_TIME_MS : null;

      await db.run(
        'UPDATE donor_users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?',
        [failedAttempts, lockedUntil, user.id]
      );

      return res.status(401).json({ error: 'invalid credentials' });
    }

    await db.run(
      'UPDATE donor_users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = datetime(\'now\') WHERE id = ?',
      [user.id]
    );

    const preferredWalletIdentity = String(user.donor_id || '').trim() || String(user.donor_certificate || '').trim();
    const walletIdentity = await ensureWalletIdentity(preferredWalletIdentity);
    if (!walletIdentity.ok) {
      return res.status(500).json({
        error: `Wallet identity setup failed for donor ${preferredWalletIdentity}: ${walletIdentity.error}`,
      });
    }

    await db.run('UPDATE donor_users SET donor_certificate = ? WHERE id = ?', [walletIdentity.identity, user.id]);

    const freshUser = await db.get('SELECT * FROM donor_users WHERE id = ?', [user.id]);

    await regenerateSession(req);
    req.session.user = {
      id: freshUser.id,
      donorId: freshUser.donor_id,
      donorCertificate: freshUser.donor_certificate,
      role: 'donor',
      email: freshUser.email,
      name: freshUser.name,
    };

    return res.json({ success: true, user: sanitizeUserRow(freshUser) });
  } catch (error) {
    const message = toErrorMessage(error, 'login failed');
    return res.status(500).json({ error: message });
  }
};

exports.logout = async (req, res) => {
  try {
    await destroySession(req);
    res.clearCookie('donor.sid');
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: toErrorMessage(error, 'logout failed') });
  }
};

exports.me = async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'not authenticated' });
  }

  return res.json({ success: true, user: req.session.user });
};
