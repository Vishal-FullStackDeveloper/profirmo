const { Op } = require('sequelize');
const { Professional, Review } = require('../models');

// Default pagination settings shared across list endpoints.
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

/**
 * Normalize page/limit into safe values plus the SQL offset.
 * Exported for reuse by other services.
 * @returns {{ page: number, limit: number, offset: number }}
 */
const paginate = (page, limit) => {
  const safePage = Math.max(Number(page) || DEFAULT_PAGE, 1);
  const safeLimit = Math.max(Number(limit) || DEFAULT_LIMIT, 1);
  return {
    page: safePage,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  };
};

/**
 * List professionals with optional filters, sorting and pagination.
 * Supported filters: name, city, professionType, specialization,
 * minExperience, maxRate, availableNow, minRating, language, status.
 * Supported sort values: rating | experience | price | availability.
 * @returns {Promise<{ items, page, limit, total }>}
 */
const list = async ({ filters = {}, page, limit } = {}) => {
  const { page: p, limit: l, offset } = paginate(page, limit);
  const where = {};

  if (filters.name) {
    where.name = { [Op.like]: `%${String(filters.name)}%` };
  }
  if (filters.city) {
    where.city = String(filters.city);
  }
  if (filters.professionType) {
    where.professionType = String(filters.professionType);
  }
  if (filters.specialization) {
    where.specialization = {
      [Op.like]: `%${String(filters.specialization)}%`,
    };
  }
  if (filters.minExperience !== undefined) {
    where.experience = { [Op.gte]: Number(filters.minExperience) || 0 };
  }
  if (filters.maxRate !== undefined) {
    const max = Number(filters.maxRate);
    if (!Number.isNaN(max)) {
      where.perMinuteRate = { [Op.lte]: max };
    }
  }
  if (filters.availableNow !== undefined) {
    where.availableNow =
      filters.availableNow === true || filters.availableNow === 'true';
  }
  if (filters.minRating !== undefined) {
    where.rating = { [Op.gte]: Number(filters.minRating) || 0 };
  }
  if (filters.status) {
    where.status = String(filters.status);
  }

  let order;
  switch (filters.sort) {
    case 'rating':
      order = [['rating', 'DESC']];
      break;
    case 'experience':
      order = [['experience', 'DESC']];
      break;
    case 'price':
      order = [['perMinuteRate', 'ASC']];
      break;
    case 'availability':
      order = [['availableNow', 'DESC']];
      break;
    default:
      order = undefined;
      break;
  }

  const queryOpts = { where, limit: l, offset, raw: true };
  if (order) queryOpts.order = order;

  let { rows, count } = await Professional.findAndCountAll(queryOpts);

  // Case-insensitive city/professionType equality + language filter applied
  // in-memory (DataTypes.JSON arrays cannot be filtered portably in SQL).
  if (filters.city) {
    const q = String(filters.city).toLowerCase();
    rows = rows.filter((p) => (p.city || '').toLowerCase() === q);
  }
  if (filters.language) {
    const q = String(filters.language).toLowerCase();
    rows = rows.filter((p) =>
      Array.isArray(p.languages) &&
      p.languages.some((lang) => String(lang).toLowerCase() === q)
    );
  }

  return { items: rows, page: p, limit: l, total: count };
};

/** Find a professional by id, or null when not found. */
const getById = async (id) => {
  const professional = await Professional.findByPk(id, { raw: true });
  return professional || null;
};

/**
 * Free-text search across name, professionType, specialization and city.
 */
const search = async (query) => {
  const q = String(query || '').trim();
  if (!q) return [];
  return Professional.findAll({
    where: {
      [Op.or]: [
        { name: { [Op.like]: `%${q}%` } },
        { professionType: { [Op.like]: `%${q}%` } },
        { specialization: { [Op.like]: `%${q}%` } },
        { city: { [Op.like]: `%${q}%` } },
      ],
    },
    raw: true,
  });
};

/** Toggle a professional's availableNow flag. Returns null if not found. */
const updateAvailability = async (id, availableNow) => {
  const professional = await Professional.findByPk(id);
  if (!professional) return null;
  await professional.update({ availableNow: Boolean(availableNow) });
  return professional.get({ plain: true });
};

/** Update a professional's per-minute rate. Returns null if not found. */
const updateRate = async (id, perMinuteRate) => {
  const rate = Number(perMinuteRate);
  if (Number.isNaN(rate) || rate < 0) {
    throw {
      statusCode: 422,
      message: 'perMinuteRate must be a positive number',
    };
  }
  const professional = await Professional.findByPk(id);
  if (!professional) return null;
  await professional.update({ perMinuteRate: rate });
  return professional.get({ plain: true });
};

/** Get all reviews tied to a professional. Returns null if professional missing. */
const getReviews = async (id) => {
  const professional = await Professional.findByPk(id);
  if (!professional) return null;
  return Review.findAll({ where: { professionalId: id }, raw: true });
};

/** Get a professional's availability slots. Returns null if not found. */
const getAvailability = async (id) => {
  const professional = await Professional.findByPk(id, { raw: true });
  if (!professional) return null;
  return {
    professionalId: professional.id,
    availableNow: professional.availableNow,
    availabilitySlots: professional.availabilitySlots,
  };
};

module.exports = {
  paginate,
  list,
  getById,
  search,
  updateAvailability,
  updateRate,
  getReviews,
  getAvailability,
};
