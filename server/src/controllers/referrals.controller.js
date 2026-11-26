const { z } = require('zod');
const { Referrer, Referral } = require('../models/Referral');
const { audit } = require('../services/audit.service');
const ApiError = require('../utils/ApiError');
const { asyncHandler, escapeRegex, paging, startOfWeek } = require('../utils/helpers');

const schemas = {
  adjust: z.object({
    points: z.coerce.number().int().min(-100000).max(100000).refine((v) => v !== 0, 'Points cannot be zero'),
    reason: z.string().trim().min(3, 'Give a reason').max(300),
  }),
  toggle: z.object({ active: z.boolean() }),
  referralStatus: z.object({ status: z.enum(['valid', 'rejected']) }),
};

const summary = asyncHandler(async (_req, res) => {
  const [referrers, activeReferrers, valid, rejected, pointsAgg, thisWeek, topReferrers, reasons] = await Promise.all([
    Referrer.countDocuments(),
    Referrer.countDocuments({ successfulReferrals: { $gt: 0 } }),
    Referral.countDocuments({ status: 'valid' }),
    Referral.countDocuments({ status: 'rejected' }),
    Referrer.aggregate([{ $group: { _id: null, total: { $sum: '$totalPoints' } } }]),
    Referral.countDocuments({ status: 'valid', createdAt: { $gte: startOfWeek() } }),
    Referrer.find({ totalPoints: { $gt: 0 } }).sort({ totalPoints: -1 }).limit(10).select('name email code totalPoints successfulReferrals').lean(),
    Referral.aggregate([{ $match: { status: 'rejected' } }, { $group: { _id: '$rejectionReason', count: { $sum: 1 } } }]),
  ]);
  res.json({
    success: true,
    stats: { referrers, activeReferrers, valid, rejected, totalPoints: pointsAgg[0]?.total || 0, thisWeek },
    leaderboard: topReferrers,
    rejectionReasons: reasons.map((r) => ({ reason: r._id || 'unknown', count: r.count })),
  });
});

const listReferrers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paging(req.query, { defaultLimit: 10 });
  const filter = {};
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(String(req.query.search).slice(0, 80)), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { code: rx }];
  }
  const sort = req.query.sort === 'newest' ? { createdAt: -1 } : { totalPoints: -1, createdAt: -1 };
  const [items, total] = await Promise.all([
    Referrer.find(filter).sort(sort).skip(skip).limit(limit).select('-adjustments').lean(),
    Referrer.countDocuments(filter),
  ]);
  res.json({ success: true, items, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
});

const getReferrer = asyncHandler(async (req, res) => {
  const referrer = await Referrer.findById(req.params.id).lean();
  if (!referrer) throw ApiError.notFound('Referrer not found');
  const referrals = await Referral.find({ referrer: referrer._id })
    .sort({ createdAt: -1 })
    .populate('application', 'roleTitle status createdAt')
    .lean();
  res.json({ success: true, referrer, referrals });
});

const listReferrals = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paging(req.query, { defaultLimit: 10 });
  const filter = {};
  if (['valid', 'rejected'].includes(req.query.status)) filter.status = req.query.status;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(String(req.query.search).slice(0, 80)), 'i');
    filter.$or = [{ candidateName: rx }, { candidateEmail: rx }];
  }
  const [items, total] = await Promise.all([
    Referral.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('referrer', 'name email code')
      .populate('application', 'roleTitle status')
      .lean(),
    Referral.countDocuments(filter),
  ]);
  res.json({ success: true, items, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
});

const adjustPoints = asyncHandler(async (req, res) => {
  const referrer = await Referrer.findById(req.params.id);
  if (!referrer) throw ApiError.notFound('Referrer not found');
  const { points, reason } = req.body;
  if (referrer.totalPoints + points < 0) throw ApiError.badRequest('Points balance cannot go below zero', { fields: { points: 'Too large a deduction' } });
  referrer.adjustments.push({ points, reason, by: req.user._id, byName: req.user.name });
  referrer.totalPoints += points;
  await referrer.save();
  await audit(req, 'referral.points_adjusted', {
    entity: 'Referrer',
    entityId: referrer._id,
    summary: `${points > 0 ? '+' : ''}${points} points for ${referrer.email}: ${reason}`,
    metadata: { points, reason },
  });
  res.json({ success: true, referrer });
});

const toggleReferrer = asyncHandler(async (req, res) => {
  const referrer = await Referrer.findByIdAndUpdate(req.params.id, { active: req.body.active }, { new: true });
  if (!referrer) throw ApiError.notFound('Referrer not found');
  await audit(req, referrer.active ? 'referral.referrer_activated' : 'referral.referrer_suspended', {
    entity: 'Referrer',
    entityId: referrer._id,
    summary: `${referrer.active ? 'Re-activated' : 'Suspended'} referrer ${referrer.email}`,
  });
  res.json({ success: true, referrer });
});

/** Manually invalidate a fraudulent referral (reverses its points) */
const rejectReferral = asyncHandler(async (req, res) => {
  const referral = await Referral.findOneAndUpdate(
    { _id: req.params.id, status: 'valid' },
    { status: 'rejected', rejectionReason: 'manual' },
    { new: false }
  );
  if (!referral) throw ApiError.notFound('Valid referral not found');
  await Referrer.updateOne(
    { _id: referral.referrer },
    { $inc: { totalPoints: -referral.pointsAwarded, successfulReferrals: referral.awards.some((a) => a.milestone === 'application') ? -1 : 0 } }
  );
  await audit(req, 'referral.rejected', {
    entity: 'Referral',
    entityId: referral._id,
    summary: `Rejected referral of ${referral.candidateEmail} (−${referral.pointsAwarded} points)`,
  });
  res.json({ success: true });
});

module.exports = { schemas, summary, listReferrers, getReferrer, listReferrals, adjustPoints, toggleReferrer, rejectReferral };
