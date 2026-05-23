// Law firm service for the Profirmo backend (Phase 3, extended in Phase 8).
//
// Holds the database logic behind the /api/law-firm endpoints: creating and
// managing the law firm, the firm-approval workflow, firm roles, and the
// firm-side invitation routes. Multi-row writes use a transaction.

const { Op } = require('sequelize');
const {
  sequelize,
  User,
  LawFirm,
  FirmMember,
  FirmApproval,
  ProfessionalDetail,
  ProfessionalApproval,
} = require('../models');
const { enqueue } = require('./queueService');
const notificationService = require('./notificationService');
const { resolveFirmContext, canEditFirm, canChangeRoles, canRemoveMembers } =
  require('./firmRoleService');
const env = require('../config/env');

// law_firms columns settable when creating / updating a firm.
const LAW_FIRM_FIELDS = [
  'firmName',
  'registrationNumber',
  'logo',
  'website',
  'establishedYear',
  'about',
  'headquarters',
  'contactEmail',
  'contactNumber',
  'totalEmployees',
  'practiceAreas',
  'socialLinks',
  'registrationCertificate',
  'businessLicense',
  'taxDocuments',
];

// Build an object of only the keys present in `source` that are in `allowed`.
const pick = (source = {}, allowed = []) => {
  const out = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      out[key] = source[key];
    }
  }
  return out;
};

// Convert a Sequelize instance (or null) to a plain object (or null).
const plain = (record) =>
  record && typeof record.get === 'function'
    ? record.get({ plain: true })
    : record || null;

/**
 * Load the firm members for a firm, each enriched with the linked
 * professional's name / email / professionalType.
 *
 * @param {string} firmId
 * @returns {Promise<Array<object>>}
 */
const listFirmMembers = async (firmId) => {
  const members = await FirmMember.findAll({
    where: { firmId },
    order: [['createdAt', 'ASC']],
  });

  const enriched = [];
  for (const member of members) {
    const m = plain(member);
    const professionalDetail = await ProfessionalDetail.findByPk(
      m.professionalId
    );
    let professional = null;
    if (professionalDetail) {
      const pd = plain(professionalDetail);
      const user = await User.findByPk(pd.userId);
      const u = plain(user);
      professional = {
        professionalId: pd.id,
        userId: pd.userId,
        professionalType: pd.professionalType || null,
        name: u ? u.fullName || u.name || null : null,
        email: u ? u.email || null : null,
      };
    }
    enriched.push({ ...m, professional });
  }
  return enriched;
};

/**
 * Notify every platform_admin (in-app) about a firm pending review.
 * @param {object} lawFirm - the firm (plain)
 * @param {string} title
 * @param {string} message
 */
const notifyAdminsOfFirm = async (lawFirm, title, message) => {
  const admins = await User.findAll({ where: { role: 'platform_admin' } });
  for (const admin of admins) {
    try {
      await notificationService.createNotification({
        userId: admin.id,
        type: 'firm_registration',
        title,
        message,
        link: '/admin/firms/pending',
        metadata: { firmId: lawFirm.id },
      });
    } catch (err) {
      console.error('[LawFirm] admin notification failed:', err.message || err);
    }
  }
};

/**
 * Get the law firm the caller belongs to (owns OR is a member of) plus its
 * members, the caller's firm role, and the firm-approval record.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
const getMyFirm = async (userId) => {
  const ctx = await resolveFirmContext(userId);
  if (!ctx.lawFirm) {
    return { lawFirm: null, members: [], myRole: null, approval: null };
  }
  const members = await listFirmMembers(ctx.lawFirm.id);
  const approval = await FirmApproval.findOne({
    where: { firmId: ctx.lawFirm.id },
  });
  return {
    lawFirm: ctx.lawFirm,
    members,
    myRole: ctx.role,
    approval: plain(approval),
  };
};

/**
 * Create the law firm owned by the caller, gated on the caller being an
 * APPROVED professional. Inserts the firm, a FirmApproval record and the
 * creator's owner FirmMember row in a transaction, then notifies admins.
 *
 * @param {object} reqUser - { id, role }
 * @param {object} body - firm fields
 * @returns {Promise<{ lawFirm: object, members: Array, approval: object }>}
 */
const createFirm = async (reqUser, body = {}) => {
  const userId = reqUser.id;

  // Gate 1: only users with the 'professional' role may create a firm.
  if (reqUser.role !== 'professional') {
    throw {
      statusCode: 403,
      message: 'Only approved professionals can create a law firm',
    };
  }

  // Gate 2: the professional must have an APPROVED ProfessionalApproval.
  const approval = await ProfessionalApproval.findOne({
    where: { userId },
    order: [['createdAt', 'DESC']],
  });
  if (!approval || approval.status !== 'APPROVED') {
    throw {
      statusCode: 403,
      message:
        'Your professional profile must be approved before you can create a law firm',
    };
  }

  // Gate 3: the caller must not already own a firm.
  const existing = await LawFirm.findOne({ where: { ownerUserId: userId } });
  if (existing) {
    throw { statusCode: 409, message: 'You already own a law firm' };
  }

  // The creator needs a ProfessionalDetail to be recorded as the owner member.
  const professionalDetail = await ProfessionalDetail.findOne({
    where: { userId },
  });
  if (!professionalDetail) {
    throw {
      statusCode: 422,
      message: 'A professional profile is required to create a firm',
    };
  }

  const firmData = pick(body, LAW_FIRM_FIELDS);
  const now = new Date();

  let lawFirm;
  let firmApproval;
  await sequelize.transaction(async (transaction) => {
    lawFirm = await LawFirm.create(
      { ...firmData, ownerUserId: userId, status: 'PENDING_APPROVAL' },
      { transaction }
    );
    firmApproval = await FirmApproval.create(
      {
        firmId: lawFirm.id,
        submittedByUserId: userId,
        status: 'PENDING_APPROVAL',
        submittedAt: now,
      },
      { transaction }
    );
    await FirmMember.create(
      {
        firmId: lawFirm.id,
        professionalId: professionalDetail.id,
        role: 'owner',
        status: 'active',
        joiningDate: now,
      },
      { transaction }
    );
  });

  const firmPlain = plain(lawFirm);
  const owner = await User.findByPk(userId);
  const ownerName = owner
    ? owner.fullName || owner.name || 'A professional'
    : 'A professional';

  // Email the platform admins about the new firm registration.
  const admins = await User.findAll({ where: { role: 'platform_admin' } });
  for (const admin of admins) {
    await enqueue('email', {
      to: admin.email,
      template: 'newFirmRegistration',
      vars: {
        firmName: firmPlain.firmName || 'A new law firm',
        ownerName,
        reviewUrl: `${env.appUrl}/admin/firms/${firmApproval.id}`,
      },
    });
  }
  await notifyAdminsOfFirm(
    firmPlain,
    'New law firm pending review',
    `${ownerName} registered the law firm "${firmPlain.firmName}". It is awaiting approval.`
  );

  return {
    lawFirm: firmPlain,
    members: await listFirmMembers(firmPlain.id),
    approval: plain(firmApproval),
  };
};

/**
 * Update the caller's firm. Only the owner may edit. If the firm's approval
 * was REJECTED or MODIFICATIONS_REQUESTED, an edit re-submits it for review.
 *
 * @param {string} userId
 * @param {object} body - firm fields
 * @returns {Promise<{ lawFirm, members, approval }>}
 */
const updateFirm = async (userId, body = {}) => {
  const ctx = await resolveFirmContext(userId);
  if (!ctx.lawFirm) {
    throw { statusCode: 404, message: 'You do not own a law firm yet' };
  }
  if (!canEditFirm(ctx.role)) {
    throw {
      statusCode: 403,
      message: 'Only the firm owner can edit the firm',
    };
  }

  const lawFirm = await LawFirm.findByPk(ctx.lawFirm.id);
  const firmData = pick(body, LAW_FIRM_FIELDS);

  const approval = await FirmApproval.findOne({
    where: { firmId: lawFirm.id },
  });

  const isResubmission =
    approval &&
    (approval.status === 'REJECTED' ||
      approval.status === 'MODIFICATIONS_REQUESTED');

  await sequelize.transaction(async (transaction) => {
    const updates = { ...firmData };
    if (isResubmission) {
      updates.status = 'PENDING_APPROVAL';
    }
    await lawFirm.update(updates, { transaction });

    if (isResubmission) {
      await approval.update(
        {
          status: 'PENDING_APPROVAL',
          rejectionReason: null,
          requestedModifications: null,
          submittedAt: new Date(),
          resubmissionCount: (approval.resubmissionCount || 0) + 1,
        },
        { transaction }
      );
    }
  });

  if (isResubmission) {
    const owner = await User.findByPk(userId);
    const ownerName = owner
      ? owner.fullName || owner.name || 'A professional'
      : 'A professional';
    await notifyAdminsOfFirm(
      plain(lawFirm),
      'Law firm resubmitted for review',
      `${ownerName} resubmitted the law firm "${lawFirm.firmName}" for approval.`
    );
  }

  return {
    lawFirm: plain(lawFirm),
    members: await listFirmMembers(lawFirm.id),
    approval: plain(await FirmApproval.findOne({ where: { firmId: lawFirm.id } })),
  };
};

/**
 * List the members of the caller's firm (caller must be part of the firm).
 * @param {string} userId
 * @returns {Promise<Array<object>>}
 */
const getMembers = async (userId) => {
  const ctx = await resolveFirmContext(userId);
  if (!ctx.lawFirm) {
    throw { statusCode: 404, message: 'You are not part of any law firm' };
  }
  return listFirmMembers(ctx.lawFirm.id);
};

/**
 * Change a member's firm role. OWNER ONLY. The owner's own row cannot be
 * changed and the target role must be 'co-owner' or 'member'.
 *
 * @param {string} userId - the caller
 * @param {string} memberId
 * @param {object} body - { role }
 * @returns {Promise<object>} the updated member (enriched)
 */
const changeMemberRole = async (userId, memberId, body = {}) => {
  const ctx = await resolveFirmContext(userId);
  if (!ctx.lawFirm) {
    throw { statusCode: 404, message: 'You are not part of any law firm' };
  }
  if (!canChangeRoles(ctx.role)) {
    throw {
      statusCode: 403,
      message: 'Only the firm owner can change member roles',
    };
  }

  const newRole = body && body.role;
  if (!['co-owner', 'member'].includes(newRole)) {
    throw {
      statusCode: 422,
      message: 'Validation failed',
      errors: { role: "role must be 'co-owner' or 'member'" },
    };
  }

  const member = await FirmMember.findOne({
    where: { id: memberId, firmId: ctx.lawFirm.id },
  });
  if (!member) {
    throw {
      statusCode: 404,
      message: `Member not found in your firm: ${memberId}`,
    };
  }
  if (member.role === 'owner') {
    throw {
      statusCode: 403,
      message: "The firm owner's role cannot be changed",
    };
  }

  await member.update({ role: newRole });

  // Notify the affected member.
  const professionalDetail = await ProfessionalDetail.findByPk(
    member.professionalId
  );
  if (professionalDetail) {
    try {
      await notificationService.createNotification({
        userId: professionalDetail.userId,
        type: 'firm_role_changed',
        title: 'Your firm role was updated',
        message: `Your role in ${ctx.lawFirm.firmName} is now "${newRole}".`,
        link: '/firm',
        metadata: { firmId: ctx.lawFirm.id, role: newRole },
      });
    } catch (err) {
      console.error('[LawFirm] notification failed:', err.message || err);
    }
  }

  const enriched = await listFirmMembers(ctx.lawFirm.id);
  return enriched.find((m) => m.id === member.id) || plain(member);
};

/**
 * Remove a member from the caller's firm. Owner or co-owner only. The owner's
 * own row cannot be removed.
 *
 * @param {string} userId - the caller
 * @param {string} memberId
 * @returns {Promise<{ id: string }>}
 */
const removeMember = async (userId, memberId) => {
  const ctx = await resolveFirmContext(userId);
  if (!ctx.lawFirm) {
    throw { statusCode: 404, message: 'You are not part of any law firm' };
  }
  if (!canRemoveMembers(ctx.role)) {
    throw {
      statusCode: 403,
      message: 'You do not have permission to remove members',
    };
  }

  const member = await FirmMember.findOne({
    where: { id: memberId, firmId: ctx.lawFirm.id },
  });
  if (!member) {
    throw {
      statusCode: 404,
      message: `Member not found in your firm: ${memberId}`,
    };
  }
  if (member.role === 'owner') {
    throw {
      statusCode: 403,
      message: 'The firm owner cannot be removed',
    };
  }

  await member.destroy();
  return { id: memberId };
};

/**
 * Search APPROVED professionals to invite, by name or email. Excludes users
 * already in the caller's firm.
 *
 * @param {string} userId - the caller
 * @param {string} query - search term
 * @returns {Promise<Array<{userId,fullName,email,professionalType}>>}
 */
const searchProfessionals = async (userId, query) => {
  const term = String(query || '').trim();
  if (!term) return [];

  // APPROVED professional users whose approval is APPROVED.
  const approvals = await ProfessionalApproval.findAll({
    where: { status: 'APPROVED' },
  });
  const approvedUserIds = approvals.map((a) => a.userId);
  if (!approvedUserIds.length) return [];

  const like = { [Op.like]: `%${term}%` };
  const users = await User.findAll({
    where: {
      id: { [Op.in]: approvedUserIds },
      role: 'professional',
      [Op.or]: [
        { fullName: like },
        { name: like },
        { firstName: like },
        { lastName: like },
        { email: like },
      ],
    },
    limit: 20,
  });

  // Exclude users already in the caller's firm.
  const ctx = await resolveFirmContext(userId);
  const memberUserIds = new Set();
  if (ctx.lawFirm) {
    const members = await listFirmMembers(ctx.lawFirm.id);
    for (const m of members) {
      if (m.professional && m.professional.userId) {
        memberUserIds.add(m.professional.userId);
      }
    }
  }

  const out = [];
  for (const user of users) {
    if (memberUserIds.has(user.id)) continue;
    const professionalDetail = await ProfessionalDetail.findOne({
      where: { userId: user.id },
    });
    out.push({
      userId: user.id,
      fullName: user.fullName || user.name || null,
      email: user.email,
      professionalType: professionalDetail
        ? professionalDetail.professionalType || null
        : null,
    });
  }
  return out;
};

module.exports = {
  getMyFirm,
  createFirm,
  updateFirm,
  getMembers,
  changeMemberRole,
  removeMember,
  searchProfessionals,
};
