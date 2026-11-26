const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'strict',
  path: '/',
});

function issueSession(res, user) {
  const token = jwt.sign({ sub: String(user._id), tv: user.tokenVersion || 0 }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    issuer: 'hospitality369',
  });
  const decoded = jwt.decode(token);
  res.cookie(env.cookieName, token, { ...cookieOptions(), expires: new Date(decoded.exp * 1000) });
}

function clearSession(res) {
  res.clearCookie(env.cookieName, cookieOptions());
}

/**
 * Verifies the session cookie and loads the *current* user from the database,
 * so deactivation and permission changes take effect on the very next request.
 */
async function authenticate(req, _res, next) {
  try {
    const token = req.cookies?.[env.cookieName];
    if (!token) throw ApiError.unauthorized();

    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret, { issuer: 'hospitality369' });
    } catch {
      throw ApiError.unauthorized('Your session has expired. Please sign in again.');
    }

    const user = await User.findById(payload.sub).select('+tokenVersion');
    if (!user || !user.active || (user.tokenVersion || 0) !== payload.tv) {
      throw ApiError.unauthorized('Your session is no longer valid. Please sign in again.');
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** Require *all* of the given permissions */
const requirePermission = (...perms) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  const granted = req.user.effectivePermissions();
  const missing = perms.filter((p) => !granted.includes(p));
  if (missing.length) return next(ApiError.forbidden());
  next();
};

/** Require *any* of the given permissions */
const requireAnyPermission = (...perms) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  const granted = req.user.effectivePermissions();
  if (!perms.some((p) => granted.includes(p))) return next(ApiError.forbidden());
  next();
};

/** Like authenticate, but anonymous requests continue with req.user = null instead of 401 */
async function optionalAuth(req, res, next) {
  if (!req.cookies?.[env.cookieName]) {
    req.user = null;
    return next();
  }
  return authenticate(req, res, (err) => {
    if (err && err.status === 401) {
      clearSession(res);
      req.user = null;
      return next();
    }
    return next(err);
  });
}

const requireSuperAdmin = (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!req.user.isSuperAdmin()) return next(ApiError.forbidden('Only the Super Admin can access this area'));
  next();
};

module.exports = {
  issueSession,
  clearSession,
  authenticate,
  optionalAuth,
  requirePermission,
  requireAnyPermission,
  requireSuperAdmin,
};
