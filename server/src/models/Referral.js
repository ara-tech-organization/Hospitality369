const mongoose = require('mongoose');

/** A person enrolled in the referral programme (candidate or any registered user) */
const adjustmentSchema = new mongoose.Schema(
  {
    points: { type: Number, required: true },
    reason: { type: String, required: true, maxlength: 300 },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    byName: String,
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const referrerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, trim: true, maxlength: 20 },
    code: { type: String, required: true, unique: true },
    totalPoints: { type: Number, default: 0 },
    successfulReferrals: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    adjustments: [adjustmentSchema],
    source: { type: String, enum: ['signup', 'application'], default: 'signup' },
  },
  { timestamps: true }
);
referrerSchema.index({ totalPoints: -1 });

/** One referral = one candidate application that used a referral code */
const awardSchema = new mongoose.Schema(
  {
    milestone: { type: String, enum: ['application', 'shortlisted', 'hired'], required: true },
    points: { type: Number, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const referralSchema = new mongoose.Schema(
  {
    referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'Referrer', required: true },
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, unique: true },
    candidateName: String,
    // A given candidate can only ever be credited to one referrer
    candidateEmail: { type: String, required: true, lowercase: true },
    status: { type: String, enum: ['valid', 'rejected'], default: 'valid' },
    rejectionReason: { type: String, enum: ['self_referral', 'already_referred', 'daily_limit', 'inactive_referrer', 'manual', null], default: null },
    awards: [awardSchema],
    pointsAwarded: { type: Number, default: 0 },
  },
  { timestamps: true }
);
referralSchema.index({ candidateEmail: 1 }, { unique: true, partialFilterExpression: { status: 'valid' } });
referralSchema.index({ referrer: 1, createdAt: -1 });

module.exports = {
  Referrer: mongoose.model('Referrer', referrerSchema),
  Referral: mongoose.model('Referral', referralSchema),
};
