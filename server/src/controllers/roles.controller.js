const { z } = require('zod');
const JobRole = require('../models/JobRole');
const Application = require('../models/Application');
const { audit } = require('../services/audit.service');
const ApiError = require('../utils/ApiError');
const { asyncHandler, slugify, escapeRegex } = require('../utils/helpers');
const { INDUSTRIES } = require('../constants');

const roleBody = z.object({
  title: z.string().trim().min(2, 'Title is required').max(80),
  industry: z.enum(INDUSTRIES, { errorMap: () => ({ message: 'Select an industry' }) }),
  description: z.string().trim().max(600).optional().default(''),
  positions: z
    .array(z.string().trim().min(2).max(80))
    .max(20, 'Up to 20 positions per role')
    .optional()
    .default([])
    .transform((arr) => [...new Set(arr)]),
  active: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
});

const schemas = {
  create: roleBody,
  update: roleBody.partial(),
  toggle: z.object({ active: z.boolean() }),
};

async function uniqueSlug(title, excludeId) {
  const base = slugify(title) || 'role';
  let slug = base;
  for (let i = 2; await JobRole.exists({ slug, _id: { $ne: excludeId } }); i += 1) slug = `${base}-${i}`;
  return slug;
}

const list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.industry && INDUSTRIES.includes(req.query.industry)) filter.industry = req.query.industry;
  if (req.query.active === 'true') filter.active = true;
  if (req.query.active === 'false') filter.active = false;
  if (req.query.search) filter.title = new RegExp(escapeRegex(String(req.query.search).slice(0, 80)), 'i');

  const [roles, counts] = await Promise.all([
    JobRole.find(filter).sort({ sortOrder: 1, title: 1 }).lean(),
    Application.aggregate([{ $group: { _id: '$role', count: { $sum: 1 }, newCount: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } } } }]),
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c]));
  res.json({
    success: true,
    roles: roles.map((r) => ({
      ...r,
      applicationCount: countMap[String(r._id)]?.count || 0,
      newApplicationCount: countMap[String(r._id)]?.newCount || 0,
    })),
  });
});

/** Lightweight list for filter dropdowns (any authenticated dashboard user) */
const options = asyncHandler(async (_req, res) => {
  const roles = await JobRole.find().select('title active industry').sort({ title: 1 }).lean();
  res.json({ success: true, roles });
});

const create = asyncHandler(async (req, res) => {
  const exists = await JobRole.findOne({ title: req.body.title }).collation({ locale: 'en', strength: 2 });
  if (exists) throw ApiError.conflict('A role with this title already exists', { fields: { title: 'Already exists' } });
  const role = await JobRole.create({
    ...req.body,
    slug: await uniqueSlug(req.body.title),
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });
  await audit(req, 'role.created', { entity: 'JobRole', entityId: role._id, summary: `Created role "${role.title}"` });
  res.status(201).json({ success: true, role });
});

const update = asyncHandler(async (req, res) => {
  const role = await JobRole.findById(req.params.id);
  if (!role) throw ApiError.notFound('Role not found');
  const before = role.toObject();

  if (req.body.title && req.body.title.toLowerCase() !== role.title.toLowerCase()) {
    const clash = await JobRole.findOne({ title: req.body.title, _id: { $ne: role._id } }).collation({ locale: 'en', strength: 2 });
    if (clash) throw ApiError.conflict('A role with this title already exists', { fields: { title: 'Already exists' } });
    role.slug = await uniqueSlug(req.body.title, role._id);
  }
  Object.assign(role, req.body, { updatedBy: req.user._id });
  await role.save();

  await audit(req, 'role.updated', {
    entity: 'JobRole',
    entityId: role._id,
    summary: `Updated role "${role.title}"`,
    metadata: { before: { title: before.title, active: before.active, positions: before.positions }, after: req.body },
  });
  res.json({ success: true, role });
});

const toggle = asyncHandler(async (req, res) => {
  const role = await JobRole.findByIdAndUpdate(req.params.id, { active: req.body.active, updatedBy: req.user._id }, { new: true });
  if (!role) throw ApiError.notFound('Role not found');
  await audit(req, role.active ? 'role.activated' : 'role.deactivated', {
    entity: 'JobRole',
    entityId: role._id,
    summary: `${role.active ? 'Activated' : 'Deactivated'} role "${role.title}"`,
  });
  res.json({ success: true, role });
});

const remove = asyncHandler(async (req, res) => {
  const role = await JobRole.findById(req.params.id);
  if (!role) throw ApiError.notFound('Role not found');
  const applications = await Application.countDocuments({ role: role._id });
  if (applications > 0) {
    throw ApiError.conflict(
      `"${role.title}" has ${applications} application(s) and cannot be deleted. Deactivate it instead to hide it from the application form.`
    );
  }
  await role.deleteOne();
  await audit(req, 'role.deleted', { entity: 'JobRole', entityId: role._id, summary: `Deleted role "${role.title}"` });
  res.json({ success: true });
});

module.exports = { schemas, list, options, create, update, toggle, remove };
