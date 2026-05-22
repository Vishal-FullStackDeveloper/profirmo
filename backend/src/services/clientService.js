const { Op } = require('sequelize');
const { Client } = require('../models');
const { paginate } = require('./professionalService');

/**
 * List clients with optional filters and pagination.
 * Supported filters: name, city, userType.
 * @returns {Promise<{ items, page, limit, total }>}
 */
const list = async ({ filters = {}, page, limit } = {}) => {
  const { page: p, limit: l, offset } = paginate(page, limit);
  const where = {};

  if (filters.name) {
    where.name = { [Op.like]: `%${String(filters.name)}%` };
  }
  if (filters.userType) {
    where.userType = String(filters.userType);
  }

  let { rows, count } = await Client.findAndCountAll({
    where,
    limit: l,
    offset,
    raw: true,
  });

  if (filters.city) {
    const q = String(filters.city).toLowerCase();
    rows = rows.filter((c) => (c.city || '').toLowerCase() === q);
  }

  return { items: rows, page: p, limit: l, total: count };
};

/** Find a client by id, or null when not found. */
const getById = async (id) => {
  const client = await Client.findByPk(id, { raw: true });
  return client || null;
};

/** Create a new client record. */
const create = async (data = {}) => {
  const client = await Client.create({
    name: data.name,
    email: (data.email || '').toLowerCase(),
    phone: data.phone,
    city: data.city,
    userType: data.userType || 'individual',
  });
  return client.get({ plain: true });
};

/** Update an existing client record. Returns null when not found. */
const update = async (id, data = {}) => {
  const client = await Client.findByPk(id);
  if (!client) return null;

  const updatable = ['name', 'email', 'phone', 'city', 'userType'];
  const changes = {};
  updatable.forEach((field) => {
    if (data[field] !== undefined) {
      changes[field] =
        field === 'email' ? String(data[field]).toLowerCase() : data[field];
    }
  });
  await client.update(changes);
  return client.get({ plain: true });
};

module.exports = { list, getById, create, update };
