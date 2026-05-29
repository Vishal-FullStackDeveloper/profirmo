// adminSettingsController — admin-only CRUD over the AdminSetting key/value
// store. The setting registry lives in adminSettingsService; this controller
// is a thin HTTP layer with audit logging.

const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/responseHandler');
const adminSettingsService = require('../services/adminSettingsService');
const { logAudit } = require('../utils/auditLogger');

// GET /api/admin/settings
const list = asyncHandler(async (req, res) => {
  const items = await adminSettingsService.listAll();
  return successResponse(res, 200, 'Admin settings', { items });
});

// PATCH /api/admin/settings/:key  body: { value }
const update = asyncHandler(async (req, res) => {
  const adminId = req.user && req.user.id;
  const newValue = await adminSettingsService.set(
    req.params.key,
    req.body && req.body.value,
    adminId
  );
  await logAudit({
    req,
    userId: adminId,
    action: 'admin.setting_updated',
    entity: 'admin_setting',
    entityId: req.params.key,
    status: 'success',
    metadata: { value: newValue },
  });
  return successResponse(res, 200, 'Setting updated', {
    key: req.params.key,
    value: newValue,
  });
});

module.exports = { list, update };
