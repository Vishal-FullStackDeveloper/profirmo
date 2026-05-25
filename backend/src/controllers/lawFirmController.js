const lawFirmService = require('../services/lawFirmService');
const invitationService = require('../services/invitationService');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/responseHandler');

// GET /api/law-firm/mine — the caller's firm + members + role + approval.
const getMyFirm = asyncHandler(async (req, res) => {
  const result = await lawFirmService.getMyFirm(req.user.id);
  return successResponse(res, 200, 'Law firm fetched', result);
});

// POST /api/law-firm — create the caller's firm (gated on approved pro).
const createFirm = asyncHandler(async (req, res) => {
  const result = await lawFirmService.createFirm(req.user, req.body);
  return successResponse(res, 201, 'Law firm submitted for approval', result);
});

// PUT /api/law-firm/mine — update the caller's firm (owner only).
const updateFirm = asyncHandler(async (req, res) => {
  const result = await lawFirmService.updateFirm(req.user.id, req.body);
  return successResponse(res, 200, 'Law firm updated', result);
});

// GET /api/law-firm/mine/members — list firm members.
const getMembers = asyncHandler(async (req, res) => {
  const members = await lawFirmService.getMembers(req.user.id);
  return successResponse(res, 200, 'Firm members fetched', { members });
});

// GET /api/law-firm/mine/clients — aggregated clients of every firm member.
const getFirmClients = asyncHandler(async (req, res) => {
  const result = await lawFirmService.getFirmClients(req.user.id);
  return successResponse(res, 200, 'Firm clients fetched', result);
});

// POST /api/law-firm/mine/members — DEPRECATED: superseded by invitations.
const addMember = asyncHandler(async (req, res) => {
  throw {
    statusCode: 410,
    message:
      'Adding members directly is no longer supported. Use firm invitations: POST /api/law-firm/mine/invitations',
  };
});

// PATCH /api/law-firm/mine/members/:memberId/role — owner only.
const changeMemberRole = asyncHandler(async (req, res) => {
  const member = await lawFirmService.changeMemberRole(
    req.user.id,
    req.params.memberId,
    req.body
  );
  return successResponse(res, 200, 'Member role updated', { member });
});

// DELETE /api/law-firm/mine/members/:memberId — owner or co-owner.
const removeMember = asyncHandler(async (req, res) => {
  const result = await lawFirmService.removeMember(
    req.user.id,
    req.params.memberId
  );
  return successResponse(res, 200, 'Firm member removed', result);
});

// GET /api/law-firm/search-professionals?q= — search approved professionals.
const searchProfessionals = asyncHandler(async (req, res) => {
  const results = await lawFirmService.searchProfessionals(
    req.user.id,
    req.query.q
  );
  return successResponse(res, 200, 'Professionals fetched', { results });
});

// --- Firm-side invitation endpoints ---------------------------------------

// POST /api/law-firm/mine/invitations — owner / co-owner.
const createInvitation = asyncHandler(async (req, res) => {
  const invitation = await invitationService.createInvitation(
    req.user.id,
    req.body
  );
  return successResponse(res, 201, 'Invitation sent', { invitation });
});

// GET /api/law-firm/mine/invitations — list the firm's invitations.
const listFirmInvitations = asyncHandler(async (req, res) => {
  const invitations = await invitationService.listFirmInvitations(
    req.user.id
  );
  return successResponse(res, 200, 'Firm invitations fetched', {
    invitations,
  });
});

// DELETE /api/law-firm/mine/invitations/:id — owner / co-owner cancel.
const cancelInvitation = asyncHandler(async (req, res) => {
  const invitation = await invitationService.cancelInvitation(
    req.user.id,
    req.params.id
  );
  return successResponse(res, 200, 'Invitation cancelled', { invitation });
});

module.exports = {
  getMyFirm,
  createFirm,
  updateFirm,
  getMembers,
  getFirmClients,
  addMember,
  changeMemberRole,
  removeMember,
  searchProfessionals,
  createInvitation,
  listFirmInvitations,
  cancelInvitation,
};
