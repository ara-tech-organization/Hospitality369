const { z } = require('zod');
const User = require('../models/User');
const { audit } = require('../services/audit.service');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../utils/helpers');
const { passwordRule } = require('./auth.controller');
const { ALL_PERMISSIONS, USER_ROLES } = require('../constants');

const permissions = z.array(z.enum(ALL_PERMISSIONS)).max(ALL_PERMISSIONS.length).transform((a) => [...new Set(a)]);

const schemas = {
  create: z.object({
    name: z.string().trim().min(2, 'Name is required').max(80),
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    password: passwordRule,
    permissions: permissions.default([]),
  }),
  update: z.object({
    name: z.string().trim().min(2).max(80).optional(),
    permissions: permissions.optional(),
    active: z.boolean().optional(),
  }),
  resetPassword: z.object({ password: passwordRule }),
};

async function loadAdmin(id) {
  const user = await User.findById(id).select('+tokenVersion');
  if (!user) throw ApiError.notFound('Admin not found');
  if (user.isSuperAdmin()) throw ApiError.forbidden('Super Admin accounts cannot be modified here');
  return user;
}

const list = asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ role: -1, createdAt: -1 });
  res.json({ success: true, admins: users.map((u) => u.toSafeJSON()) });
});

const create = asyncHandler(async (req, res) => {
  if (await User.exists({ email: req.body.email })) {
    throw ApiError.conflict('An account with this email already exists', { fields: { email: 'Already in use' } });
  }
  const user = await User.create({ ...req.body, role: USER_ROLES.ADMIN, createdBy: req.user._id });
  await audit(req, 'admin.created', {
    entity: 'User',
    entityId: user._id,
    summary: `Created admin ${user.email}`,
    metadata: { permissions: user.permissions },
  });
  res.status(201).json({ success: true, admin: user.toSafeJSON() });
});

const update = asyncHandler(async (req, res) => {
  const user = await loadAdmin(req.params.id);
  const before = { permissions: [...user.permissions], active: user.active, name: user.name };
  if (req.body.name !== undefined) user.name = req.body.name;
  if (req.body.permissions !== undefined) user.permissions = req.body.permissions;
  if (req.body.active !== undefined) {
    user.active = req.body.active;
    if (!user.active) user.tokenVersion += 1; // immediately revoke sessions
  }
  await user.save();

  const granted = (req.body.permissions || []).filter((p) => !before.permissions.includes(p));
  const revoked = req.body.permissions ? before.permissions.filter((p) => !req.body.permissions.includes(p)) : [];
  const parts = [];
  if (granted.length) parts.push(`granted ${granted.join(', ')}`);
  if (revoked.length) parts.push(`revoked ${revoked.join(', ')}`);
  if (req.body.active !== undefined && req.body.active !== before.active) parts.push(user.active ? 'activated' : 'deactivated');
  if (req.body.name && req.body.name !== before.name) parts.push('renamed');

  await audit(req, 'admin.updated', {
    entity: 'User',
    entityId: user._id,
    summary: `Admin ${user.email}: ${parts.join('; ') || 'no changes'}`,
    metadata: { before, granted, revoked },
  });
  res.json({ success: true, admin: user.toSafeJSON() });
});

const resetPassword = asyncHandler(async (req, res) => {
  const user = await loadAdmin(req.params.id);
  user.password = req.body.password;
  user.tokenVersion += 1;
  await user.save();
  await audit(req, 'admin.password_reset', { entity: 'User', entityId: user._id, summary: `Reset password for ${user.email}` });
  res.json({ success: true, message: 'Password reset. The admin has been signed out of all sessions.' });
});

const remove = asyncHandler(async (req, res) => {
  const user = await loadAdmin(req.params.id);
  await user.deleteOne();
  await audit(req, 'admin.deleted', { entity: 'User', entityId: user._id, summary: `Deleted admin ${user.email}` });
  res.json({ success: true });
});

module.exports = { schemas, list, create, update, resetPassword, remove };
