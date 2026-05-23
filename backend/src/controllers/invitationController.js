// Invitee-side firm-invitation controller for the Profirmo backend (Phase 8).
// All routes require an authenticated user; the service scopes every read /
// write to the caller (by invitedUserId or matching email).

const invitationService = require('../services/invitationService');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/responseHandler');

// GET /api/invitations/mine — the caller's received PENDING invitations.
const listMine = asyncHandler(async (req, res) => {
  const invitations = await invitationService.listMyInvitations(req.user.id);
  return successResponse(res, 200, 'Invitations fetched', { invitations });
});

// POST /api/invitations/:id/accept — accept an invitation.
const accept = asyncHandler(async (req, res) => {
  const result = await invitationService.acceptInvitation(
    req.user.id,
    req.params.id
  );
  return successResponse(res, 200, 'Invitation accepted', result);
});

// POST /api/invitations/:id/reject — reject an invitation.
const reject = asyncHandler(async (req, res) => {
  const invitation = await invitationService.rejectInvitation(
    req.user.id,
    req.params.id
  );
  return successResponse(res, 200, 'Invitation rejected', { invitation });
});

module.exports = { listMine, accept, reject };
