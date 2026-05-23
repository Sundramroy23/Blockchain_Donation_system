const fs = require('fs');
const path = require('path');

const NGO_REGISTRY_FILE = path.join(__dirname, '..', 'data', 'ngoRegistry.json');

const ensureNgoRegistryFile = () => {
  const dirPath = path.dirname(NGO_REGISTRY_FILE);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  if (!fs.existsSync(NGO_REGISTRY_FILE)) {
    fs.writeFileSync(NGO_REGISTRY_FILE, JSON.stringify({}, null, 2), 'utf8');
  }
};

const normalizeRegistry = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  return raw;
};

const readNgoRegistry = () => {
  ensureNgoRegistryFile();
  const raw = fs.readFileSync(NGO_REGISTRY_FILE, 'utf8');
  return normalizeRegistry(JSON.parse(raw || '{}'));
};

const writeNgoRegistry = (registry) => {
  ensureNgoRegistryFile();
  fs.writeFileSync(NGO_REGISTRY_FILE, JSON.stringify(normalizeRegistry(registry), null, 2), 'utf8');
};

const normalizeNgoId = (ngoId) => String(ngoId || '').trim();

const getNgoMeta = (ngoId) => {
  const normalizedNgoId = normalizeNgoId(ngoId);
  if (!normalizedNgoId) {
    return {
      ngoId: '',
      email: '',
      isDisabled: false,
      removedAt: null,
      restoredAt: null,
      changedBy: '',
      lastChangedAt: null,
      history: [],
    };
  }

  const registry = readNgoRegistry();
  const item = registry[normalizedNgoId] || {};

  return {
    ngoId: normalizedNgoId,
    email: String(item.email || '').trim(),
    isDisabled: Boolean(item.isDisabled),
    removedAt: item.removedAt || null,
    restoredAt: item.restoredAt || null,
    changedBy: item.changedBy || '',
    lastChangedAt: item.lastChangedAt || null,
    history: Array.isArray(item.history) ? item.history : [],
  };
};

const setNgoEmail = (ngoId, email, changedBy = '') => {
  const normalizedNgoId = normalizeNgoId(ngoId);
  if (!normalizedNgoId) return;

  const registry = readNgoRegistry();
  const now = new Date().toISOString();
  const existing = registry[normalizedNgoId] || {};

  registry[normalizedNgoId] = {
    ...existing,
    ngoId: normalizedNgoId,
    email: String(email || '').trim(),
    isDisabled: Boolean(existing.isDisabled),
    removedAt: existing.removedAt || null,
    restoredAt: existing.restoredAt || null,
    changedBy: String(changedBy || '').trim(),
    lastChangedAt: now,
    history: Array.isArray(existing.history) ? existing.history : [],
  };

  writeNgoRegistry(registry);
};

const setNgoDisabled = (ngoId, disabled, changedBy = '', reason = '') => {
  const normalizedNgoId = normalizeNgoId(ngoId);
  if (!normalizedNgoId) {
    throw new Error('ngoId is required');
  }

  const registry = readNgoRegistry();
  const now = new Date().toISOString();
  const existing = registry[normalizedNgoId] || {};
  const history = Array.isArray(existing.history) ? [...existing.history] : [];
  const shouldDisable = Boolean(disabled);

  history.unshift({
    action: shouldDisable ? 'DISABLE' : 'RESTORE',
    at: now,
    by: String(changedBy || '').trim(),
    reason: String(reason || '').trim(),
  });

  registry[normalizedNgoId] = {
    ...existing,
    ngoId: normalizedNgoId,
    email: String(existing.email || '').trim(),
    isDisabled: shouldDisable,
    removedAt: shouldDisable ? now : (existing.removedAt || null),
    restoredAt: shouldDisable ? (existing.restoredAt || null) : now,
    changedBy: String(changedBy || '').trim(),
    lastChangedAt: now,
    history,
  };

  writeNgoRegistry(registry);
  return registry[normalizedNgoId];
};

const isNgoDisabled = (ngoId) => getNgoMeta(ngoId).isDisabled;

const mergeNgoWithMeta = (ngo) => {
  const source = ngo && typeof ngo === 'object' ? ngo : {};
  const ngoId = normalizeNgoId(source.ngoId);
  const meta = getNgoMeta(ngoId);

  return {
    ...source,
    ngoId,
    email: String(source.email || meta.email || '').trim(),
    isDisabled: Boolean(meta.isDisabled),
    status: meta.isDisabled ? 'DISABLED' : 'ACTIVE',
    removedAt: meta.removedAt,
    restoredAt: meta.restoredAt,
    statusChangedAt: meta.lastChangedAt,
    statusChangedBy: meta.changedBy,
  };
};

const mergeNgosWithMeta = (ngos) => {
  const list = Array.isArray(ngos) ? ngos : [];
  return list.map((ngo) => mergeNgoWithMeta(ngo));
};

const listRemovedNgoRecords = () => {
  const registry = readNgoRegistry();
  const rows = [];

  for (const [ngoId, item] of Object.entries(registry)) {
    const history = Array.isArray(item.history) ? item.history : [];
    const hasDisabledEvent = history.some((entry) => String(entry?.action || '').toUpperCase() === 'DISABLE');
    if (!hasDisabledEvent) continue;

    rows.push({
      ngoId,
      email: String(item.email || '').trim(),
      isDisabled: Boolean(item.isDisabled),
      status: Boolean(item.isDisabled) ? 'DISABLED' : 'ACTIVE',
      removedAt: item.removedAt || null,
      restoredAt: item.restoredAt || null,
      statusChangedBy: item.changedBy || '',
      statusChangedAt: item.lastChangedAt || null,
      history,
    });
  }

  rows.sort((a, b) => String(b.statusChangedAt || '').localeCompare(String(a.statusChangedAt || '')));
  return rows;
};

module.exports = {
  getNgoMeta,
  setNgoEmail,
  setNgoDisabled,
  isNgoDisabled,
  mergeNgoWithMeta,
  mergeNgosWithMeta,
  listRemovedNgoRecords,
};
