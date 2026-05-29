// payoutController — pro-side payout endpoints + the admin queue.

const asyncHandler = require('../utils/asyncHandler');
const {
  successResponse,
  paginatedResponse,
} = require('../utils/responseHandler');
const payoutService = require('../services/payoutService');

// GET /api/payouts/me/available
const getAvailable = asyncHandler(async (req, res) => {
  const amount = await payoutService.availableForPayout(req.user.id);
  return successResponse(res, 200, 'Available balance', {
    availableForPayout: amount,
    currency: 'INR',
  });
});

// GET /api/payouts/mine
const listMine = asyncHandler(async (req, res) => {
  const rows = await payoutService.listMine(req.user.id);
  return successResponse(res, 200, 'Payout requests', { items: rows });
});

// POST /api/payouts/mine
const createMine = asyncHandler(async (req, res) => {
  const request = await payoutService.createPayoutRequest(req.user, req.body || {});
  return successResponse(res, 201, 'Payout request submitted', request);
});

// --- Admin --------------------------------------------------------------

// GET /api/admin/payouts
const adminList = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await payoutService.adminList({
    status: req.query.status,
    page: req.query.page,
    limit: req.query.limit,
  });
  return paginatedResponse(res, 'Payout requests', items, {
    page,
    limit,
    total,
  });
});

// GET /api/admin/payouts/:id
const adminGet = asyncHandler(async (req, res) => {
  const row = await payoutService.adminGet(req.params.id);
  if (!row) throw { statusCode: 404, message: 'Payout request not found.' };
  return successResponse(res, 200, 'Payout request', row);
});

// POST /api/admin/payouts/:id/approve
const adminApprove = asyncHandler(async (req, res) => {
  const row = await payoutService.approve(
    req.params.id,
    req.user.id,
    req.body && req.body.reason
  );
  return successResponse(res, 200, 'Payout approved', row);
});

// POST /api/admin/payouts/:id/reject
const adminReject = asyncHandler(async (req, res) => {
  const row = await payoutService.reject(
    req.params.id,
    req.user.id,
    req.body && req.body.reason
  );
  return successResponse(res, 200, 'Payout rejected', row);
});

// POST /api/admin/payouts/:id/paid
const adminMarkPaid = asyncHandler(async (req, res) => {
  const row = await payoutService.markPaid(
    req.params.id,
    req.user.id,
    req.body && req.body.transferRef
  );
  return successResponse(res, 200, 'Payout marked paid', row);
});

module.exports = {
  getAvailable,
  listMine,
  createMine,
  adminList,
  adminGet,
  adminApprove,
  adminReject,
  adminMarkPaid,
};
