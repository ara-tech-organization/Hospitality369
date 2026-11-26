const mongoose = require('mongoose');
const { INDUSTRIES } = require('../constants');

/**
 * A recruitment role candidates can apply for (e.g. "Chef").
 * `positions` are the levels offered for that role (e.g. "Commis Chef", "Chef de Partie").
 * Roles are never hard-coded – they are managed from the dashboard.
 */
const jobRoleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    industry: { type: String, enum: INDUSTRIES, required: true },
    description: { type: String, trim: true, maxlength: 600, default: '' },
    positions: [{ type: String, trim: true, maxlength: 80 }],
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

jobRoleSchema.index({ title: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
jobRoleSchema.index({ active: 1, sortOrder: 1 });

module.exports = mongoose.model('JobRole', jobRoleSchema);
