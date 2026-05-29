// adminPaymentsController — read-side list of every Payment + escrow status
// joined for the admin dashboard, plus the refund action.

const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const {
  successResponse,
  paginatedResponse,
} = require('../utils/responseHandler');
const { Payment, EscrowEntry, User, Booking } = require('../models');
const paymentsService = require('../services/paymentsService');

// GET /api/admin/payments?status=&escrowStatus=&search=&page=&limit=
const list = asyncHandler(async (req, res) => {
  const safePage = Math.max(1, Number(req.query.page) || 1);
  const safeLimit = Math.max(1, Math.min(Number(req.query.limit) || 30, 100));
  const offset = (safePage - 1) * safeLimit;

  const where = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.search) {
    const q = `%${String(req.query.search).trim()}%`;
    where[Op.or] = [
      { razorpayOrderId: { [Op.like]: q } },
      { razorpayPaymentId: { [Op.like]: q } },
      { bookingId: { [Op.like]: q } },
    ];
  }

  const { rows, count } = await Payment.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: safeLimit,
    offset,
    raw: true,
  });

  // Decorate with escrow + payer + payee names so the table stands alone.
  const paymentIds = rows.map((r) => r.id);
  const escrows = paymentIds.length
    ? await EscrowEntry.findAll({
        where: { paymentId: { [Op.in]: paymentIds } },
        raw: true,
      })
    : [];
  const escrowByPaymentId = new Map(escrows.map((e) => [e.paymentId, e]));

  const userIds = [
    ...new Set([
      ...rows.map((r) => r.userId).filter(Boolean),
      ...rows.map((r) => r.professionalUserId).filter(Boolean),
    ]),
  ];
  const users = userIds.length
    ? await User.findAll({
        where: { id: { [Op.in]: userIds } },
        attributes: ['id', 'fullName', 'firstName', 'lastName', 'email'],
        raw: true,
      })
    : [];
  const displayName = (u) =>
    u
      ? u.fullName ||
        [u.firstName, u.lastName].filter(Boolean).join(' ').trim() ||
        u.email ||
        ''
      : '';
  const userById = new Map(users.map((u) => [u.id, u]));

  const bookingIds = [...new Set(rows.map((r) => r.bookingId).filter(Boolean))];
  const bookings = bookingIds.length
    ? await Booking.findAll({
        where: { id: { [Op.in]: bookingIds } },
        attributes: ['id', 'date', 'time', 'status'],
        raw: true,
      })
    : [];
  const bookingById = new Map(bookings.map((b) => [b.id, b]));

  let items = rows.map((r) => {
    const escrow = escrowByPaymentId.get(r.id) || null;
    const booking = r.bookingId ? bookingById.get(r.bookingId) : null;
    return {
      ...r,
      payerName: displayName(userById.get(r.userId)),
      payerEmail: (userById.get(r.userId) || {}).email || null,
      professionalName: displayName(userById.get(r.professionalUserId)),
      professionalEmail: (userById.get(r.professionalUserId) || {}).email || null,
      escrowStatus: escrow ? escrow.status : null,
      escrowId: escrow ? escrow.id : null,
      booking,
    };
  });

  if (req.query.escrowStatus) {
    items = items.filter((r) => r.escrowStatus === req.query.escrowStatus);
  }

  return paginatedResponse(res, 'Payments fetched', items, {
    page: safePage,
    limit: safeLimit,
    total: count,
  });
});

// POST /api/admin/payments/:id/refund  body: { amount?, reason }
const refund = asyncHandler(async (req, res) => {
  const result = await paymentsService.refundPayment(req.params.id, {
    amount: req.body && req.body.amount,
    reason: req.body && req.body.reason,
    adminId: req.user.id,
  });
  return successResponse(res, 200, 'Payment refunded', result);
});

module.exports = { list, refund };
