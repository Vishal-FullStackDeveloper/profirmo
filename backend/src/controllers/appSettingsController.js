const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/responseHandler');
const { logAudit } = require('../utils/auditLogger');
const svc = require('../services/appSettingsService');

// --- Public read endpoints ------------------------------------------------

const publicListCategories = asyncHandler(async (req, res) => {
  const categories = await svc.listCategoriesPublic();
  return successResponse(res, 200, 'Categories fetched', categories);
});

const publicListCities = asyncHandler(async (req, res) => {
  const cities = await svc.listCitiesPublic();
  return successResponse(res, 200, 'Cities fetched', cities);
});

// --- Admin: categories ----------------------------------------------------

const adminListCategories = asyncHandler(async (req, res) => {
  const rows = await svc.listCategoriesAdmin({ search: req.query.search });
  return successResponse(res, 200, 'Categories fetched', rows);
});

const adminCreateCategory = asyncHandler(async (req, res) => {
  const adminId = req.user.id || req.user.sub;
  const cat = await svc.createCategory(req.body || {});
  await logAudit({
    req,
    userId: adminId,
    action: 'admin.category_created',
    entity: 'category',
    entityId: cat.id,
    status: 'success',
    metadata: { name: cat.name },
  });
  return successResponse(res, 201, 'Category created', cat);
});

const adminUpdateCategory = asyncHandler(async (req, res) => {
  const adminId = req.user.id || req.user.sub;
  const cat = await svc.updateCategory(req.params.id, req.body || {});
  await logAudit({
    req,
    userId: adminId,
    action: 'admin.category_updated',
    entity: 'category',
    entityId: req.params.id,
    status: 'success',
    metadata: { fields: Object.keys(req.body || {}) },
  });
  return successResponse(res, 200, 'Category updated', cat);
});

const adminDeleteCategory = asyncHandler(async (req, res) => {
  const adminId = req.user.id || req.user.sub;
  const result = await svc.deleteCategory(req.params.id);
  await logAudit({
    req,
    userId: adminId,
    action: 'admin.category_deleted',
    entity: 'category',
    entityId: req.params.id,
    status: 'success',
    metadata: {},
  });
  return successResponse(res, 200, 'Category deleted', result);
});

// --- Admin: sub-categories ------------------------------------------------

const adminCreateSubCategory = asyncHandler(async (req, res) => {
  const adminId = req.user.id || req.user.sub;
  const sub = await svc.createSubCategory(req.body || {});
  await logAudit({
    req,
    userId: adminId,
    action: 'admin.sub_category_created',
    entity: 'sub_category',
    entityId: sub.id,
    status: 'success',
    metadata: { name: sub.name, categoryId: sub.categoryId },
  });
  return successResponse(res, 201, 'Sub-category created', sub);
});

const adminUpdateSubCategory = asyncHandler(async (req, res) => {
  const adminId = req.user.id || req.user.sub;
  const sub = await svc.updateSubCategory(req.params.id, req.body || {});
  await logAudit({
    req,
    userId: adminId,
    action: 'admin.sub_category_updated',
    entity: 'sub_category',
    entityId: req.params.id,
    status: 'success',
    metadata: { fields: Object.keys(req.body || {}) },
  });
  return successResponse(res, 200, 'Sub-category updated', sub);
});

const adminDeleteSubCategory = asyncHandler(async (req, res) => {
  const adminId = req.user.id || req.user.sub;
  const result = await svc.deleteSubCategory(req.params.id);
  await logAudit({
    req,
    userId: adminId,
    action: 'admin.sub_category_deleted',
    entity: 'sub_category',
    entityId: req.params.id,
    status: 'success',
    metadata: {},
  });
  return successResponse(res, 200, 'Sub-category deleted', result);
});

// --- Admin: cities --------------------------------------------------------

const adminListCities = asyncHandler(async (req, res) => {
  const rows = await svc.listCitiesAdmin({ search: req.query.search });
  return successResponse(res, 200, 'Cities fetched', rows);
});

const adminCreateCity = asyncHandler(async (req, res) => {
  const adminId = req.user.id || req.user.sub;
  const city = await svc.createCity(req.body || {});
  await logAudit({
    req,
    userId: adminId,
    action: 'admin.city_created',
    entity: 'city',
    entityId: city.id,
    status: 'success',
    metadata: { name: city.name },
  });
  return successResponse(res, 201, 'City created', city);
});

const adminUpdateCity = asyncHandler(async (req, res) => {
  const adminId = req.user.id || req.user.sub;
  const city = await svc.updateCity(req.params.id, req.body || {});
  await logAudit({
    req,
    userId: adminId,
    action: 'admin.city_updated',
    entity: 'city',
    entityId: req.params.id,
    status: 'success',
    metadata: { fields: Object.keys(req.body || {}) },
  });
  return successResponse(res, 200, 'City updated', city);
});

const adminDeleteCity = asyncHandler(async (req, res) => {
  const adminId = req.user.id || req.user.sub;
  const result = await svc.deleteCity(req.params.id);
  await logAudit({
    req,
    userId: adminId,
    action: 'admin.city_deleted',
    entity: 'city',
    entityId: req.params.id,
    status: 'success',
    metadata: {},
  });
  return successResponse(res, 200, 'City deleted', result);
});

module.exports = {
  publicListCategories,
  publicListCities,
  adminListCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminCreateSubCategory,
  adminUpdateSubCategory,
  adminDeleteSubCategory,
  adminListCities,
  adminCreateCity,
  adminUpdateCity,
  adminDeleteCity,
};
