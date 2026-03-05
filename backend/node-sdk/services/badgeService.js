const { generateBadge } = require('./generateBadge');

const isBadgeGenerationEnabled = () => {
  const raw = String(process.env.ENABLE_BADGE_GENERATION || '').trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
};

const getBadgeTimeoutMs = () => {
  const parsed = Number(process.env.BADGE_GENERATION_TIMEOUT_MS);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1200;
  }
  return parsed;
};

const withTimeout = (promise, timeoutMs) =>
  Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(() => resolve({ ipfsLink: '' }), timeoutMs);
    }),
  ]);

const safeGenerateBadge = async (payload, contextLabel = '') => {
  if (!isBadgeGenerationEnabled()) {
    return { ipfsLink: '' };
  }

  const timeoutMs = getBadgeTimeoutMs();
  try {
    const result = await withTimeout(generateBadge(payload), timeoutMs);
    if (!result || typeof result.ipfsLink !== 'string') {
      return { ipfsLink: '' };
    }
    return { ipfsLink: result.ipfsLink };
  } catch (error) {
    const safeContext = contextLabel ? ` (${contextLabel})` : '';
    console.warn(`Badge generation skipped${safeContext}: ${error.message}`);
    return { ipfsLink: '' };
  }
};

module.exports = {
  safeGenerateBadge,
  isBadgeGenerationEnabled,
};
