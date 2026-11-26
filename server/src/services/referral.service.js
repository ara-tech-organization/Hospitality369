const { Referrer, Referral } = require('../models/Referral');
const Setting = require('../models/Setting');
const { referralCode, normalizeMobile, startOfDay } = require('../utils/helpers');

const STATUS_MILESTONES = {
  shortlisted: ['shortlisted'],
  interview: ['shortlisted'],
  offered: ['shortlisted'],
  hired: ['shortlisted', 'hired'],
};

async function uniqueCode() {
  for (let i = 0; i < 10; i += 1) {
    const code = referralCode();
    // eslint-disable-next-line no-await-in-loop
    if (!(await Referrer.exists({ code }))) return code;
  }
  throw new Error('Could not generate a unique referral code');
}

/** Find or create a referrer for this person. Returns { referrer, created } */
async function enrol({ name, email, mobile, source = 'signup' }) {
  const existing = await Referrer.findOne({ email: email.toLowerCase() });
  if (existing) return { referrer: existing, created: false };
  const referrer = await Referrer.create({
    name,
    email,
    mobile: mobile ? normalizeMobile(mobile) : undefined,
    code: await uniqueCode(),
    source,
  });
  return { referrer, created: true };
}

function pointsFor(milestone, rules) {
  return {
    application: rules.pointsOnApplication,
    shortlisted: rules.pointsOnShortlist,
    hired: rules.pointsOnHire,
  }[milestone] || 0;
}

async function award(referral, milestone, rules) {
  const points = pointsFor(milestone, rules);
  // Atomic "pay once per milestone" guard – safe under concurrent status updates
  const res = await Referral.updateOne(
    { _id: referral._id, status: 'valid', 'awards.milestone': { $ne: milestone } },
    { $push: { awards: { milestone, points, at: new Date() } }, $inc: { pointsAwarded: points } }
  );
  if (!res.modifiedCount) return;
  const inc = { totalPoints: points };
  if (milestone === 'application') inc.successfulReferrals = 1;
  await Referrer.updateOne({ _id: referral.referrer }, { $inc: inc });
}

/**
 * Called after an application is created with a referral code.
 * Applies fraud checks and awards application points when eligible.
 * Returns the Referral document or null.
 */
async function recordReferral(application, code) {
  const settings = await Setting.get();
  const rules = settings.referral;
  if (!rules.enabled || !code) return null;

  const referrer = await Referrer.findOne({ code: String(code).trim().toUpperCase() });
  if (!referrer) return null;

  application.referral = { code: referrer.code, referrer: referrer._id };
  await application.save();

  let rejectionReason = null;
  const sameEmail = referrer.email === application.email;
  const sameMobile = referrer.mobile && normalizeMobile(referrer.mobile) === normalizeMobile(application.mobile);

  if (!referrer.active) rejectionReason = 'inactive_referrer';
  else if (sameEmail || sameMobile) rejectionReason = 'self_referral';
  else if (await Referral.exists({ candidateEmail: application.email, status: 'valid' })) rejectionReason = 'already_referred';
  else {
    const today = await Referral.countDocuments({ referrer: referrer._id, status: 'valid', createdAt: { $gte: startOfDay() } });
    if (today >= rules.maxReferralsPerDay) rejectionReason = 'daily_limit';
  }

  let referral;
  try {
    referral = await Referral.create({
      referrer: referrer._id,
      application: application._id,
      candidateName: application.fullName,
      candidateEmail: application.email,
      status: rejectionReason ? 'rejected' : 'valid',
      rejectionReason,
    });
  } catch (err) {
    if (err.code !== 11000) throw err;
    // Race: another valid referral for this candidate was created concurrently
    referral = await Referral.create({
      referrer: referrer._id,
      application: application._id,
      candidateName: application.fullName,
      candidateEmail: application.email,
      status: 'rejected',
      rejectionReason: 'already_referred',
    });
  }

  if (referral.status === 'valid') await award(referral, 'application', rules);
  return referral;
}

/** Called when an application status changes – pays milestone bonuses */
async function onStatusChange(application, status) {
  const milestones = STATUS_MILESTONES[status];
  if (!milestones) return;
  const referral = await Referral.findOne({ application: application._id, status: 'valid' });
  if (!referral) return;
  const settings = await Setting.get();
  for (const m of milestones) {
    // eslint-disable-next-line no-await-in-loop
    await award(referral, m, settings.referral);
  }
}

module.exports = { enrol, recordReferral, onStatusChange };
