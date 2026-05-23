const professionalService = require('../services/professionalService');
const professionalRegistrationService = require('../services/professionalRegistrationService');
const asyncHandler = require('../utils/asyncHandler');
const {
  successResponse,
  paginatedResponse,
} = require('../utils/responseHandler');
const { logAudit } = require('../utils/auditLogger');

// GET /api/professionals
const listProfessionals = asyncHandler(async (req, res) => {
  const { page, limit, ...filters } = req.query;
  const { items, ...meta } = await professionalService.list({
    filters,
    page,
    limit,
  });
  return paginatedResponse(res, 'Professionals fetched', items, meta);
});

// GET /api/professionals/filter-options
const getFilterOptions = asyncHandler(async (req, res) => {
  const options = await professionalService.filterOptions();
  return successResponse(res, 200, 'Filter options fetched', options);
});

// GET /api/professionals/search
const searchProfessionals = asyncHandler(async (req, res) => {
  const results = await professionalService.search(
    req.query.q || req.query.query
  );
  return successResponse(res, 200, 'Search results', results);
});

// GET /api/professionals/:id
const getProfessional = asyncHandler(async (req, res) => {
  const professional = await professionalService.getById(req.params.id);
  if (!professional) {
    throw {
      statusCode: 404,
      message: `Professional not found: ${req.params.id}`,
    };
  }
  return successResponse(res, 200, 'Professional fetched', professional);
});

// GET /api/professionals/:id/reviews
const getProfessionalReviews = asyncHandler(async (req, res) => {
  const reviews = await professionalService.getReviews(req.params.id);
  if (reviews === null) {
    throw {
      statusCode: 404,
      message: `Professional not found: ${req.params.id}`,
    };
  }
  return successResponse(res, 200, 'Professional reviews fetched', reviews);
});

// GET /api/professionals/:id/availability
const getProfessionalAvailability = asyncHandler(async (req, res) => {
  const availability = await professionalService.getAvailability(
    req.params.id
  );
  if (!availability) {
    throw {
      statusCode: 404,
      message: `Professional not found: ${req.params.id}`,
    };
  }
  return successResponse(
    res,
    200,
    'Professional availability fetched',
    availability
  );
});

// PATCH /api/professionals/:id/availability
const updateAvailability = asyncHandler(async (req, res) => {
  const professional = await professionalService.updateAvailability(
    req.params.id,
    req.body.availableNow
  );
  if (!professional) {
    throw {
      statusCode: 404,
      message: `Professional not found: ${req.params.id}`,
    };
  }
  return successResponse(res, 200, 'Availability updated', professional);
});

// PATCH /api/professionals/:id/rate
const updateRate = asyncHandler(async (req, res) => {
  const professional = await professionalService.updateRate(
    req.params.id,
    req.body.perMinuteRate
  );
  if (!professional) {
    throw {
      statusCode: 404,
      message: `Professional not found: ${req.params.id}`,
    };
  }
  return successResponse(res, 200, 'Per-minute rate updated', professional);
});

// POST /api/professionals/resubmit
// Phase 7: a rejected / info-requested professional updates their details and
// resubmits their application for another admin review.
const resubmitApplication = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user.sub;
  const result = await professionalRegistrationService.resubmitApplication(
    userId,
    req.body || {}
  );
  await logAudit({
    req,
    userId,
    action: 'professional.resubmit',
    entity: 'professional_approval',
    status: 'success',
    metadata: { resubmissionCount: result.resubmissionCount },
  });
  return successResponse(
    res,
    200,
    'Application resubmitted. Your profile is pending admin approval.',
    result
  );
});

module.exports = {
  listProfessionals,
  getFilterOptions,
  searchProfessionals,
  getProfessional,
  getProfessionalReviews,
  getProfessionalAvailability,
  updateAvailability,
  updateRate,
  resubmitApplication,
};
