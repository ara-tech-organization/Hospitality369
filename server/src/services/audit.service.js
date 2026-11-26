const AuditLog = require('../models/AuditLog');
const { clientIp } = require('../utils/helpers');

/**
 * Record an administrative action. Never throws – auditing must not break the request.
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
}

module.exports = { audit };
