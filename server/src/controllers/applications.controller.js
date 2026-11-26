const { z } = require('zod');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const Application = require('../models/Application');
const { Referral } = require('../models/Referral');
const storage = require('../services/storage');
const referralService = require('../services/referral.service');
const { audit } = require('../services/audit.service');
const ApiError = require('../utils/ApiError');
const { asyncHandler, escapeRegex, paging } = require('../utils/helpers');
const { APPLICATION_STATUSES } = require('../constants');

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .optional()
  .or(z.literal(''));

const schemas = {
  listQuery: z.object({
    search: z.string().trim().max(100).optional(),
    role: z.string().refine((v) => !v || mongoose.isValidObjectId(v), 'Invalid role').optional(),
    status: z.enum(APPLICATION_STATUSES).optional().or(z.literal('')),
    from: dateStr,
    to: dateStr,
    sort: z.enum(['newest', 'oldest']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    scope: z.enum(['filtered', 'all']).optional(),
  }),
  status: z.object({
    status: z.enum(APPLICATION_STATUSES, { errorMap: () => ({ message: 'Select a valid status' }) }),
    note: z.string().trim().max(1000).optional().or(z.literal('')),
  }),
};

/** Build a MongoDB filter from validated query params */
function buildFilter(q = {}) {
  const filter = {};
  if (q.role) filter.role = new mongoose.Types.ObjectId(q.role);
  if (q.status) filter.status = q.status;
  if (q.from || q.to) {
    filter.createdAt = {};
    if (q.from) filter.createdAt.$gte = new Date(`${q.from}T00:00:00`);
    if (q.to) filter.createdAt.$lte = new Date(`${q.to}T23:59:59.999`);
  }
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), 'i');
    const digits = q.search.replace(/\D/g, '');
    filter.$or = [{ fullName: rx }, { email: rx }];
    if (digits.length >= 3) filter.$or.push({ mobile: new RegExp(escapeRegex(digits)) });
  }
  return filter;
}

const LIST_FIELDS = 'fullName email mobile roleTitle role position status createdAt resume.originalName resume.size referral.code';

const list = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  const filter = buildFilter(q);
  const { page, limit, skip } = paging(q, { defaultLimit: 10 });
  const sort = { createdAt: q.sort === 'oldest' ? 1 : -1 };

  const [items, total] = await Promise.all([
    Application.find(filter).select(LIST_FIELDS).sort(sort).skip(skip).limit(limit).lean(),
    Application.countDocuments(filter),
  ]);

  res.json({
    success: true,
    items,
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  });
});

const getOne = asyncHandler(async (req, res) => {
  const app = await Application.findById(req.params.id).populate('role', 'title industry active').lean();
  if (!app) throw ApiError.notFound('Application not found');
  const referral = await Referral.findOne({ application: app._id })
    .populate('referrer', 'name email code')
    .lean();
  await audit(req, 'application.viewed', { entity: 'Application', entityId: app._id, summary: `Viewed application of ${app.fullName}` });
  res.json({ success: true, application: app, referral });
});

const updateStatus = asyncHandler(async (req, res) => {
  const app = await Application.findById(req.params.id);
  if (!app) throw ApiError.notFound('Application not found');
  const previous = app.status;
  const { status, note } = req.body;
  if (previous === status && !note) throw ApiError.badRequest('Status is unchanged');

  app.status = status;
  app.statusHistory.push({ status, note: note || '', changedBy: req.user._id, changedByName: req.user.name });
  await app.save();

  try {
    await referralService.onStatusChange(app, status);
  } catch (err) {
    console.error('[referral] milestone award failed', err.message);
  }

  await audit(req, 'application.status_changed', {
    entity: 'Application',
    entityId: app._id,
    summary: `${app.fullName}: ${previous} → ${status}`,
    metadata: { from: previous, to: status, note },
  });
  res.json({ success: true, application: { _id: app._id, status: app.status, statusHistory: app.statusHistory } });
});

const downloadResume = asyncHandler(async (req, res) => {
  const app = await Application.findById(req.params.id).select('fullName resume').lean();
  if (!app) throw ApiError.notFound('Application not found');
  const stream = await storage.stream(app.resume.key);

  await audit(req, 'resume.downloaded', {
    entity: 'Application',
    entityId: app._id,
    summary: `Downloaded resume of ${app.fullName}`,
  });

  const safeName = app.resume.originalName.replace(/["\\\r\n]/g, '_');
  res.setHeader('Content-Type', app.resume.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  stream.on('error', (err) => {
    console.error('[resume] stream error', err.message);
    if (!res.headersSent) res.status(500).end();
    else res.destroy();
  });
  stream.pipe(res);
});

const exportExcel = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  const filter = q.scope === 'all' ? {} : buildFilter(q);
  const sort = { createdAt: q.sort === 'oldest' ? 1 : -1 };

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Hospitality369';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('Candidates', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = [
    { header: 'Name', key: 'fullName', width: 28 },
    { header: 'Email', key: 'email', width: 32 },
    { header: 'Mobile Number', key: 'mobile', width: 18 },
    { header: 'Applied Role', key: 'roleTitle', width: 26 },
    { header: 'Position', key: 'position', width: 26 },
    { header: 'Application Date', key: 'createdAt', width: 20, style: { numFmt: 'dd mmm yyyy hh:mm' } },
    { header: 'Application Status', key: 'status', width: 18 },
  ];
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F1B2D' } };
  header.alignment = { vertical: 'middle' };
  header.height = 22;

  let count = 0;
  const cursor = Application.find(filter).select('fullName email mobile roleTitle position createdAt status').sort(sort).lean().cursor();
  for await (const doc of cursor) {
    sheet.addRow({ ...doc, status: doc.status.charAt(0).toUpperCase() + doc.status.slice(1) });
    count += 1;
  }
  sheet.autoFilter = { from: 'A1', to: 'G1' };

  await audit(req, 'candidates.exported', {
    entity: 'Application',
    summary: `Exported ${count} candidate record(s) to Excel (${q.scope === 'all' ? 'all records' : 'filtered'})`,
    metadata: { scope: q.scope || 'filtered', filters: q.scope === 'all' ? undefined : q, count },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="hospitality369-candidates-${stamp}.xlsx"`);
  res.setHeader('Cache-Control', 'private, no-store');
  await workbook.xlsx.write(res);
  res.end();
});

const remove = asyncHandler(async (req, res) => {
  const app = await Application.findById(req.params.id);
  if (!app) throw ApiError.notFound('Application not found');
  await storage.remove(app.resume.key);
  await Referral.deleteOne({ application: app._id });
  await app.deleteOne();
  await audit(req, 'application.deleted', { entity: 'Application', entityId: app._id, summary: `Deleted application of ${app.fullName} (${app.email})` });
  res.json({ success: true });
});

module.exports = { schemas, buildFilter, list, getOne, updateStatus, downloadResume, exportExcel, remove };
