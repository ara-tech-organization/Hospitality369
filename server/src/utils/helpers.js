const crypto = require('crypto');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const escapeRegex = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const slugify = (s = '') =>
  String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

/** Normalise a phone number to digits with an optional leading + */
const normalizeMobile = (s = '') => {
  const trimmed = String(s).trim();
  const plus = trimmed.startsWith('+') ? '+' : '';
  return plus + trimmed.replace(/\D/g, '');
};

/** Paging helper: returns sanitised page/limit/skip */
const paging = (query, { defaultLimit = 10, maxLimit = 100 } = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};

/** Unambiguous referral code, e.g. H369-7KQ2MX */
const referralCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(6);
  let out = '';
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `H369-${out}`;
};

/** "Priya Sharma" -> "Priya S." – used on the public leaderboard */
const maskName = (name = '') => {
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
};

const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/** Monday 00:00 of the current week */
const startOfWeek = (d = new Date()) => {
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7; // 0 = Monday
  x.setDate(x.getDate() - day);
  return x;
};

const clientIp = (req) => req.ip || req.socket?.remoteAddress || '';

module.exports = {
  asyncHandler,
  escapeRegex,
  slugify,
  normalizeMobile,
  paging,
  referralCode,
  maskName,
  startOfDay,
  startOfWeek,
  clientIp,
};
