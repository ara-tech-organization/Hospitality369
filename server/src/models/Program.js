const mongoose = require('mongoose');
const { PROGRAM_MODULES, ENQUIRY_STATUSES } = require('../constants');

/**
 * Programmes offered under Mentoring / Training / Coaching.
 * Phase 1 exposes them publicly + collects enquiries; the schema already
 * supports future sessions, registrations and capacity management.
 */
const programSchema = new mongoose.Schema(
  {
    module: { type: String, enum: PROGRAM_MODULES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true },
    summary: { type: String, maxlength: 400 },
    format: { type: String, maxlength: 60 }, // e.g. "1:1 · 8 weeks"
    audience: { type: String, maxlength: 120 },
    highlights: [{ type: String, maxlength: 120 }],
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);
programSchema.index({ module: 1, active: 1, sortOrder: 1 });

const enquirySchema = new mongoose.Schema(
  {
    module: { type: String, enum: PROGRAM_MODULES, required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
    programTitle: String,
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true },
    mobile: { type: String, trim: true, maxlength: 20 },
    currentRole: { type: String, trim: true, maxlength: 100 },
    message: { type: String, trim: true, maxlength: 1500 },
    status: { type: String, enum: ENQUIRY_STATUSES, default: 'new' },
  },
  { timestamps: true }
);
enquirySchema.index({ module: 1, createdAt: -1 });

module.exports = {
  Program: mongoose.model('Program', programSchema),
  Enquiry: mongoose.model('Enquiry', enquirySchema),
};
