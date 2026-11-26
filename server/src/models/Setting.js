const mongoose = require('mongoose');

/** Singleton document holding application-wide configuration */
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    applications: {
      accepting: { type: Boolean, default: true },
      // Same email/mobile cannot apply to the same role again within this window
      duplicateWindowDays: { type: Number, default: 30, min: 0, max: 365 },
    },
    referral: {
      enabled: { type: Boolean, default: true },
      pointsOnApplication: { type: Number, default: 10, min: 0, max: 10000 },
      pointsOnShortlist: { type: Number, default: 25, min: 0, max: 10000 },
      pointsOnHire: { type: Number, default: 100, min: 0, max: 10000 },
      maxReferralsPerDay: { type: Number, default: 10, min: 1, max: 1000 },
    },
    site: {
      contactEmail: { type: String, default: 'ravi@theivar.in' },
      contactPhone: { type: String, default: '+91 73959 66333' },
      address: { type: String, default: '9/6 Mahadevan Street, West Mambalam, Chennai – 600033' },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

settingSchema.statics.get = async function getSettings() {
  return this.findOneAndUpdate({ key: 'global' }, { $setOnInsert: { key: 'global' } }, { upsert: true, new: true });
};

module.exports = mongoose.model('Setting', settingSchema);
