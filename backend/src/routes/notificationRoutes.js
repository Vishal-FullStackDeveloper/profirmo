const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Every notification route requires an authenticated user. The controller
// scopes all reads/writes to req.user, so a caller only ever touches their
// own notifications.
router.use(authenticate);

// GET /api/notifications — paginated list, newest first.
router.get('/', notificationController.list);

// GET /api/notifications/unread-count — { data: { count } }.
router.get('/unread-count', notificationController.unreadCount);

// PATCH /api/notifications/read-all — mark all the caller's notifications read.
// Declared before the :id route so 'read-all' is not captured as an id.
router.patch('/read-all', notificationController.markAllRead);

// PATCH /api/notifications/:id/read — mark one read (owner-only).
router.patch('/:id/read', notificationController.markRead);

module.exports = router;
