const Application = require('../models/Application');
const JobRole = require('../models/JobRole');
const { Referrer, Referral } = require('../models/Referral');
const { Enquiry } = require('../models/Program');
const { asyncHandler, startOfDay, startOfWeek } = require('../utils/helpers');
const { PERMISSIONS, APPLICATION_STATUSES } = require('../constants');

const TREND_DAYS = 30;

const overview = asyncHandler(async (req, res) => {
  const today = startOfDay();
  const week = startOfWeek();
  const trendStart = new Date(today);
  trendStart.setDate(trendStart.getDate() - (TREND_DAYS - 1));
  const prevWeekStart = new Date(week);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  const [
    total,
    todayCount,
    weekCount,
    prevWeekCount,
    distinctCandidates,
    byRole,
    byStatus,
    trendRaw,
    activeRoles,
    totalRoles,
    referrers,
    validReferrals,
    newEnquiries,
  ] = await Promise.all([
    Application.countDocuments(),
    Application.countDocuments({ createdAt: { $gte: today } }),
    Application.countDocuments({ createdAt: { $gte: week } }),
    Application.countDocuments({ createdAt: { $gte: prevWeekStart, $lt: week } }),
    Application.distinct('email').then((a) => a.length),
    Application.aggregate([
      { $group: { _id: '$role', title: { $last: '$roleTitle' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 },
    ]),
    Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Application.aggregate([
      { $match: { createdAt: { $gte: trendStart } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone } },
          count: { $sum: 1 },
        },
      },
    ]),
    JobRole.find({ active: true }).select('title industry').sort({ sortOrder: 1, title: 1 }).lean(),
    JobRole.countDocuments(),
    Referrer.countDocuments(),
    Referral.countDocuments({ status: 'valid' }),
    Enquiry.countDocuments({ status: 'new' }),
  ]);

  // Fill gaps so the trend line is continuous
  const map = Object.fromEntries(trendRaw.map((t) => [t._id, t.count]));
  const trend = [];
  for (let i = 0; i < TREND_DAYS; i += 1) {
    const d = new Date(trendStart);
    d.setDate(d.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    trend.push({ date: key, count: map[key] || 0 });
  }

  const statusMap = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));

  // Recent applications contain personal data – only for users who may view candidates
  let recent = null;
  if (req.user.effectivePermissions().includes(PERMISSIONS.CANDIDATES_VIEW)) {
    recent = await Application.find()
      .select('fullName email roleTitle position status createdAt')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();
  }

  res.json({
    success: true,
    stats: {
      total,
      today: todayCount,
      thisWeek: weekCount,
      lastWeek: prevWeekCount,
      candidates: distinctCandidates,
      hired: statusMap.hired || 0,
      activeRoles: activeRoles.length,
      totalRoles,
      referrers,
      validReferrals,
      newEnquiries,
    },
    byRole: byRole.map((r) => ({ roleId: r._id, title: r.title, count: r.count })),
    byStatus: APPLICATION_STATUSES.map((s) => ({ status: s, count: statusMap[s] || 0 })),
    trend,
    roles: activeRoles,
    recent,
  });
});

module.exports = { overview };
