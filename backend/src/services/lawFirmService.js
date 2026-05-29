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
  ProfessionalClient,
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
  'numberOfProfessionals',
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
    let publicId = null;
    let name = null;
    let email = null;
    let profilePhoto = null;
    let professionalType = null;
    if (professionalDetail) {
      const pd = plain(professionalDetail);
      const user = await User.findByPk(pd.userId);
      const u = plain(user) || {};
      publicId = u.linkedId || pd.id;
      name =
        u.fullName ||
        [u.firstName, u.lastName].filter(Boolean).join(' ').trim() ||
        u.name ||
        null;
      email = u.email || null;
      profilePhoto = u.profilePhoto || null;
      professionalType = pd.professionalType || null;
      professional = {
        publicId,
        professionalId: pd.id,
        userId: pd.userId,
        professionalType,
        name,
        email,
        profilePhoto,
      };
    }
    // Flatten the most-used fields onto the member row so the dashboard
    // can read `m.name` / `m.email` / `m.profilePhoto` directly.
    enriched.push({
      ...m,
      publicId,
      name,
      email,
      profilePhoto,
      professionalType,
      professional,
    });
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
    raw: true,
  });
  if (users.length === 0) return [];

  // Caller's own firm — used to flag "this is already my member" vs.
  // "this is someone else's member".
  const ctx = await resolveFirmContext(userId);
  const myFirmId = ctx.lawFirm ? ctx.lawFirm.id : null;

  // For every candidate user, find their ProfessionalDetail + any active
  // FirmMember row (capped to one — owners/co-owners/members are mutually
  // exclusive within a firm and a professional can only belong to one firm).
  const candidateUserIds = users.map((u) => u.id);
  const details = await ProfessionalDetail.findAll({
    where: { userId: { [Op.in]: candidateUserIds } },
    attributes: ['id', 'userId', 'professionalType'],
    raw: true,
  });
  const detailByUserId = new Map(details.map((d) => [d.userId, d]));
  const detailIds = details.map((d) => d.id).filter(Boolean);
  const members = detailIds.length
    ? await FirmMember.findAll({
        where: {
          professionalId: { [Op.in]: detailIds },
          status: 'active',
        },
        attributes: ['firmId', 'professionalId', 'role'],
        raw: true,
      })
    : [];
  const memberByDetailId = new Map(
    members.map((m) => [m.professionalId, m])
  );
  const firmNameById = new Map();
  const firmIds = [...new Set(members.map((m) => m.firmId))];
  if (firmIds.length) {
    const firms = await LawFirm.findAll({
      where: { id: { [Op.in]: firmIds } },
      attributes: ['id', 'firmName'],
      raw: true,
    });
    for (const f of firms) firmNameById.set(f.id, f.firmName || '');
  }

  return users.map((user) => {
    const detail = detailByUserId.get(user.id);
    const member = detail ? memberByDetailId.get(detail.id) : null;
    const currentFirm = member
      ? {
          firmId: member.firmId,
          firmName: firmNameById.get(member.firmId) || '',
          role: member.role || '',
          // Flag: is this the caller's own firm, or someone else's?
          isMyFirm: myFirmId === member.firmId,
        }
      : null;
    return {
      userId: user.id,
      fullName: user.fullName || user.name || null,
      email: user.email,
      profilePhoto: user.profilePhoto || null,
      professionalType: detail ? detail.professionalType || null : null,
      currentFirm,
    };
  });
};

/**
 * Aggregated client list for the caller's firm: every client linked to any
 * active firm-member professional via `professional_clients`. De-duplicated
 * across members (the same client may be linked to multiple professionals
 * in the firm). Returns `{ firmId, items, memberCount }`.
 *
 * @param {string} userId
 * @returns {Promise<{ firmId: string|null, items: Array, memberCount: number }>}
 */
const getFirmClients = async (userId) => {
  const ctx = await resolveFirmContext(userId);
  if (!ctx.lawFirm) return { firmId: null, items: [], memberCount: 0 };

  // 1. All active members → their public professional id
  //    (user.linkedId || professional_details.id).
  const members = await FirmMember.findAll({
    where: { firmId: ctx.lawFirm.id, status: 'active' },
    attributes: ['professionalId'],
    raw: true,
  });
  if (members.length === 0) {
    return { firmId: ctx.lawFirm.id, items: [], memberCount: 0 };
  }
  const detailIds = [
    ...new Set(members.map((m) => m.professionalId).filter(Boolean)),
  ];
  const details = await ProfessionalDetail.findAll({
    where: { id: { [Op.in]: detailIds } },
    attributes: ['id', 'userId'],
    raw: true,
  });
  const memberUserIds = details.map((d) => d.userId).filter(Boolean);
  const linkedUsers = memberUserIds.length
    ? await User.findAll({
        where: { id: { [Op.in]: memberUserIds } },
        attributes: ['id', 'linkedId'],
        raw: true,
      })
    : [];
  const linkedByUserId = new Map(linkedUsers.map((u) => [u.id, u.linkedId]));
  const publicProfIds = [
    ...new Set(
      details.map((d) => linkedByUserId.get(d.userId) || d.id).filter(Boolean)
    ),
  ];
  if (publicProfIds.length === 0) {
    return {
      firmId: ctx.lawFirm.id,
      items: [],
      memberCount: members.length,
    };
  }

  // 2. All professional_clients links keyed to any of those professionals.
  const links = await ProfessionalClient.findAll({
    where: { professionalId: { [Op.in]: publicProfIds } },
    attributes: ['professionalId', 'clientUserId'],
    raw: true,
  });
  if (links.length === 0) {
    return {
      firmId: ctx.lawFirm.id,
      items: [],
      memberCount: members.length,
    };
  }

  // 3. Resolve every linked client-user (de-duplicated).
  const clientUserIds = [...new Set(links.map((l) => l.clientUserId))];
  const clientUsers = await User.findAll({
    where: { id: { [Op.in]: clientUserIds }, role: 'client' },
    raw: true,
  });
  const displayName = (u) =>
    u
      ? u.fullName ||
        [u.firstName, u.lastName].filter(Boolean).join(' ').trim() ||
        u.name ||
        ''
      : '';
  const items = clientUsers.map((u) => ({
    id: u.id,
    name: displayName(u),
    email: u.email || '',
    phone: u.mobileNumber || '',
    city: u.city || '',
    userType: u.userType || 'individual',
    profilePhoto: u.profilePhoto || null,
    createdAt: u.createdAt,
  }));

  return {
    firmId: ctx.lawFirm.id,
    items,
    memberCount: members.length,
  };
};

/**
 * Reviews of every member-professional in the calling user's firm. Used by
 * /dashboard/firm/reviews so the page can resolve the firm server-side
 * instead of relying on the JWT's firmId (which is null for firm-owner
 * pros — see the user table layout: linkedId points to ProfessionalDetail,
 * not the firm, so the frontend can't reliably derive the firm id).
 */
const getFirmReviews = async (userId) => {
  const ctx = await resolveFirmContext(userId);
  if (!ctx.lawFirm) return { firmId: null, items: [] };
  const reviewService = require('./reviewService');
  const items = await reviewService.getByFirm(ctx.lawFirm.id);
  return { firmId: ctx.lawFirm.id, items };
};

/**
 * List every payment received by the firm's member-professionals. Used by
 * /dashboard/firm to show the firm's collective revenue.
 *
 * Decorated with the receiving professional's name + the payer's name, so
 * the firm owner sees who paid whom without N+1 lookups in the UI.
 */
const getFirmPayments = async (userId) => {
  const ctx = await resolveFirmContext(userId);
  if (!ctx.lawFirm) return { firmId: null, items: [], memberCount: 0 };
  const { Payment } = require('../models');

  const members = await FirmMember.findAll({
    where: { firmId: ctx.lawFirm.id, status: 'active' },
    attributes: ['professionalId'],
    raw: true,
  });
  if (members.length === 0) {
    return { firmId: ctx.lawFirm.id, items: [], memberCount: 0 };
  }
  // Resolve each member's user id — payments are keyed by professionalUserId
  // (the user, not the public listing id).
  const detailIds = [
    ...new Set(members.map((m) => m.professionalId).filter(Boolean)),
  ];
  const details = await ProfessionalDetail.findAll({
    where: { id: { [Op.in]: detailIds } },
    attributes: ['id', 'userId'],
    raw: true,
  });
  const memberUserIds = [
    ...new Set(details.map((d) => d.userId).filter(Boolean)),
  ];
  if (memberUserIds.length === 0) {
    return {
      firmId: ctx.lawFirm.id,
      items: [],
      memberCount: members.length,
    };
  }

  const payments = await Payment.findAll({
    where: { professionalUserId: { [Op.in]: memberUserIds } },
    order: [['createdAt', 'DESC']],
    limit: 200,
    raw: true,
  });
  if (payments.length === 0) {
    return {
      firmId: ctx.lawFirm.id,
      items: [],
      memberCount: members.length,
    };
  }

  // Bulk-resolve professional + client display names so the table renders
  // without another roundtrip per row.
  const userIds = [
    ...new Set(
      [
        ...payments.map((p) => p.professionalUserId),
        ...payments.map((p) => p.userId),
      ].filter(Boolean)
    ),
  ];
  const users = await User.findAll({
    where: { id: { [Op.in]: userIds } },
    attributes: ['id', 'fullName', 'firstName', 'lastName', 'email'],
    raw: true,
  });
  const byUserId = new Map(users.map((u) => [u.id, u]));
  const display = (u) =>
    u
      ? u.fullName ||
        [u.firstName, u.lastName].filter(Boolean).join(' ').trim() ||
        u.email ||
        ''
      : '';

  const items = payments.map((p) => ({
    ...p,
    professionalName: display(byUserId.get(p.professionalUserId)),
    payerName: display(byUserId.get(p.userId)),
  }));

  // Aggregate totals so the page header can show at a glance.
  const totals = items.reduce(
    (acc, p) => {
      if (p.status === 'paid' || p.status === 'refunded') {
        acc.gross += Number(p.amount) || 0;
        acc.markup += Number(p.platformFee) || 0;
        acc.net += Number(p.netAmount) || 0;
      }
      return acc;
    },
    { gross: 0, markup: 0, net: 0 }
  );

  return {
    firmId: ctx.lawFirm.id,
    items,
    memberCount: members.length,
    totals,
  };
};

module.exports = {
  getMyFirm,
  createFirm,
  updateFirm,
  getMembers,
  getFirmClients,
  getFirmReviews,
  getFirmPayments,
  changeMemberRole,
  removeMember,
  searchProfessionals,
};
