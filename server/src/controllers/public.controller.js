const { z } = require('zod');
const mongoose = require('mongoose');
const JobRole = require('../models/JobRole');
const Application = require('../models/Application');
const Setting = require('../models/Setting');
const { Referrer, Referral } = require('../models/Referral');
const { Program, Enquiry } = require('../models/Program');
const storage = require('../services/storage');
const referralService = require('../services/referral.service');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const { asyncHandler, normalizeMobile, maskName, clientIp } = require('../utils/helpers');
const { PROGRAM_MODULES } = require('../constants');

/* ----------------------------- validation ----------------------------- */

const name = z
  .string({ required_error: 'Full name is required' })
  .trim()
  .min(2, 'Enter your full name')
  .max(100, 'Name is too long')
  .regex(/^[\p{L}\p{M}' .-]+$/u, 'Name can only contain letters, spaces, apostrophes and hyphens');

const email = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .max(254)
  .email('Enter a valid email address');

const mobile = z
  .string({ required_error: 'Mobile number is required' })
  .trim()
  .regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a valid mobile number')
  .refine((v) => {
    const digits = v.replace(/\D/g, '').length;
    return digits >= 8 && digits <= 15;
  }, 'Mobile number must contain 8–15 digits');

const objectId = z.string().refine((v) => mongoose.isValidObjectId(v), 'Select a valid option');

const schemas = {
  application: z.object({
    fullName: name,
    email,
    mobile,
    role: objectId,
    position: z.string({ required_error: 'Position is required' }).trim().min(2, 'Select or enter a position').max(80),
    consent: z.preprocess((v) => v === true || v === 'true' || v === 'on', z.literal(true, { errorMap: () => ({ message: 'Please accept the privacy notice' }) })),
    referralCode: z.string().trim().toUpperCase().max(20).optional().or(z.literal('')),
    website: z.string().max(0, 'Bot detected').optional().or(z.literal('')), // honeypot
  }),
  join: z.object({
    name,
    email,
    mobile: mobile.optional().or(z.literal('')),
    website: z.string().max(0).optional().or(z.literal('')),
  }),
  lookup: z.object({
    email,
    code: z.string().trim().toUpperCase().min(4, 'Enter your referral code').max(20),
  }),
  enquiry: z.object({
    module: z.enum(PROGRAM_MODULES),
    program: objectId.optional().or(z.literal('')),
    name,
    email,
    mobile: mobile.optional().or(z.literal('')),
    currentRole: z.string().trim().max(100).optional().or(z.literal('')),
    message: z.string().trim().max(1500).optional().or(z.literal('')),
    website: z.string().max(0).optional().or(z.literal('')),
  }),
};

/* ------------------------------ handlers ------------------------------ */

const config = asyncHandler(async (_req, res) => {
  const s = await Setting.get();
  res.json({
    success: true,
    config: {
      acceptingApplications: s.applications.accepting,
      maxResumeMb: Math.round(env.storage.maxResumeBytes / 1048576),
      referral: {
        enabled: s.referral.enabled,
        pointsOnApplication: s.referral.pointsOnApplication,
        pointsOnShortlist: s.referral.pointsOnShortlist,
        pointsOnHire: s.referral.pointsOnHire,
      },
      contact: s.site,
    },
  });
});

const listRoles = asyncHandler(async (_req, res) => {
  const roles = await JobRole.find({ active: true })
    .select('title slug industry description positions')
    .sort({ sortOrder: 1, title: 1 })
    .lean();
  res.json({ success: true, roles });
});

const submitApplication = asyncHandler(async (req, res) => {
  const settings = await Setting.get();
  if (!settings.applications.accepting) {
    throw new ApiError(503, 'We are not accepting new applications right now. Please check back soon.');
  }

  const data = req.body;
  const role = await JobRole.findOne({ _id: data.role, active: true });
  if (!role) throw ApiError.badRequest('The selected role is no longer available', { fields: { role: 'Select an available role' } });

  if (role.positions.length && !role.positions.includes(data.position)) {
    throw ApiError.badRequest('Select a valid position for this role', { fields: { position: 'Select a valid position' } });
  }

  const mobileNorm = normalizeMobile(data.mobile);

  // Duplicate prevention: same person + same role within the configured window
  const windowDays = settings.applications.duplicateWindowDays;
  if (windowDays > 0) {
    const since = new Date(Date.now() - windowDays * 86400000);
    const dup = await Application.exists({
      role: role._id,
      createdAt: { $gte: since },
      $or: [{ email: data.email }, { mobile: mobileNorm }],
    });
    if (dup) {
      throw ApiError.conflict(
        `You have already applied for ${role.title} recently. Our team is reviewing your application – you can apply for this role again after ${windowDays} days.`
      );
    }
  }

  const key = await storage.save(req.file.buffer, { ext: req.file.ext, mimeType: req.file.mimetype });

  let application;
  try {
    application = await Application.create({
      fullName: data.fullName,
      email: data.email,
      mobile: mobileNorm,
      role: role._id,
      roleTitle: role.title,
      industry: role.industry,
      position: data.position,
      consent: true,
      resume: {
        driver: storage.name(),
        key,
        originalName: req.file.originalname.replace(/[^\w.\- ()]/g, '_').slice(0, 150),
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
      statusHistory: [{ status: 'new', note: 'Application submitted', changedByName: 'Candidate' }],
      meta: { ip: clientIp(req), userAgent: String(req.get('user-agent') || '').slice(0, 300) },
    });
  } catch (err) {
    await storage.remove(key);
    throw err;
  }

  // Referral credit (never blocks the application)
  let referralApplied = false;
  if (data.referralCode) {
    try {
      const referral = await referralService.recordReferral(application, data.referralCode);
      referralApplied = referral?.status === 'valid';
    } catch (err) {
      console.error('[referral] failed to record referral', err.message);
    }
  }

  // Enrol the candidate into the referral programme so they can refer friends
  let myReferral = null;
  if (settings.referral.enabled) {
    try {
      const { referrer, created } = await referralService.enrol({
        name: data.fullName,
        email: data.email,
        mobile: mobileNorm,
        source: 'application',
      });
      myReferral = created ? { code: referrer.code, link: `${env.siteUrl}/recruiting?ref=${referrer.code}` } : { alreadyEnrolled: true };
    } catch (err) {
      console.error('[referral] enrolment failed', err.message);
    }
  }

  res.status(201).json({
    success: true,
    message: `Thank you, ${data.fullName.split(' ')[0]}! Your application for ${role.title} has been received.`,
    application: { id: application._id, reference: String(application._id).slice(-8).toUpperCase(), role: role.title, position: data.position },
    referralApplied,
    myReferral,
  });
});

/* ---------------------------- referrals ---------------------------- */

const joinReferral = asyncHandler(async (req, res) => {
  const settings = await Setting.get();
  if (!settings.referral.enabled) throw new ApiError(503, 'The referral programme is currently paused.');
  const { referrer, created } = await referralService.enrol({ ...req.body, source: 'signup' });
  if (!created) {
    throw ApiError.conflict('This email is already enrolled. Use "Check my points" with your referral code.');
  }
  res.status(201).json({
    success: true,
    referrer: { name: referrer.name, code: referrer.code, link: `${env.siteUrl}/recruiting?ref=${referrer.code}` },
  });
});

const lookupReferral = asyncHandler(async (req, res) => {
  const referrer = await Referrer.findOne({ email: req.body.email, code: req.body.code });
  if (!referrer) throw ApiError.notFound('No referral account matches that email and code');
  const referrals = await Referral.find({ referrer: referrer._id }).sort({ createdAt: -1 }).limit(50).lean();
  const rank = (await Referrer.countDocuments({ active: true, totalPoints: { $gt: referrer.totalPoints } })) + 1;
  res.json({
    success: true,
    referrer: {
      name: referrer.name,
      code: referrer.code,
      link: `${env.siteUrl}/recruiting?ref=${referrer.code}`,
      totalPoints: referrer.totalPoints,
      successfulReferrals: referrer.successfulReferrals,
      rank,
      joinedAt: referrer.createdAt,
    },
    history: [
      ...referrals.map((r) => ({
        type: 'referral',
        candidate: maskName(r.candidateName),
        status: r.status,
        reason: r.rejectionReason,
        points: r.pointsAwarded,
        milestones: r.awards.map((a) => a.milestone),
        at: r.createdAt,
      })),
      ...referrer.adjustments.map((a) => ({ type: 'adjustment', reason: a.reason, points: a.points, at: a.at })),
    ].sort((a, b) => new Date(b.at) - new Date(a.at)),
  });
});

const validateReferralCode = asyncHandler(async (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase().slice(0, 20);
  const referrer = await Referrer.findOne({ code, active: true }).select('name').lean();
  res.json({ success: true, valid: Boolean(referrer), referrer: referrer ? maskName(referrer.name) : null });
});

const leaderboard = asyncHandler(async (_req, res) => {
  const top = await Referrer.find({ active: true, totalPoints: { $gt: 0 } })
    .sort({ totalPoints: -1, successfulReferrals: -1, createdAt: 1 })
    .limit(10)
    .select('name totalPoints successfulReferrals')
    .lean();
  res.json({
    success: true,
    leaderboard: top.map((r, i) => ({ rank: i + 1, name: maskName(r.name), points: r.totalPoints, referrals: r.successfulReferrals })),
  });
});

/* ----------------------- mentoring / training / coaching ----------------------- */

const listPrograms = asyncHandler(async (req, res) => {
  const filter = { active: true };
  if (PROGRAM_MODULES.includes(req.query.module)) filter.module = req.query.module;
  const programs = await Program.find(filter).sort({ sortOrder: 1, title: 1 }).lean();
  res.json({ success: true, programs });
});

const submitEnquiry = asyncHandler(async (req, res) => {
  const data = req.body;
  let programTitle;
  if (data.program) {
    const program = await Program.findOne({ _id: data.program, module: data.module, active: true });
    if (!program) throw ApiError.badRequest('Selected programme is unavailable', { fields: { program: 'Select a valid programme' } });
    programTitle = program.title;
  }
  const recent = await Enquiry.exists({ email: data.email, module: data.module, createdAt: { $gte: new Date(Date.now() - 86400000) } });
  if (recent) throw ApiError.conflict('We already received your enquiry today – our team will be in touch shortly.');
  await Enquiry.create({
    module: data.module,
    program: data.program || undefined,
    programTitle,
    name: data.name,
    email: data.email,
    mobile: data.mobile ? normalizeMobile(data.mobile) : undefined,
    currentRole: data.currentRole,
    message: data.message,
  });
  res.status(201).json({ success: true, message: 'Thank you! A programme advisor will contact you within 2 working days.' });
});

module.exports = {
  schemas,
  config,
  listRoles,
  submitApplication,
  joinReferral,
  lookupReferral,
  validateReferralCode,
  leaderboard,
  listPrograms,
  submitEnquiry,
};
