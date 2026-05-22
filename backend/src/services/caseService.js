const { Op } = require('sequelize');
const { Case, File } = require('../models');
const { paginate } = require('./professionalService');

// Attach the related `files` array to a plain case object so JSON responses
// keep the same shape the frontend expects.
const withFiles = async (caseObj) => {
  if (!caseObj) return caseObj;
  const files = await File.findAll({
    where: { caseId: caseObj.id },
    raw: true,
  });
  return { ...caseObj, files };
};

// Persist an array of file descriptors as File rows for a given case.
const saveFiles = async (caseId, files) => {
  if (!Array.isArray(files) || files.length === 0) return;
  const rows = files.map((f) => ({
    ...(f.id ? { id: f.id } : {}),
    caseId,
    name: f.name || '',
    size: f.size === undefined || f.size === null ? '' : String(f.size),
    type: f.type || 'application/octet-stream',
    uploadedAt: f.uploadedAt || new Date().toISOString(),
  }));
  await File.bulkCreate(rows);
};

/**
 * List cases with optional filters and pagination.
 * Supported filters: status, category, clientId, professionalId, firmId.
 * @returns {Promise<{ items, page, limit, total }>}
 */
const list = async ({ filters = {}, page, limit } = {}) => {
  const { page: p, limit: l, offset } = paginate(page, limit);
  const where = {};

  if (filters.status) where.status = String(filters.status);
  if (filters.category) where.category = String(filters.category);
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.professionalId) where.professionalId = filters.professionalId;
  if (filters.firmId) where.firmId = filters.firmId;

  const { rows, count } = await Case.findAndCountAll({
    where,
    limit: l,
    offset,
    raw: true,
  });

  const items = await Promise.all(rows.map(withFiles));
  return { items, page: p, limit: l, total: count };
};

/** Find a case by id (with files), or null when not found. */
const getById = async (id) => {
  const found = await Case.findByPk(id, { raw: true });
  if (!found) return null;
  return withFiles(found);
};

/** Create a new case record (and any embedded files). */
const create = async (data = {}) => {
  const newCase = await Case.create({
    clientId: data.clientId,
    professionalId: data.professionalId,
    firmId: data.firmId || null,
    title: data.title,
    category: data.category,
    status: data.status || 'open',
    description: data.description,
  });

  if (Array.isArray(data.files) && data.files.length > 0) {
    await saveFiles(newCase.id, data.files);
  }

  return withFiles(newCase.get({ plain: true }));
};

/** Update an existing case record. Returns null when not found. */
const update = async (id, data = {}) => {
  const found = await Case.findByPk(id);
  if (!found) return null;

  const updatable = [
    'professionalId',
    'firmId',
    'title',
    'category',
    'status',
    'description',
  ];
  const changes = {};
  updatable.forEach((field) => {
    if (data[field] !== undefined) changes[field] = data[field];
  });
  await found.update(changes);

  // If a files array is supplied, replace the case's file rows.
  if (data.files !== undefined) {
    await File.destroy({ where: { caseId: id } });
    await saveFiles(id, Array.isArray(data.files) ? data.files : []);
  }

  return withFiles(found.get({ plain: true }));
};

/** Delete a case record (and its files). Returns the removed case or null. */
const remove = async (id) => {
  const found = await Case.findByPk(id, { raw: true });
  if (!found) return null;
  const removed = await withFiles(found);
  await File.destroy({ where: { caseId: id } });
  await Case.destroy({ where: { id } });
  return removed;
};

/** Get all cases for a given client (with files). */
const getByClient = async (clientId) => {
  const rows = await Case.findAll({ where: { clientId }, raw: true });
  return Promise.all(rows.map(withFiles));
};

/** Get all cases for a given professional (with files). */
const getByProfessional = async (professionalId) => {
  const rows = await Case.findAll({
    where: { professionalId },
    raw: true,
  });
  return Promise.all(rows.map(withFiles));
};

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  getByClient,
  getByProfessional,
};
