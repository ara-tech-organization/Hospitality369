const AuditLog = require('../models/AuditLog');
const realtime = require('../realtime');
const { clientIp } = require('../utils/helpers');

/**
 * Which dashboard data each audited action changes – used to push live updates.
 * (Read-only actions such as views, exports and sign-ins only refresh the audit log.)
 */
function scopesFor(action) {
  if (action === 'application.status_changed' || action === 'application.deleted') return ['applications'];
  if (action.startsWith('role.')) return ['roles'];
  if (action.startsWith('enquiry.')) return ['enquiries'];
  return [];
}

/**
 * Record an administrative action. Never throws – auditing must not break the request.
 * Also broadcasts the change to connected dashboards.
 */
async function audit(req, action, { entity, entityId, summary, metadata } = {}) {
  try {
    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.name,
      actorEmail: req.user?.email,
      action,
      entity,
      entityId: entityId ? String(entityId) : undefined,
      summary,
      metadata,
      ip: clientIp(req),
      userAgent: String(req.get('user-agent') || '').slice(0, 300),
    });
  } catch (err) {
    console.error('[audit] failed to write audit log', err.message);
  }

  try {
    const scopes = scopesFor(action);
    if (scopes.length) realtime.changed(scopes);
    if (action.startsWith('admin.')) realtime.changedForSuperAdmins(['admins']);
    if (action === 'settings.updated') realtime.changedForSuperAdmins(['settings']);
    realtime.changedForSuperAdmins(['audit']);
    // permissions / password / status changed → make that admin's live connection re-check access
    if (['admin.updated', 'admin.password_reset', 'admin.deleted'].includes(action) && entityId) realtime.refreshUser(entityId);
  } catch (err) {
    console.error('[realtime] broadcast failed', err.message);
  }
}

module.exports = { audit };
