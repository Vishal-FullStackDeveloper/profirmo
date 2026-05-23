const express = require('express');
const invitationController = require('../controllers/invitationController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Every invitation route requires an authenticated user. The service scopes
// all reads / writes to the caller (by invitedUserId or matching email).
router.use(authenticate);

// GET /api/invitations/mine — the caller's received PENDING invitations.
router.get('/mine', invitationController.listMine);

// POST /api/invitations/:id/accept — accept an invitation.
router.post('/:id/accept', invitationController.accept);

// POST /api/invitations/:id/reject — reject an invitation.
router.post('/:id/reject', invitationController.reject);

module.exports = router;
