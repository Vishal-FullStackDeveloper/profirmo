const profileService = require('../services/profileService');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/responseHandler');

// GET /api/profile — the current user's complete profile.
const getProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getCompleteProfile(req.user.id);
  return successResponse(res, 200, 'Profile fetched', profile);
});

// PUT /api/profile — update personal info + address.
const updateProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.updateProfile(
    req.user.id,
    req.body
  );
  return successResponse(res, 200, 'Profile updated', profile);
});

// PUT /api/profile/professional — upsert professional details.
const updateProfessionalProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.updateProfessionalProfile(
    req.user.id,
    req.body
  );
  return successResponse(
    res,
    200,
    'Professional profile updated',
    profile
  );
});

module.exports = {
  getProfile,
  updateProfile,
  updateProfessionalProfile,
};
