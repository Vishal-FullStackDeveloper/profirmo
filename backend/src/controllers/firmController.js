const firmService = require('../services/firmService');
const asyncHandler = require('../utils/asyncHandler');
const {
  successResponse,
  paginatedResponse,
} = require('../utils/responseHandler');

const notFound = (id) => ({
  statusCode: 404,
  message: `Firm not found: ${id}`,
});

// GET /api/firms
const listFirms = asyncHandler(async (req, res) => {
  const { page, limit, ...filters } = req.query;
  const { items, ...meta } = await firmService.list({ filters, page, limit });
  return paginatedResponse(res, 'Firms fetched', items, meta);
});

// GET /api/firms/:id
const getFirm = asyncHandler(async (req, res) => {
  const firm = await firmService.getById(req.params.id);
  if (!firm) throw notFound(req.params.id);
  return successResponse(res, 200, 'Firm fetched', firm);
});

// GET /api/firms/:id/professionals
const getFirmProfessionals = asyncHandler(async (req, res) => {
  const professionals = await firmService.getProfessionals(req.params.id);
  if (professionals === null) throw notFound(req.params.id);
  return successResponse(res, 200, 'Firm professionals fetched', professionals);
});

// POST /api/firms/:id/professionals
const addFirmProfessional = asyncHandler(async (req, res) => {
  const professional = await firmService.addProfessional(
    req.params.id,
    req.body
  );
  if (!professional) throw notFound(req.params.id);
  return successResponse(res, 201, 'Professional added to firm', professional);
});

// GET /api/firms/:id/clients
const getFirmClients = asyncHandler(async (req, res) => {
  const clients = await firmService.getClients(req.params.id);
  if (clients === null) throw notFound(req.params.id);
  return successResponse(res, 200, 'Firm clients fetched', clients);
});

// GET /api/firms/:id/cases
const getFirmCases = asyncHandler(async (req, res) => {
  const cases = await firmService.getCases(req.params.id);
  if (cases === null) throw notFound(req.params.id);
  return successResponse(res, 200, 'Firm cases fetched', cases);
});

module.exports = {
  listFirms,
  getFirm,
  getFirmProfessionals,
  addFirmProfessional,
  getFirmClients,
  getFirmCases,
};
