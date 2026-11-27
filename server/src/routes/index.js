const express = require('express');
const env = require('../config/env');
const validate = require('../middleware/validate');
const { authenticate, optionalAuth, requirePermission, requireAnyPermission, requireSuperAdmin } = require('../middleware/auth');
const { handleResumeUpload } = require('../middleware/upload');
const { loginLimiter, applyLimiter, publicFormLimiter } = require('../middleware/rateLimit');
const { PERMISSIONS: P } = require('../constants');

const auth = require('../controllers/auth.controller');
const pub = require('../controllers/public.controller');
const apps = require('../controllers/applications.controller');
const dashboard = require('../controllers/dashboard.controller');
const roles = require('../controllers/roles.controller');
const admins = require('../controllers/admins.controller');
const referrals = require('../controllers/referrals.controller');
const system = require('../controllers/system.controller');

const router = express.Router();

router.get('/health', (_req, res) => res.json({ success: true, status: 'ok', time: new Date().toISOString() }));

/* ------------------------------- Public ------------------------------- */
router.get('/public/config', pub.config);
router.get('/public/roles', pub.listRoles);
router.post('/public/applications', applyLimiter, handleResumeUpload, validate(pub.schemas.application), pub.submitApplication);
if (env.features.referrals) {
  router.post('/public/referrals/join', publicFormLimiter, validate(pub.schemas.join), pub.joinReferral);
  router.post('/public/referrals/lookup', publicFormLimiter, validate(pub.schemas.lookup), pub.lookupReferral);
  router.get('/public/referrals/leaderboard', pub.leaderboard);
  router.get('/public/referrals/validate/:code', pub.validateReferralCode);
}
router.get('/public/programs', pub.listPrograms);
router.post('/public/enquiries', publicFormLimiter, validate(pub.schemas.enquiry), pub.submitEnquiry);
router.post('/public/contact', publicFormLimiter, validate(pub.schemas.contact), pub.submitContact);

/* -------------------------------- Auth -------------------------------- */
router.post('/auth/login', loginLimiter, validate(auth.schemas.login), auth.login);
router.post('/auth/logout', authenticate, auth.logout);
router.get('/auth/me', authenticate, auth.me);
router.get('/auth/session', optionalAuth, auth.session);
router.post('/auth/change-password', authenticate, validate(auth.schemas.changePassword), auth.changePassword);

/* ------------------------------ Dashboard ----------------------------- */
const secured = express.Router();
secured.use(authenticate);

secured.get('/dashboard/overview', requirePermission(P.ANALYTICS_VIEW), dashboard.overview);

// Candidate applications
secured.get('/applications', requirePermission(P.CANDIDATES_VIEW), validate(apps.schemas.listQuery, 'query'), apps.list);
secured.get('/applications/export', requirePermission(P.CANDIDATES_EXPORT), validate(apps.schemas.listQuery, 'query'), apps.exportExcel);
secured.get('/applications/export.pdf', requirePermission(P.CANDIDATES_EXPORT), validate(apps.schemas.listQuery, 'query'), apps.exportPdf);
secured.get('/applications/:id', requirePermission(P.CANDIDATES_VIEW), apps.getOne);
secured.get('/applications/:id/resume', requirePermission(P.RESUMES_DOWNLOAD), apps.downloadResume);
secured.patch('/applications/:id/status', requirePermission(P.CANDIDATES_UPDATE_STATUS), validate(apps.schemas.status), apps.updateStatus);
secured.delete('/applications/:id', requireSuperAdmin, apps.remove);

// Recruitment roles
secured.get('/roles/options', requireAnyPermission(P.CANDIDATES_VIEW, P.ROLES_MANAGE, P.CANDIDATES_EXPORT, P.ANALYTICS_VIEW), roles.options);
secured.get('/roles', requirePermission(P.ROLES_MANAGE), roles.list);
secured.post('/roles', requirePermission(P.ROLES_MANAGE), validate(roles.schemas.create), roles.create);
secured.patch('/roles/:id', requirePermission(P.ROLES_MANAGE), validate(roles.schemas.update), roles.update);
secured.patch('/roles/:id/status', requirePermission(P.ROLES_MANAGE), validate(roles.schemas.toggle), roles.toggle);
secured.delete('/roles/:id', requirePermission(P.ROLES_MANAGE), roles.remove);

// Referral management (disabled unless FEATURE_REFERRALS=true)
if (env.features.referrals) {
  secured.get('/referrals/summary', requirePermission(P.REFERRALS_MANAGE), referrals.summary);
  secured.get('/referrals/referrers', requirePermission(P.REFERRALS_MANAGE), referrals.listReferrers);
  secured.get('/referrals/referrers/:id', requirePermission(P.REFERRALS_MANAGE), referrals.getReferrer);
  secured.post('/referrals/referrers/:id/adjust', requirePermission(P.REFERRALS_MANAGE), validate(referrals.schemas.adjust), referrals.adjustPoints);
  secured.patch('/referrals/referrers/:id/status', requirePermission(P.REFERRALS_MANAGE), validate(referrals.schemas.toggle), referrals.toggleReferrer);
  secured.get('/referrals', requirePermission(P.REFERRALS_MANAGE), referrals.listReferrals);
  secured.post('/referrals/:id/reject', requirePermission(P.REFERRALS_MANAGE), referrals.rejectReferral);
}

// Programme enquiries
secured.get('/enquiries', requirePermission(P.ENQUIRIES_VIEW), system.listEnquiries);
secured.patch('/enquiries/:id/status', requirePermission(P.ENQUIRIES_VIEW), validate(system.schemas.enquiryStatus), system.updateEnquiry);

// Super Admin only
secured.get('/admins', requireSuperAdmin, admins.list);
secured.post('/admins', requireSuperAdmin, validate(admins.schemas.create), admins.create);
secured.patch('/admins/:id', requireSuperAdmin, validate(admins.schemas.update), admins.update);
secured.post('/admins/:id/reset-password', requireSuperAdmin, validate(admins.schemas.resetPassword), admins.resetPassword);
secured.delete('/admins/:id', requireSuperAdmin, admins.remove);
secured.get('/settings', requireSuperAdmin, system.getSettings);
secured.put('/settings', requireSuperAdmin, validate(system.schemas.settings), system.updateSettings);
secured.get('/audit-logs', requireSuperAdmin, system.auditLogs);

router.use(secured);

module.exports = router;
