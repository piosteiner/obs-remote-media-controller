const crypto = require('crypto');

// Shared admin key (ADMIN_API_KEY in .env). Reads stay public so the OBS
// display pages work without it; anything that changes state needs the key.
const hash = (value) => crypto.createHash('sha256').update(String(value)).digest();

function isValidKey(key) {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected || !key) return false;
  return crypto.timingSafeEqual(hash(key), hash(expected));
}

function requestKey(req) {
  const header = req.get('authorization') || '';
  return req.get('x-api-key') || (header.startsWith('Bearer ') ? header.slice(7) : null);
}

function requireApiKey(req, res, next) {
  if (isValidKey(requestKey(req))) return next();
  res.status(401).json({
    success: false,
    error: { message: 'Invalid or missing API key', code: 'UNAUTHORIZED' }
  });
}

function requireApiKeyForWrites(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  requireApiKey(req, res, next);
}

module.exports = { isValidKey, requireApiKey, requireApiKeyForWrites };
