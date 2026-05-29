// payoutService — professional-initiated payout requests + admin approval.
//
// Flow:
//   1. Pro submits a request (amount + bank/UPI details). We lock the
//      matching escrow entries by flipping their status to "payout_requested"
//      so the same balance can't be requested twice.
//   2. Admin approves → escrow entries flip to "released" and a wallet
//      ledger row records the release.
//   3. Admin marks the payout paid → escrow flips to "withdrawn" and a
//      debit ledger row reflects the cash leaving the wallet.
//   4. Admin rejects → escrow rolls back to "ready_to_release".

const { Op } = require('sequelize');
const {
  sequelize,
  EscrowEntry,
  WalletTransaction,
  PayoutRequest,
  User,
} = require('../models');
const { logAudit } = require('../utils/auditLogger');
const notificationService = require('./notificationService');

const STATUSES = ['pending', 'approved', 'rejected', 'paid'];

/**
 * Sum the user's available-for-payout balance — escrow rows in the
 * ready_to_release bucket only (payout_requested and beyond are locked).
 */
async function availableForPayout(userId) {
  const total = await EscrowEntry.sum('netAmount', {
    where: { professionalUserId: userId, status: 'ready_to_release' },
  });
  return Number(total) || 0;
}

/**
 * Greedily allocate eligible escrow entries until they cover `amount`.
 * Returns the list of entries the request will lock. Throws if the user
 * doesn't have enough.
 */
async function allocateEscrowEntries(userId, amount, transaction) {
  const entries = await EscrowEntry.findAll({
    where: { professionalUserId: userId, status: 'ready_to_release' },
    order: [['createdAt', 'ASC']],
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
  const allocated = [];
  let remaining = amount;
  for (const e of entries) {
    if (remaining <= 0) break;
    allocated.push(e);
    remaining -= e.netAmount;
  }
  if (remaining > 0) {
    throw {
      statusCode: 400,
      message: 'Requested amount exceeds available balance.',
    };
  }
  return allocated;
}

/**
 * Create a payout request. amount is in paise. We over-allocate when the
 * matching escrow rows don't sum exactly to the requested amount — the
 * extra cents go back to ready_to_release on approval.
 */
async function createPayoutRequest(user, body = {}) {
  if (!user || !user.id) {
    throw { statusCode: 401, message: 'Authentication required.' };
  }
  const amount = Math.max(0, Math.floor(Number(body.amount) || 0));
  if (amount < 100) {
    throw { statusCode: 422, message: 'Minimum payout amount is ₹1.' };
  }
  const method = String(body.method || '').toLowerCase();
  if (!['bank', 'upi'].includes(method)) {
    throw { statusCode: 422, message: 'Payout method must be bank or upi.' };
  }
  if (method === 'bank') {
    if (!body.bankAccountNumber || !body.bankIfsc || !body.bankAccountName) {
      throw {
        statusCode: 422,
        message: 'Bank account name, number and IFSC are required.',
      };
    }
  } else if (!body.upiId) {
    throw { statusCode: 422, message: 'UPI id is required.' };
  }

  let request = null;
  await sequelize.transaction(async (t) => {
    const allocations = await allocateEscrowEntries(user.id, amount, t);
    request = await PayoutRequest.create(
      {
        professionalUserId: user.id,
        amount,
        method,
        bankAccountName: body.bankAccountName || null,
        bankAccountNumber: body.bankAccountNumber || null,
        bankIfsc: body.bankIfsc || null,
        upiId: body.upiId || null,
        notes: body.notes || null,
        status: 'pending',
      },
      { transaction: t }
    );
    for (const e of allocations) {
      await e.update(
        { status: 'payout_requested', payoutRequestId: request.id },
        { transaction: t }
      );
    }
    await WalletTransaction.create(
      {
        walletUserId: user.id,
        entryType: 'debit',
        category: 'payout_request',
        amount,
        payoutRequestId: request.id,
        escrowStatus: 'payout_requested',
        description: 'Payout request submitted — awaiting admin approval.',
      },
      { transaction: t }
    );
  });

  await logAudit({
    userId: user.id,
    action: 'payout.requested',
    entity: 'payout_request',
    entityId: request.id,
    status: 'success',
    metadata: { amount, method },
  });

  // Notify all platform admins so the queue gets seen quickly.
  try {
    const admins = await User.findAll({
      where: { role: 'platform_admin' },
      attributes: ['id'],
      raw: true,
    });
    for (const admin of admins) {
      await notificationService.createNotification({
        userId: admin.id,
        type: 'payout_requested',
        title: 'Payout request awaiting approval',
        message: `A professional has requested ₹${(amount / 100).toFixed(2)}.`,
        link: '/admin/payouts',
        metadata: { payoutRequestId: request.id },
      });
    }
  } catch (err) {
    console.warn(`[payoutService] admin notification failure: ${err.message}`);
  }

  return request.get({ plain: true });
}

async function listMine(userId) {
  return PayoutRequest.findAll({
    where: { professionalUserId: userId },
    order: [['createdAt', 'DESC']],
    raw: true,
  });
}

/**
 * Admin: list every payout request, newest first. Decorated with the
 * professional's display name.
 */
async function adminList({ status, page = 1, limit = 30 } = {}) {
  const where = {};
  if (status && STATUSES.includes(status)) where.status = status;
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Math.min(Number(limit) || 30, 100));
  const offset = (safePage - 1) * safeLimit;
  const { rows, count } = await PayoutRequest.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: safeLimit,
    offset,
    raw: true,
  });
  const userIds = [...new Set(rows.map((r) => r.professionalUserId))];
  const users = userIds.length
    ? await User.findAll({
        where: { id: { [Op.in]: userIds } },
        attributes: ['id', 'fullName', 'firstName', 'lastName', 'email'],
        raw: true,
      })
    : [];
  const byId = new Map(users.map((u) => [u.id, u]));
  const items = rows.map((r) => {
    const u = byId.get(r.professionalUserId);
    return {
      ...r,
      professionalName: u
        ? u.fullName ||
          [u.firstName, u.lastName].filter(Boolean).join(' ').trim() ||
          'Professional'
        : 'Professional',
      professionalEmail: u ? u.email : null,
    };
  });
  return { items, page: safePage, limit: safeLimit, total: count };
}

async function adminGet(id) {
  const row = await PayoutRequest.findByPk(id, { raw: true });
  if (!row) return null;
  const user = await User.findByPk(row.professionalUserId, { raw: true });
  return {
    ...row,
    professionalName: user
      ? user.fullName ||
        [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
        'Professional'
      : 'Professional',
    professionalEmail: user ? user.email : null,
  };
}

/**
 * Admin approves a payout request → flip locked escrow entries to
 * `released` and write the corresponding ledger row.
 */
async function approve(id, adminId, reason) {
  const request = await PayoutRequest.findByPk(id);
  if (!request) throw { statusCode: 404, message: 'Payout request not found.' };
  if (request.status !== 'pending') {
    throw { statusCode: 400, message: `Cannot approve a ${request.status} payout.` };
  }
  const now = new Date();
  await sequelize.transaction(async (t) => {
    await request.update(
      {
        status: 'approved',
        decidedByAdminId: adminId,
        decidedAt: now,
        decisionReason: reason || null,
      },
      { transaction: t }
    );
    await EscrowEntry.update(
      { status: 'released', releasedAt: now },
      { where: { payoutRequestId: request.id }, transaction: t }
    );
    await WalletTransaction.create(
      {
        walletUserId: request.professionalUserId,
        entryType: 'credit',
        category: 'payout_approved',
        amount: 0,
        payoutRequestId: request.id,
        escrowStatus: 'released',
        description: 'Payout request approved by admin.',
        metadata: { adminId },
      },
      { transaction: t }
    );
  });
  await logAudit({
    userId: adminId,
    action: 'payout.approved',
    entity: 'payout_request',
    entityId: request.id,
    status: 'success',
    metadata: { amount: request.amount },
  });
  try {
    await notificationService.createNotification({
      userId: request.professionalUserId,
      type: 'payout_approved',
      title: 'Payout approved',
      message: `Your payout of ₹${(request.amount / 100).toFixed(2)} was approved. Funds will be transferred shortly.`,
      link: '/dashboard/professional/payouts',
      metadata: { payoutRequestId: request.id },
    });
  } catch (err) {
    console.warn(`[payoutService] approve notify: ${err.message}`);
  }
  return (await PayoutRequest.findByPk(request.id)).get({ plain: true });
}

/**
 * Admin rejects a payout — roll the escrow lock back to ready_to_release.
 */
async function reject(id, adminId, reason) {
  const request = await PayoutRequest.findByPk(id);
  if (!request) throw { statusCode: 404, message: 'Payout request not found.' };
  if (request.status !== 'pending') {
    throw { statusCode: 400, message: `Cannot reject a ${request.status} payout.` };
  }
  if (!reason || !String(reason).trim()) {
    throw { statusCode: 422, message: 'Rejection reason is required.' };
  }
  await sequelize.transaction(async (t) => {
    await request.update(
      {
        status: 'rejected',
        decidedByAdminId: adminId,
        decidedAt: new Date(),
        decisionReason: String(reason).trim(),
      },
      { transaction: t }
    );
    await EscrowEntry.update(
      { status: 'ready_to_release', payoutRequestId: null },
      { where: { payoutRequestId: request.id }, transaction: t }
    );
    await WalletTransaction.create(
      {
        walletUserId: request.professionalUserId,
        entryType: 'credit',
        category: 'payout_rejected',
        amount: 0,
        payoutRequestId: request.id,
        escrowStatus: 'ready_to_release',
        description: `Payout rejected: ${String(reason).trim()}`,
        metadata: { adminId },
      },
      { transaction: t }
    );
  });
  await logAudit({
    userId: adminId,
    action: 'payout.rejected',
    entity: 'payout_request',
    entityId: request.id,
    status: 'success',
    metadata: { reason },
  });
  try {
    await notificationService.createNotification({
      userId: request.professionalUserId,
      type: 'payout_rejected',
      title: 'Payout not approved',
      message: `Your payout request was not approved. Reason: ${String(reason).trim()}.`,
      link: '/dashboard/professional/payouts',
      metadata: { payoutRequestId: request.id },
    });
  } catch (err) {
    console.warn(`[payoutService] reject notify: ${err.message}`);
  }
  return (await PayoutRequest.findByPk(request.id)).get({ plain: true });
}

/**
 * Admin records that the external transfer (NEFT / UPI) has been completed.
 * Flips escrow rows to `withdrawn`, writes a debit ledger row.
 */
async function markPaid(id, adminId, transferRef) {
  const request = await PayoutRequest.findByPk(id);
  if (!request) throw { statusCode: 404, message: 'Payout request not found.' };
  if (request.status !== 'approved') {
    throw {
      statusCode: 400,
      message: `Only approved payouts can be marked paid (current: ${request.status}).`,
    };
  }
  if (!transferRef || !String(transferRef).trim()) {
    throw { statusCode: 422, message: 'Transfer reference is required.' };
  }
  const now = new Date();
  await sequelize.transaction(async (t) => {
    await request.update(
      {
        status: 'paid',
        transferRef: String(transferRef).trim(),
        paidAt: now,
      },
      { transaction: t }
    );
    await EscrowEntry.update(
      { status: 'withdrawn', withdrawnAt: now },
      { where: { payoutRequestId: request.id }, transaction: t }
    );
    await WalletTransaction.create(
      {
        walletUserId: request.professionalUserId,
        entryType: 'debit',
        category: 'payout_paid',
        amount: request.amount,
        payoutRequestId: request.id,
        escrowStatus: 'withdrawn',
        description: `Payout paid (ref: ${String(transferRef).trim()})`,
        metadata: { adminId },
      },
      { transaction: t }
    );
  });
  await logAudit({
    userId: adminId,
    action: 'payout.paid',
    entity: 'payout_request',
    entityId: request.id,
    status: 'success',
    metadata: { transferRef, amount: request.amount },
  });
  try {
    await notificationService.createNotification({
      userId: request.professionalUserId,
      type: 'payout_paid',
      title: 'Funds transferred',
      message: `₹${(request.amount / 100).toFixed(2)} has been transferred. Reference: ${transferRef}.`,
      link: '/dashboard/professional/payouts',
      metadata: { payoutRequestId: request.id, transferRef },
    });
  } catch (err) {
    console.warn(`[payoutService] paid notify: ${err.message}`);
  }
  return (await PayoutRequest.findByPk(request.id)).get({ plain: true });
}

module.exports = {
  STATUSES,
  availableForPayout,
  createPayoutRequest,
  listMine,
  adminList,
  adminGet,
  approve,
  reject,
  markPaid,
};
