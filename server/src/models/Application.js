const mongoose = require('mongoose');
const { APPLICATION_STATUSES } = require('../constants');

const statusEventSchema = new mongoose.Schema(
  {
    status: { type: String, enum: APPLICATION_STATUSES, required: true },
    note: { type: String, maxlength: 1000, default: '' },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedByName: String,
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    mobile: { type: String, required: true, trim: true, maxlength: 20 },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRole', required: true },
    roleTitle: { type: String, required: true }, // snapshot, survives role renames/deletion
    industry: String,
    position: { type: String, required: true, trim: true, maxlength: 80 },
    resume: {
      driver: { type: String, required: true },
      key: { type: String, required: true },
      originalName: { type: String, required: true },
      mimeType: String,
      size: Number,
    },
    status: { type: String, enum: APPLICATION_STATUSES, default: 'new' },
    statusHistory: [statusEventSchema],
    referral: {
      code: String,
      referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'Referrer' },
    },
    consent: { type: Boolean, required: true },
    meta: {
      ip: { type: String, select: false },
      userAgent: { type: String, select: false },
    },
  },
  { timestamps: true }
);

applicationSchema.index({ createdAt: -1 });
applicationSchema.index({ role: 1, createdAt: -1 });
applicationSchema.index({ status: 1, createdAt: -1 });
applicationSchema.index({ email: 1, role: 1, createdAt: -1 });
applicationSchema.index({ mobile: 1, role: 1, createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
