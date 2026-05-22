const { Op } = require('sequelize');
const { Review, Client, Professional, Firm } = require('../models');
const { paginate } = require('./professionalService');

/**
 * List reviews with optional filters and pagination.
 * Supported filters: professionalId, firmId, minRating.
 * @returns {Promise<{ items, page, limit, total }>}
 */
const list = async ({ filters = {}, page, limit } = {}) => {
  const { page: p, limit: l, offset } = paginate(page, limit);
  const where = {};

  if (filters.professionalId) where.professionalId = filters.professionalId;
  if (filters.firmId) where.firmId = filters.firmId;
  if (filters.minRating !== undefined) {
    where.rating = { [Op.gte]: Number(filters.minRating) || 0 };
  }

  const { rows, count } = await Review.findAndCountAll({
    where,
    limit: l,
    offset,
    raw: true,
  });

  return { items: rows, page: p, limit: l, total: count };
};

/**
 * Create a review. When tied to a professional/firm, the aggregate rating
 * and reviewsCount of that entity are recalculated.
 */
const create = async (data = {}) => {
  const rating = Number(data.rating);
  if (Number.isNaN(rating) || rating < 0 || rating > 5) {
    throw {
      statusCode: 422,
      message: 'rating must be a number between 0 and 5',
    };
  }

  let clientName = data.clientName || '';
  if (!clientName && data.clientId) {
    const client = await Client.findByPk(data.clientId);
    if (client) clientName = client.name;
  }

  const review = await Review.create({
    clientId: data.clientId,
    clientName,
    professionalId: data.professionalId || null,
    firmId: data.firmId || null,
    rating,
    comment: data.comment,
    date: data.date || new Date().toISOString().slice(0, 10),
  });

  if (review.professionalId) {
    await recalcProfessionalRating(review.professionalId);
  }
  if (review.firmId) {
    await recalcFirmRating(review.firmId);
  }

  return review.get({ plain: true });
};

// Recalculate a professional's rating average and review count.
const recalcProfessionalRating = async (professionalId) => {
  const professional = await Professional.findByPk(professionalId);
  if (!professional) return;
  const related = await Review.findAll({
    where: { professionalId },
    raw: true,
  });
  const changes = { reviewsCount: related.length };
  if (related.length > 0) {
    const avg =
      related.reduce((sum, r) => sum + r.rating, 0) / related.length;
    changes.rating = Math.round(avg * 10) / 10;
  }
  await professional.update(changes);
};

// Recalculate a firm's rating average and review count.
const recalcFirmRating = async (firmId) => {
  const firm = await Firm.findByPk(firmId);
  if (!firm) return;
  const related = await Review.findAll({ where: { firmId }, raw: true });
  const changes = { reviewsCount: related.length };
  if (related.length > 0) {
    const avg =
      related.reduce((sum, r) => sum + r.rating, 0) / related.length;
    changes.rating = Math.round(avg * 10) / 10;
  }
  await firm.update(changes);
};

/** Get all reviews for a given professional. */
const getByProfessional = async (professionalId) =>
  Review.findAll({ where: { professionalId }, raw: true });

/** Get all reviews for a given firm. */
const getByFirm = async (firmId) =>
  Review.findAll({ where: { firmId }, raw: true });

module.exports = { list, create, getByProfessional, getByFirm };
