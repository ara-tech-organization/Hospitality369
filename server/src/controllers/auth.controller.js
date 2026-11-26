const { z } = require('zod');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../utils/helpers');
const { issueSession, clearSession } = require('../middleware/auth');
const { audit } = require('../services/audit.service');
const { PERMISSION_META } = require('../constants');

const passwordRule = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(128)
  .regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/[0-9]/, 'Include a number');

const schemas = {
  login: z.object({
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    password: z.string().min(1, 'Password is required').max(128),
  }),
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordRule,
  }),
};

const GENERIC_LOGIN_ERROR = 'Invalid email or password';

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password +tokenVersion +failedLogins +lockUntil');

  if (!user) throw ApiError.unauthorized(GENERIC_LOGIN_ERROR);
  if (user.isLocked()) {
    throw new ApiError(423, 'This account is temporarily locked after repeated failed sign-ins. Try again in 15 minutes.');
  }
  const ok = await user.comparePassword(password);
  if (!ok) {
    await user.registerFailedLogin();
    throw ApiError.unauthorized(GENERIC_LOGIN_ERROR);
  }
  if (!user.active) throw ApiError.forbidden('This account has been deactivated. Contact your Super Admin.');

  user.failedLogins = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save({ validateModifiedOnly: true });

  issueSession(res, user);
  req.user = user;
  await audit(req, 'auth.login', { entity: 'User', entityId: user._id, summary: `${user.email} signed in` });
  res.json({ success: true, user: user.toSafeJSON() });
});

const logout = asyncHandler(async (req, res) => {
  // Invalidate every token issued for this user (secure logout)
  await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
  await audit(req, 'auth.logout', { entity: 'User', entityId: req.user._id, summary: `${req.user.email} signed out` });
  clearSession(res);
  res.json({ success: true });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeJSON(), permissionCatalog: PERMISSION_META });
});

/** Public session probe – 200 with user:null for anonymous visitors (no console noise) */
const session = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user ? req.user.toSafeJSON() : null, permissionCatalog: req.user ? PERMISSION_META : [] });
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password +tokenVersion');
  if (!(await user.comparePassword(req.body.currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect', { fields: { currentPassword: 'Incorrect password' } });
  }
  user.password = req.body.newPassword;
  user.tokenVersion += 1;
  await user.save();
  issueSession(res, user); // keep this session alive, others are revoked
  await audit(req, 'auth.password_changed', { entity: 'User', entityId: user._id, summary: `${user.email} changed their password` });
  res.json({ success: true, message: 'Password updated. Other sessions have been signed out.' });
});

module.exports = { schemas, passwordRule, login, logout, me, session, changePassword };
