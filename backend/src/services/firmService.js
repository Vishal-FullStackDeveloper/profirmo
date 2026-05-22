const { Op } = require('sequelize');
const {
  Firm,
  Professional,
  Case,
  Client,
} = require('../models');
const { paginate } = require('./professionalService');

/**
 * List firms with optional filters and pagination.
 * Supported filters: name, city, firmType.
 * @returns {Promise<{ items, page, limit, total }>}
 */
const list = async ({ filters = {}, page, limit } = {}) => {
  const { page: p, limit: l, offset } = paginate(page, limit);
  const where = {};

  if (filters.name) {
    where.name = { [Op.like]: `%${String(filters.name)}%` };
  }
  if (filters.firmType) {
    where.firmType = String(filters.firmType);
  }

  let { rows, count } = await Firm.findAndCountAll({
    where,
    limit: l,
    offset,
    raw: true,
  });

  if (filters.city) {
    const q = String(filters.city).toLowerCase();
    rows = rows.filter((f) => (f.city || '').toLowerCase() === q);
  }

  return { items: rows, page: p, limit: l, total: count };
};

/** Find a firm by id, or null when not found. */
const getById = async (id) => {
  const firm = await Firm.findByPk(id, { raw: true });
  return firm || null;
};

/** Get all professionals belonging to a firm. Returns null if firm missing. */
const getProfessionals = async (firmId) => {
  const firm = await Firm.findByPk(firmId);
  if (!firm) return null;
  return Professional.findAll({ where: { firmId }, raw: true });
};

/**
 * Add a new professional under a firm. Creates the Professional record,
 * links it to the firm and updates the firm's professional list/count.
 * Returns null if the firm does not exist.
 */
const addProfessional = async (firmId, data = {}) => {
  const firm = await Firm.findByPk(firmId);
  if (!firm) return null;

  const professional = await Professional.create({
    name: data.name,
    email: (data.email || '').toLowerCase(),
    phone: data.phone,
    professionType: data.professionType,
    specialization: data.specialization,
    city: data.city || firm.city,
    experience: Number(data.experience) || 0,
    languages: Array.isArray(data.languages) ? data.languages : [],
    perMinuteRate: Number(data.perMinuteRate) || 0,
    bio: data.bio,
    registrationNumber: data.registrationNumber,
    firmId: firm.id,
    servicesOffered: Array.isArray(data.servicesOffered)
      ? data.servicesOffered
      : [],
    verified: true,
    status: 'approved',
  });

  const professionalIds = Array.isArray(firm.professionalIds)
    ? [...firm.professionalIds, professional.id]
    : [professional.id];
  await firm.update({
    professionalIds,
    professionalCount: professionalIds.length,
  });

  return professional.get({ plain: true });
};

/**
 * Get clients linked to a firm through cases handled by that firm or by
 * its professionals. Returns null if the firm does not exist.
 */
const getClients = async (firmId) => {
  const firm = await Firm.findByPk(firmId);
  if (!firm) return null;

  const firmProfessionals = await Professional.findAll({
    where: { firmId },
    attributes: ['id'],
    raw: true,
  });
  const firmProfessionalIds = firmProfessionals.map((p) => p.id);

  const relatedCases = await Case.findAll({
    where: {
      [Op.or]: [
        { firmId },
        { professionalId: { [Op.in]: firmProfessionalIds } },
      ],
    },
    attributes: ['clientId'],
    raw: true,
  });
  const clientIds = [
    ...new Set(relatedCases.map((c) => c.clientId).filter(Boolean)),
  ];

  if (clientIds.length === 0) return [];
  return Client.findAll({ where: { id: { [Op.in]: clientIds } }, raw: true });
};

/**
 * Get all cases handled by a firm or its professionals.
 * Returns null if the firm does not exist.
 */
const getCases = async (firmId) => {
  const firm = await Firm.findByPk(firmId);
  if (!firm) return null;

  const firmProfessionals = await Professional.findAll({
    where: { firmId },
    attributes: ['id'],
    raw: true,
  });
  const firmProfessionalIds = firmProfessionals.map((p) => p.id);

  return Case.findAll({
    where: {
      [Op.or]: [
        { firmId },
        { professionalId: { [Op.in]: firmProfessionalIds } },
      ],
    },
    raw: true,
  });
};

module.exports = {
  list,
  getById,
  getProfessionals,
  addProfessional,
  getClients,
  getCases,
};
