const clientService = require('../services/clientService');
const asyncHandler = require('../utils/asyncHandler');
const {
  successResponse,
  paginatedResponse,
} = require('../utils/responseHandler');

const notFound = (id) => ({
  statusCode: 404,
  message: `Client not found: ${id}`,
});

// GET /api/clients
const listClients = asyncHandler(async (req, res) => {
  const { page, limit, ...filters } = req.query;
  const { items, ...meta } = await clientService.list({
    filters,
    page,
    limit,
  });
  return paginatedResponse(res, 'Clients fetched', items, meta);
});

// GET /api/clients/:id
const getClient = asyncHandler(async (req, res) => {
  const client = await clientService.getById(req.params.id);
  if (!client) throw notFound(req.params.id);
  return successResponse(res, 200, 'Client fetched', client);
});

// POST /api/clients
const createClient = asyncHandler(async (req, res) => {
  const client = await clientService.create(req.body);
  return successResponse(res, 201, 'Client created', client);
});

// PATCH /api/clients/:id
const updateClient = asyncHandler(async (req, res) => {
  const client = await clientService.update(req.params.id, req.body);
  if (!client) throw notFound(req.params.id);
  return successResponse(res, 200, 'Client updated', client);
});

module.exports = { listClients, getClient, createClient, updateClient };
