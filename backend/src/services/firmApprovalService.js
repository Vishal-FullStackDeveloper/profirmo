// Firm approval-workflow service for the Profirmo backend (Phase 8).
//
// Admin-facing operations for reviewing law-firm registrations: listing
// pending firms, fetching the full review payload, and the approve / reject /
// request-modifications actions. Multi-row writes use a transaction.

const { Op } = require('sequelize');
const {
  sequelize,
  User,
  LawFirm,
  FirmApproval,
} = require('../models');
const { enqueue } = require('./queueService');
const notificationService = require('./notificationService');
const env = require('../config/env');

// Convert a Sequelize instance (or null) to a plain object (or null).
const plain = (record) =>
  record && typeof record.get === 'function'
    ? record.get({ plain: true })
    : record || null;

// Public view of a user (name / email only) for review listings.
const ownerView = (user) => {
  const u = plain(user);
  if (!u) return null;
  return {
    id: u.id,
    fullName: u.fullName || u.name || null,
    firstName: u.firstName || null,
    lastName: u.lastName || null,
    email: u.email || null,
    mobileNumber: u.mobileNumber || null,
  };
};

/**
 * List firm applications awaiting review (PENDING_APPROVAL or
 * MODIFICATIONS_REQUESTED), newest first, paginated.
 * @param {object} [opts] - { page, limit }
 * @returns {Promise<{ rows, page, limit, total }>}
 */
async function listPending({ page = 1, limit = 20 } = {}) {
  const safePage = Number(page) > 0 ? Math.floor(Number(page)) : 1;
  const safeLimit =
    Number(limit) > 0 ? Math.min(Math.floor(Number(limit)), 100) : 20;

  const { rows, count } = await FirmApproval.findAndCountAll({
    where: {
      status: { [Op.in]: ['PENDING_APPROVAL', 'MODIFICATIONS_REQUESTED'] },
    },
    order: [['submittedAt', 'DESC']],
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  });

  const items = [];
  for (const approval of rows) {
    const a = plain(approval);
    const firm = await LawFirm.findByPk(a.firmId);
    const owner = firm ? await User.findByPk(firm.ownerUserId) : null;
    items.push({
      id: a.id,
      firmId: a.firmId,
      status: a.status,
      submittedAt: a.submittedAt,
      reviewedAt: a.reviewedAt,
      resubmissionCount: a.resubmissionCount,
      firmName: firm ? firm.firmName : null,
      owner: ownerView(owner),
    });
  }

  return { rows: items, page: safePage, limit: safeLimit, total: count };
}

/**
 * Fetch the full review payload for one firm application: the FirmApproval,
 * the LawFirm (all fields incl. document URLs) and the owner user.
 * @param {string} approvalId
 * @returns {Promise<object>}
 */
async function getReviewPayload(approvalId) {
  const approval = await FirmApproval.findByPk(approvalId);
  if (!approval) {
    throw { statusCode: 404, message: 'Firm application not found' };
  }
  const firm = await LawFirm.findByPk(approval.firmId);
  const owner = firm ? await User.findByPk(firm.ownerUserId) : null;

  return {
    approval: plain(approval),
    lawFirm: plain(firm),
    owner: ownerView(owner),
  };
}

// Load a firm approval, throwing 404 if missing.
async function loadApproval(approvalId) {
  const approval = await FirmApproval.findByPk(approvalId);
  if (!approval) {
    throw { statusCode: 404, message: 'Firm application not found' };
  }
  return approval;
}

/**
 * Approve a firm application: mark the approval APPROVED and the firm ACTIVE.
 * @param {string} approvalId
 * @param {string} adminId
 * @returns {Promise<object>} the updated approval (plain)
 */
async function approve(approvalId, adminId) {
  const approval = await loadApproval(approvalId);
  const now = new Date();
  const firm = await LawFirm.findByPk(approval.firmId);

  await sequelize.transaction(async (transaction) => {
    await approval.update(
      { status: 'APPROVED', reviewedBy: adminId, reviewedAt: now },
      { transaction }
    );
    if (firm) {
      await firm.update({ status: 'ACTIVE' }, { transaction });
    }
  });

  if (firm) {
    const owner = await User.findByPk(firm.ownerUserId);
    if (owner) {
      await enqueue('email', {
        to: owner.email,
        template: 'firmApproval',
        vars: {
          ownerName: owner.fullName || owner.name || 'there',
          firmName: firm.firmName,
          approvalDate: now.toLocaleDateString(),
          dashboardUrl: `${env.appUrl}/firm`,
        },
      });
      try {
        await notificationService.createNotification({
          userId: owner.id,
          type: 'firm_approval',
          title: 'Your law firm has been approved',
          message: `Your law firm "${firm.firmName}" has been approved and is now active.`,
          link: '/firm',
          metadata: { approvalId: approval.id, firmId: firm.id },
        });
      } catch (err) {
        console.error('[FirmApproval] notification failed:', err.message || err);
      }
    }
  }

  return plain(approval);
}

/**
 * Reject a firm application with a reason; mark the firm REJECTED.
 * @param {string} approvalId
 * @param {string} adminId
 * @param {string} reason
 * @returns {Promise<object>} the updated approval (plain)
 */
async function reject(approvalId, adminId, reason) {
  if (!reason || !String(reason).trim()) {
    throw {
      statusCode: 422,
      message: 'Validation failed',
      errors: { reason: 'reason is required' },
    };
  }
  const approval = await loadApproval(approvalId);
  const now = new Date();
  const firm = await LawFirm.findByPk(approval.firmId);

  await sequelize.transaction(async (transaction) => {
    await approval.update(
      {
        status: 'REJECTED',
        rejectionReason: String(reason).trim(),
        reviewedBy: adminId,
        reviewedAt: now,
      },
      { transaction }
    );
    if (firm) {
      await firm.update({ status: 'REJECTED' }, { transaction });
    }
  });

  if (firm) {
    const owner = await User.findByPk(firm.ownerUserId);
    if (owner) {
      await enqueue('email', {
        to: owner.email,
        template: 'firmRejection',
        vars: {
          ownerName: owner.fullName || owner.name || 'there',
          firmName: firm.firmName,
          reason: String(reason).trim(),
          resubmitUrl: `${env.appUrl}/firm/edit`,
        },
      });
      try {
        await notificationService.createNotification({
          userId: owner.id,
          type: 'firm_rejection',
          title: 'Your law firm was not approved',
          message: `Your law firm "${firm.firmName}" was not approved. Reason: ${String(
            reason
          ).trim()}.`,
          link: '/firm/edit',
          metadata: { approvalId: approval.id, firmId: firm.id },
        });
      } catch (err) {
        console.error('[FirmApproval] notification failed:', err.message || err);
      }
    }
  }

  return plain(approval);
}

/**
 * Request modifications on a firm application; mark the firm
 * MODIFICATIONS_REQUESTED.
 * @param {string} approvalId
 * @param {string} adminId
 * @param {string} message
 * @returns {Promise<object>} the updated approval (plain)
 */
async function requestModifications(approvalId, adminId, message) {
  if (!message || !String(message).trim()) {
    throw {
      statusCode: 422,
      message: 'Validation failed',
      errors: { message: 'message is required' },
    };
  }
  const approval = await loadApproval(approvalId);
  const now = new Date();
  const firm = await LawFirm.findByPk(approval.firmId);

  await sequelize.transaction(async (transaction) => {
    await approval.update(
      {
        status: 'MODIFICATIONS_REQUESTED',
        requestedModifications: String(message).trim(),
        reviewedBy: adminId,
        reviewedAt: now,
      },
      { transaction }
    );
    if (firm) {
      await firm.update(
        { status: 'MODIFICATIONS_REQUESTED' },
        { transaction }
      );
    }
  });

  if (firm) {
    const owner = await User.findByPk(firm.ownerUserId);
    if (owner) {
      await enqueue('email', {
        to: owner.email,
        template: 'firmModificationsRequested',
        vars: {
          ownerName: owner.fullName || owner.name || 'there',
          firmName: firm.firmName,
          requestedModifications: String(message).trim(),
          resubmitUrl: `${env.appUrl}/firm/edit`,
        },
      });
      try {
        await notificationService.createNotification({
          userId: owner.id,
          type: 'firm_modifications_requested',
          title: 'Changes requested for your law firm',
          message: `An admin requested changes to your law firm "${firm.firmName}": ${String(
            message
          ).trim()}`,
          link: '/firm/edit',
          metadata: { approvalId: approval.id, firmId: firm.id },
        });
      } catch (err) {
        console.error('[FirmApproval] notification failed:', err.message || err);
      }
    }
  }

  return plain(approval);
}

module.exports = {
  listPending,
  getReviewPayload,
  approve,
  reject,
  requestModifications,
};
