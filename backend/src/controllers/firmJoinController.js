const firmJoinService = require('../services/firmJoinService');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/responseHandler');

// GET /api/firm-join/membership
const getMyMembership = asyncHandler(async (req, res) => {
  const data = await firmJoinService.getMyMembership(req.user.id);
  return successResponse(res, 200, 'Membership fetched', data);
});

// GET /api/firm-join/joinable
const listJoinable = asyncHandler(async (req, res) => {
  const data = await firmJoinService.listJoinableFirms(req.user.id);
  return successResponse(res, 200, 'Joinable firms fetched', data);
});

// POST /api/firm-join/requests
const requestJoin = asyncHandler(async (req, res) => {
  const data = await firmJoinService.requestJoin(
    req.user.id,
    req.body.firmId,
    req.body.message
  );
  return successResponse(res, 201, 'Join request sent', data);
});

// GET /api/firm-join/requests/mine
const listMyRequests = asyncHandler(async (req, res) => {
  const data = await firmJoinService.listMyRequests(req.user.id);
  return successResponse(res, 200, 'Your join requests fetched', data);
});

// POST /api/firm-join/requests/:id/cancel
const cancelRequest = asyncHandler(async (req, res) => {
  const data = await firmJoinService.cancelRequest(
    req.user.id,
    req.params.id
  );
  return successResponse(res, 200, 'Join request cancelled', data);
});

// GET /api/firm-join/requests/firm
const listFirmRequests = asyncHandler(async (req, res) => {
  const data = await firmJoinService.listFirmRequests(req.user.id);
  return successResponse(res, 200, 'Firm join requests fetched', data);
});

// POST /api/firm-join/requests/:id/decide
const decideRequest = asyncHandler(async (req, res) => {
  const data = await firmJoinService.decideRequest(
    req.user.id,
    req.params.id,
    req.body.decision
  );
  return successResponse(res, 200, 'Join request updated', data);
});

// POST /api/firm-join/leave
const leaveFirm = asyncHandler(async (req, res) => {
  const data = await firmJoinService.leaveFirm(req.user.id);
  return successResponse(res, 200, 'You have left the firm', data);
});

module.exports = {
  getMyMembership,
  listJoinable,
  requestJoin,
  listMyRequests,
  cancelRequest,
  listFirmRequests,
  decideRequest,
  leaveFirm,
};
