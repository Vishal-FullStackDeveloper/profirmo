const { Booking, Consultation, Professional, Client } = require('../models');
const { paginate } = require('./professionalService');

const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

/**
 * List bookings with optional filters and pagination.
 * Supported filters: status, type, clientId, professionalId.
 * @returns {Promise<{ items, page, limit, total }>}
 */
const list = async ({ filters = {}, page, limit } = {}) => {
  const { page: p, limit: l, offset } = paginate(page, limit);
  const where = {};

  if (filters.status) where.status = String(filters.status);
  if (filters.type) where.type = String(filters.type);
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.professionalId) where.professionalId = filters.professionalId;

  const { rows, count } = await Booking.findAndCountAll({
    where,
    limit: l,
    offset,
    raw: true,
  });

  return { items: rows, page: p, limit: l, total: count };
};

/** Find a booking by id, or null when not found. */
const getById = async (id) => {
  const booking = await Booking.findByPk(id, { raw: true });
  return booking || null;
};

/**
 * Create a booking. estimatedCost is derived from the professional's
 * per-minute rate and the requested duration. A matching scheduled
 * consultation record is also created.
 */
const create = async (data = {}) => {
  const professional = await Professional.findByPk(data.professionalId);
  if (!professional) {
    throw {
      statusCode: 404,
      message: `Professional not found: ${data.professionalId}`,
    };
  }
  const client = await Client.findByPk(data.clientId);
  if (!client) {
    throw { statusCode: 404, message: `Client not found: ${data.clientId}` };
  }

  const duration = Number(data.duration) || 0;
  const estimatedCost = duration * professional.perMinuteRate;

  const booking = await Booking.create({
    clientId: data.clientId,
    professionalId: data.professionalId,
    date: data.date,
    time: data.time,
    duration,
    type: data.type || 'scheduled',
    estimatedCost,
    status: data.status || 'pending',
  });

  // Auto-create the consultation shell for this booking.
  await Consultation.create({
    bookingId: booking.id,
    clientId: booking.clientId,
    professionalId: booking.professionalId,
    callStatus: 'scheduled',
  });

  return booking.get({ plain: true });
};

/** Update a booking's status. Returns null when the booking is not found. */
const updateStatus = async (id, status) => {
  if (!VALID_STATUSES.includes(status)) {
    throw {
      statusCode: 422,
      message: `Invalid status. Allowed: ${VALID_STATUSES.join(', ')}`,
    };
  }
  const booking = await Booking.findByPk(id);
  if (!booking) return null;
  await booking.update({ status });
  return booking.get({ plain: true });
};

/** Get all bookings for a given client. */
const getByClient = async (clientId) =>
  Booking.findAll({ where: { clientId }, raw: true });

/** Get all bookings for a given professional. */
const getByProfessional = async (professionalId) =>
  Booking.findAll({ where: { professionalId }, raw: true });

module.exports = {
  list,
  getById,
  create,
  updateStatus,
  getByClient,
  getByProfessional,
};
