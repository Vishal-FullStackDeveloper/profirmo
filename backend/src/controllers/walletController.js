// walletController — read-only wallet endpoints for the calling pro.

const asyncHandler = require('../utils/asyncHandler');
const {
  successResponse,
  paginatedResponse,
} = require('../utils/responseHandler');
const walletService = require('../services/walletService');

// GET /api/wallet/summary
const getSummary = asyncHandler(async (req, res) => {
  const summary = await walletService.getSummary(req.user.id);
  return successResponse(res, 200, 'Wallet summary', summary);
});

// GET /api/wallet/transactions?page=&limit=
const listTransactions = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await walletService.listTransactions(
    req.user.id,
    { page: req.query.page, limit: req.query.limit }
  );
  return paginatedResponse(res, 'Wallet transactions', items, {
    page,
    limit,
    total,
  });
});

module.exports = { getSummary, listTransactions };
