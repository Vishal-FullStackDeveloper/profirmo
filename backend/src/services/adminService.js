const { Op } = require('sequelize');
const {
  User,
  Professional,
  Firm,
  Client,
  Case,
  Booking,
  Consultation,
  Review,
  AuditLog,
  ProfessionalApproval,
  LawFirm,
  FirmApproval,
  FirmInvitation,
} = require('../models');

// Strip the password before exposing a user record.
const sanitizeUser = (user) => {
  const plain = typeof user.get === 'function' ? user.get({ plain: true }) : user;
  const { password, ...rest } = plain;
  return rest;
};

/**
 * Aggregate platform-wide statistics for the admin dashboard.
 * `revenue` is a placeholder sum of completed-booking estimated costs
 * and ended-consultation costs.
 */
const getStats = async () => {
  const [
    users,
    professionals,
    firms,
    clients,
    cases,
    bookings,
    consultations,
    reviews,
    pendingProfessionals,
  ] = await Promise.all([
    User.count(),
    Professional.count(),
    Firm.count(),
    Client.count(),
    Case.count(),
    Booking.count(),
    Consultation.count(),
    Review.count(),
    Professional.count({ where: { status: 'pending' } }),
  ]);

  const completedBookings = await Booking.findAll({
    where: { status: 'completed' },
    attributes: ['estimatedCost'],
    raw: true,
  });
  const endedConsultations = await Consultation.findAll({
    where: { callStatus: 'ended' },
    attributes: ['cost'],
    raw: true,
  });

  const bookingRevenue = completedBookings.reduce(
    (sum, b) => sum + (b.estimatedCost || 0),
    0
  );
  const consultationRevenue = endedConsultations.reduce(
    (sum, c) => sum + (c.cost || 0),
    0
  );

  return {
    totals: {
      users,
      professionals,
      firms,
      clients,
      cases,
      bookings,
      consultations,
      reviews,
    },
    pendingProfessionals,
    revenue: {
      currency: 'INR',
      fromBookings: bookingRevenue,
      fromConsultations: consultationRevenue,
      total: bookingRevenue + consultationRevenue,
      note: 'Placeholder revenue figure derived from stored data.',
    },
  };
};

/**
 * List users (sanitized, password excluded) with pagination, optional role /
 * status filters and a free-text search across name + email fields. Newest
 * first.
 * @param {object} [opts]
 * @param {number} [opts.page]   - 1-based page number
 * @param {number} [opts.limit]  - rows per page
 * @param {string} [opts.role]   - exact role filter
 * @param {string} [opts.status] - exact status filter
 * @param {string} [opts.search] - matches firstName/lastName/fullName/email
 * @returns {Promise<{ rows: Array, page: number, limit: number, total: number }>}
 */
const listUsers = async ({
  page = 1,
  limit = 20,
  role,
  status,
  search,
} = {}) => {
  const safePage = Number(page) > 0 ? Math.floor(Number(page)) : 1;
  const safeLimit =
    Number(limit) > 0 ? Math.min(Math.floor(Number(limit)), 100) : 20;

  const where = {};
  if (role) where.role = role;
  if (status) where.status = status;
  if (search) {
    const term = `%${String(search).trim()}%`;
    where[Op.or] = [
      { firstName: { [Op.like]: term } },
      { lastName: { [Op.like]: term } },
      { fullName: { [Op.like]: term } },
      { email: { [Op.like]: term } },
    ];
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  });

  return {
    rows: rows.map(sanitizeUser),
    page: safePage,
    limit: safeLimit,
    total: count,
  };
};

/** List professionals awaiting admin approval. */
const getPendingProfessionals = async () =>
  Professional.findAll({ where: { status: 'pending' }, raw: true });

/** Approve a pending professional. Returns null when not found. */
const approveProfessional = async (id) => {
  const professional = await Professional.findByPk(id);
  if (!professional) return null;
  await professional.update({ status: 'approved', verified: true });
  return professional.get({ plain: true });
};

/** List all firms. */
const listFirms = async () => Firm.findAll({ raw: true });

/** List all bookings. */
const listBookings = async () => Booking.findAll({ raw: true });

/**
 * List recent audit logs, newest first, with simple pagination and optional
 * action / status / userId filters.
 * @param {object} [opts]
 * @param {number} [opts.page]   - 1-based page number
 * @param {number} [opts.limit]  - rows per page
 * @param {string} [opts.action] - exact-match action filter
 * @param {string} [opts.status] - exact-match status filter
 * @param {string} [opts.userId] - exact-match acting-user filter
 * @returns {Promise<{ rows: Array, page: number, limit: number, total: number }>}
 */
const listAuditLogs = async ({
  page = 1,
  limit = 20,
  action,
  status,
  userId,
} = {}) => {
  const safePage = Number(page) > 0 ? Math.floor(Number(page)) : 1;
  const safeLimit =
    Number(limit) > 0 ? Math.min(Math.floor(Number(limit)), 100) : 20;

  const where = {};
  if (action) where.action = action;
  if (status) where.status = status;
  if (userId) where.userId = userId;

  const { rows, count } = await AuditLog.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
    raw: true,
  });
  return { rows, page: safePage, limit: safeLimit, total: count };
};

/**
 * Build a comprehensive admin dashboard snapshot in a single call using
 * efficient count() queries.
 * @returns {Promise<object>}
 */
const getOverview = async () => {
  const [
    totalUsers,
    clientUsers,
    professionalUsers,
    firmAdminUsers,
    firmProfessionalUsers,
    platformAdminUsers,
    totalProfessionals,
    pendingProfessionalApprovals,
    approvedProfessionals,
    totalFirms,
    activeFirms,
    pendingFirmApprovals,
    pendingInvitations,
    recentAuditLogs,
  ] = await Promise.all([
    User.count(),
    User.count({ where: { role: 'client' } }),
    User.count({ where: { role: 'professional' } }),
    User.count({ where: { role: 'firm_admin' } }),
    User.count({ where: { role: 'firm_professional' } }),
    User.count({ where: { role: 'platform_admin' } }),
    ProfessionalApproval.count(),
    ProfessionalApproval.count({
      where: {
        status: { [Op.in]: ['PENDING_APPROVAL', 'INFO_REQUESTED'] },
      },
    }),
    ProfessionalApproval.count({ where: { status: 'APPROVED' } }),
    LawFirm.count(),
    LawFirm.count({ where: { status: 'ACTIVE' } }),
    FirmApproval.count({
      where: {
        status: { [Op.in]: ['PENDING_APPROVAL', 'MODIFICATIONS_REQUESTED'] },
      },
    }),
    FirmInvitation.count({ where: { status: 'PENDING' } }),
    AuditLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
      attributes: [
        'action',
        'status',
        'userId',
        'ipAddress',
        'createdAt',
      ],
      raw: true,
    }),
  ]);

  return {
    users: {
      total: totalUsers,
      byRole: {
        client: clientUsers,
        professional: professionalUsers,
        firm_admin: firmAdminUsers,
        firm_professional: firmProfessionalUsers,
        platform_admin: platformAdminUsers,
      },
    },
    professionals: {
      total: totalProfessionals,
      pendingApproval: pendingProfessionalApprovals,
      approved: approvedProfessionals,
    },
    firms: {
      total: totalFirms,
      active: activeFirms,
      pendingApproval: pendingFirmApprovals,
    },
    invitations: {
      pending: pendingInvitations,
    },
    recentAuditLogs,
  };
};

/**
 * Update a user's account status (active | suspended). Guards against
 * suspending the last platform_admin and against an admin suspending
 * themselves.
 * @param {object} opts
 * @param {string} opts.targetUserId - the user being updated
 * @param {string} opts.status       - 'active' | 'suspended'
 * @param {string} opts.actingUserId - the admin performing the change
 * @returns {Promise<{ user: object, previousStatus: string }>}
 */
const updateUserStatus = async ({ targetUserId, status, actingUserId }) => {
  const normalized = String(status || '').toLowerCase().trim();
  if (normalized !== 'active' && normalized !== 'suspended') {
    throw {
      statusCode: 400,
      message: "status must be one of: 'active', 'suspended'",
    };
  }

  const user = await User.findByPk(targetUserId);
  if (!user) {
    throw { statusCode: 404, message: `User not found: ${targetUserId}` };
  }

  if (normalized === 'suspended') {
    if (String(actingUserId) === String(targetUserId)) {
      throw {
        statusCode: 400,
        message: 'You cannot suspend your own account.',
      };
    }
    if (user.role === 'platform_admin') {
      const otherActiveAdmins = await User.count({
        where: {
          role: 'platform_admin',
          status: { [Op.ne]: 'suspended' },
          id: { [Op.ne]: targetUserId },
        },
      });
      if (otherActiveAdmins === 0) {
        throw {
          statusCode: 400,
          message: 'Cannot suspend the only active platform admin.',
        };
      }
    }
  }

  const previousStatus = user.status || 'active';
  user.status = normalized;
  await user.save();

  return { user: sanitizeUser(user), previousStatus };
};

module.exports = {
  getStats,
  listUsers,
  getPendingProfessionals,
  approveProfessional,
  listFirms,
  listBookings,
  listAuditLogs,
  getOverview,
  updateUserStatus,
};
