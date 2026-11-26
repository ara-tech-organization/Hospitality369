const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES, ALL_PERMISSIONS } = require('../constants');

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(USER_ROLES), default: USER_ROLES.ADMIN },
    permissions: [{ type: String, enum: ALL_PERMISSIONS }],
    active: { type: Boolean, default: true },
    // Incremented on logout / password change / revocation to invalidate issued JWTs
    tokenVersion: { type: Number, default: 0, select: false },
    failedLogins: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
    lastLoginAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.isLocked = function isLocked() {
  return Boolean(this.lockUntil && this.lockUntil > new Date());
};

userSchema.methods.registerFailedLogin = async function registerFailedLogin() {
  this.failedLogins = (this.failedLogins || 0) + 1;
  if (this.failedLogins >= MAX_FAILED_LOGINS) {
    this.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
    this.failedLogins = 0;
  }
  await this.save({ validateModifiedOnly: true });
};

userSchema.methods.isSuperAdmin = function isSuperAdmin() {
  return this.role === USER_ROLES.SUPER_ADMIN;
};

/** Effective permissions: super admins hold all of them */
userSchema.methods.effectivePermissions = function effectivePermissions() {
  return this.isSuperAdmin() ? [...ALL_PERMISSIONS] : [...new Set(this.permissions || [])];
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    permissions: this.effectivePermissions(),
    active: this.active,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
