// Audit-logging utility for the Profirmo backend (Phase 5).
//
// Inserts a row into the audit_logs table for security-relevant events.
// CRITICAL: an audit-logging failure must NEVER break or throw into the
// request that triggered it — the entire insert is wrapped in try/catch and
// errors are only logged to the console.

const { AuditLog } = require('../models');

/**
 * Derive the client IP address from a request, preferring the first hop in
 * the X-Forwarded-For chain (set by proxies) and falling back to req.ip.
 * @param {object} req - Express request
 * @returns {string|null}
 */
const deriveIp = (req) => {
  if (!req) return null;
  const forwarded = req.headers && req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = String(forwarded).split(',')[0].trim();
    if (first) return first;
  }
  return (
    req.ip ||
    (req.connection && req.connection.remoteAddress) ||
    null
  );
};

/**
 * Derive the client User-Agent from a request.
 * @param {object} req - Express request
 * @returns {string|null}
 */
const deriveUserAgent = (req) => {
  if (!req || !req.headers) return null;
  return req.headers['user-agent'] || null;
};

/**
 * Insert an audit-log row. Never throws.
 *
 * @param {object} opts
 * @param {object} [opts.req]      - Express request (for ip / userAgent)
 * @param {string} [opts.userId]   - acting user id (nullable)
 * @param {string}  opts.action    - event name, e.g. 'auth.login'
 * @param {string} [opts.entity]   - affected entity type
 * @param {string} [opts.entityId] - affected entity id
 * @param {string} [opts.status]   - 'success' | 'failure' (default 'success')
 * @param {object} [opts.metadata] - free-form JSON context
 * @returns {Promise<void>}
 */
async function logAudit({
  req,
  userId,
  action,
  entity,
  entityId,
  status = 'success',
  metadata,
} = {}) {
  try {
    await AuditLog.create({
      userId: userId || null,
      action,
      entity: entity || null,
      entityId: entityId || null,
      status: status || 'success',
      ipAddress: deriveIp(req),
      userAgent: deriveUserAgent(req),
      metadata: metadata || null,
    });
  } catch (err) {
    // An audit-logging failure must never affect the request.
    console.error('[AUDIT] Failed to write audit log:', err.message || err);
  }
}

module.exports = { logAudit };
