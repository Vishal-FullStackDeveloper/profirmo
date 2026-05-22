const {
  User,
  Professional,
  Firm,
  Client,
  Case,
  Booking,
  Consultation,
  Review,
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

/** List all users (sanitized). */
const listUsers = async () => {
  const users = await User.findAll();
  return users.map(sanitizeUser);
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

module.exports = {
  getStats,
  listUsers,
  getPendingProfessionals,
  approveProfessional,
  listFirms,
  listBookings,
};
