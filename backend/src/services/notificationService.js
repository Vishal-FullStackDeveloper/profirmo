// In-app notifications service for the Profirmo backend (Phase 6).
//
// Notifications are simple per-user records surfaced by the
// /api/notifications endpoints. They are created directly (e.g. a welcome
// notification on email verification) or via the 'notification' job handler.

const { Notification } = require('../models');

/**
 * Create a notification for a user.
 *
 * @param {object} opts
 * @param {string}  opts.userId   - recipient user id
 * @param {string}  opts.type     - logical category, e.g. 'welcome'
 * @param {string}  opts.title    - short headline
 * @param {string}  opts.message  - body text
 * @param {string} [opts.link]    - optional in-app link
 * @param {object} [opts.metadata]- optional free-form JSON context
 * @returns {Promise<object>} the created Notification row
 */
async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  metadata,
}) {
  if (!userId) throw new Error('createNotification: userId is required');
  return Notification.create({
    userId,
    type: type || 'system',
    title: title || 'Notification',
    message: message || '',
    link: link || null,
    metadata: metadata || null,
    isRead: false,
  });
}

/**
 * List a user's notifications, newest first, paginated.
 *
 * @param {string} userId
 * @param {object} [opts] - { page, limit }
 * @returns {Promise<{ rows, page, limit, total }>}
 */
async function listForUser(userId, { page = 1, limit = 20 } = {}) {
  const safePage = Number(page) > 0 ? Math.floor(Number(page)) : 1;
  const safeLimit =
    Number(limit) > 0 ? Math.min(Math.floor(Number(limit)), 100) : 20;
  const { rows, count } = await Notification.findAndCountAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  });
  return { rows, page: safePage, limit: safeLimit, total: count };
}

/**
 * Count a user's unread notifications.
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function unreadCount(userId) {
  return Notification.count({ where: { userId, isRead: false } });
}

/**
 * Mark a single notification read (owner-scoped).
 * @param {string} id - notification id
 * @param {string} userId - caller id (must own the notification)
 * @returns {Promise<object|null>} the updated row, or null if not found
 */
async function markRead(id, userId) {
  const notification = await Notification.findOne({ where: { id, userId } });
  if (!notification) return null;
  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }
  return notification;
}

/**
 * Mark every one of a user's notifications read.
 * @param {string} userId
 * @returns {Promise<number>} number of rows updated
 */
async function markAllRead(userId) {
  const [affected] = await Notification.update(
    { isRead: true, readAt: new Date() },
    { where: { userId, isRead: false } }
  );
  return affected;
}

module.exports = {
  createNotification,
  listForUser,
  unreadCount,
  markRead,
  markAllRead,
};
