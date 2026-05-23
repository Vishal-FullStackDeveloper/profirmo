// In-app notifications controller for the Profirmo backend (Phase 6).
// All routes require an authenticated user; the caller only ever sees and
// mutates their own notifications.

const notificationService = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');
const {
  successResponse,
  paginatedResponse,
} = require('../utils/responseHandler');

// GET /api/notifications?page=&limit=
const list = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user.sub;
  const { rows, page, limit, total } = await notificationService.listForUser(
    userId,
    { page: req.query.page, limit: req.query.limit }
  );
  return paginatedResponse(res, 'Notifications fetched', rows, {
    page,
    limit,
    total,
  });
});

// GET /api/notifications/unread-count
const unreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user.sub;
  const count = await notificationService.unreadCount(userId);
  return successResponse(res, 200, 'Unread count fetched', { count });
});

// PATCH /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user.sub;
  const notification = await notificationService.markRead(
    req.params.id,
    userId
  );
  if (!notification) {
    throw { statusCode: 404, message: 'Notification not found' };
  }
  return successResponse(res, 200, 'Notification marked read', {
    notification,
  });
});

// PATCH /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user.sub;
  const updated = await notificationService.markAllRead(userId);
  return successResponse(res, 200, 'All notifications marked read', {
    updated,
  });
});

module.exports = { list, unreadCount, markRead, markAllRead };
