/** Super-admin settings, audit logs, and programme enquiries */
const { z } = require('zod');
const Setting = require('../models/Setting');
const AuditLog = require('../models/AuditLog');
const { Enquiry } = require('../models/Program');
const { audit } = require('../services/audit.service');
const ApiError = require('../utils/ApiError');
const { asyncHandler, escapeRegex, paging } = require('../utils/helpers');
const { ENQUIRY_SOURCES, ENQUIRY_STATUSES } = require('../constants');

const int = (min, max) => z.coerce.number().int().min(min).max(max);

const schemas = {
  settings: z.object({
    applications: z
      .object({ accepting: z.boolean(), duplicateWindowDays: int(0, 365) })
      .partial()
      .optional(),
    referral: z
      .object({
        enabled: z.boolean(),
        pointsOnApplication: int(0, 10000),
        pointsOnShortlist: int(0, 10000),
        pointsOnHire: int(0, 10000),
        maxReferralsPerDay: int(1, 1000),
      })
      .partial()
      .optional(),
    site: z
      .object({
        contactEmail: z.string().trim().email('Enter a valid email'),
        contactPhone: z.string().trim().max(30),
        address: z.string().trim().max(200),
      })
      .partial()
      .optional(),
  }),
  enquiryStatus: z.object({ status: z.enum(ENQUIRY_STATUSES) }),
};

const getSettings = asyncHandler(async (_req, res) => {
  res.json({ success: true, settings: await Setting.get() });
});

const updateSettings = asyncHandler(async (req, res) => {
  const set = {};
  for (const [group, values] of Object.entries(req.body)) {
    for (const [k, v] of Object.entries(values || {})) set[`${group}.${k}`] = v;
  }
  if (!Object.keys(set).length) throw ApiError.badRequest('Nothing to update');
  set.updatedBy = req.user._id;
  const settings = await Setting.findOneAndUpdate({ key: 'global' }, { $set: set }, { new: true, upsert: true, runValidators: true });
  await audit(req, 'settings.updated', { entity: 'Setting', summary: `Updated settings: ${Object.keys(set).filter((k) => k !== 'updatedBy').join(', ')}`, metadata: req.body });
  res.json({ success: true, settings });
});

const auditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paging(req.query, { defaultLimit: 20 });
  const filter = {};
  if (req.query.action) filter.action = new RegExp(`^${escapeRegex(String(req.query.action).slice(0, 60))}`);
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(String(req.query.search).slice(0, 80)), 'i');
    filter.$or = [{ summary: rx }, { actorEmail: rx }, { actorName: rx }];
  }
  const [items, total, actions] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(filter),
    AuditLog.distinct('action'),
  ]);
  res.json({ success: true, items, actions: actions.sort(), pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
});

const listEnquiries = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paging(req.query, { defaultLimit: 10 });
  const filter = {};
  if (ENQUIRY_SOURCES.includes(req.query.module)) filter.module = req.query.module;
  if (ENQUIRY_STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(String(req.query.search).slice(0, 80)), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { company: rx }, { topic: rx }];
  }
  const [items, total, bySource, newBySource] = await Promise.all([
    Enquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Enquiry.countDocuments(filter),
    Enquiry.aggregate([{ $group: { _id: '$module', count: { $sum: 1 } } }]),
    Enquiry.aggregate([{ $match: { status: 'new' } }, { $group: { _id: '$module', count: { $sum: 1 } } }]),
  ]);
  // Totals per source (contact / mentoring / training / coaching) for the dashboard tabs
  const counts = Object.fromEntries(ENQUIRY_SOURCES.map((m) => [m, { total: 0, new: 0 }]));
  bySource.forEach((b) => { if (counts[b._id]) counts[b._id].total = b.count; });
  newBySource.forEach((b) => { if (counts[b._id]) counts[b._id].new = b.count; });
  res.json({ success: true, items, counts, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
});

const updateEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!enquiry) throw ApiError.notFound('Enquiry not found');
  await audit(req, 'enquiry.status_changed', { entity: 'Enquiry', entityId: enquiry._id, summary: `${enquiry.name} (${enquiry.module}) → ${enquiry.status}` });
  res.json({ success: true, enquiry });
});

module.exports = { schemas, getSettings, updateSettings, auditLogs, listEnquiries, updateEnquiry };
