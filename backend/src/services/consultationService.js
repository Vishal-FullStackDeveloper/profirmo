const { Consultation, Professional, Booking } = require('../models');
const { paginate } = require('./professionalService');

/**
 * List consultations with optional filters and pagination.
 * Supported filters: callStatus, clientId, professionalId, bookingId.
 * @returns {Promise<{ items, page, limit, total }>}
 */
const list = async ({ filters = {}, page, limit } = {}) => {
  const { page: p, limit: l, offset } = paginate(page, limit);
  const where = {};

  if (filters.callStatus) where.callStatus = String(filters.callStatus);
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.professionalId) where.professionalId = filters.professionalId;
  if (filters.bookingId) where.bookingId = filters.bookingId;

  const { rows, count } = await Consultation.findAndCountAll({
    where,
    limit: l,
    offset,
    raw: true,
  });

  return { items: rows, page: p, limit: l, total: count };
};

/** Find a consultation by id, or null when not found. */
const getById = async (id) => {
  const consultation = await Consultation.findByPk(id, { raw: true });
  return consultation || null;
};

/** Start a consultation call. Returns null when the consultation is missing. */
const start = async (id) => {
  const consultation = await Consultation.findByPk(id);
  if (!consultation) return null;
  if (consultation.callStatus === 'ended') {
    throw { statusCode: 422, message: 'Consultation has already ended' };
  }
  await consultation.update({
    callStatus: 'ongoing',
    startedAt: consultation.startedAt || new Date(),
  });
  return consultation.get({ plain: true });
};

/**
 * End a consultation call. Computes durationMinutes from start/end times
 * and cost from the professional's per-minute rate.
 * Returns null when the consultation is missing.
 */
const end = async (id) => {
  const consultation = await Consultation.findByPk(id);
  if (!consultation) return null;
  if (consultation.callStatus !== 'ongoing') {
    throw {
      statusCode: 422,
      message: 'Only an ongoing consultation can be ended',
    };
  }

  const endedAt = new Date();
  const startedAt = consultation.startedAt
    ? new Date(consultation.startedAt)
    : endedAt;

  const durationMinutes = Math.max(
    Math.round((endedAt.getTime() - startedAt.getTime()) / 60000),
    0
  );

  const professional = await Professional.findByPk(
    consultation.professionalId
  );
  const rate = professional ? professional.perMinuteRate : 0;

  await consultation.update({
    callStatus: 'ended',
    endedAt,
    durationMinutes,
    cost: durationMinutes * rate,
  });

  // Mark the linked booking as completed if present.
  if (consultation.bookingId) {
    const booking = await Booking.findByPk(consultation.bookingId);
    if (booking && booking.status !== 'cancelled') {
      await booking.update({ status: 'completed' });
    }
  }

  return consultation.get({ plain: true });
};

/** Get the recording URL for a consultation. Returns null if missing. */
const getRecording = async (id) => {
  const consultation = await Consultation.findByPk(id, { raw: true });
  if (!consultation) return null;
  return {
    consultationId: consultation.id,
    recordingUrl: consultation.recordingUrl,
    available: Boolean(consultation.recordingUrl),
  };
};

/** Get the transcript for a consultation. Returns null if missing. */
const getTranscript = async (id) => {
  const consultation = await Consultation.findByPk(id, { raw: true });
  if (!consultation) return null;
  return {
    consultationId: consultation.id,
    transcript: consultation.transcript,
    available: Boolean(consultation.transcript),
  };
};

/** Append/replace notes on a consultation. Returns null if missing. */
const addNotes = async (id, notes) => {
  const consultation = await Consultation.findByPk(id);
  if (!consultation) return null;
  await consultation.update({ notes: notes || '' });
  return consultation.get({ plain: true });
};

module.exports = {
  list,
  getById,
  start,
  end,
  getRecording,
  getTranscript,
  addNotes,
};
