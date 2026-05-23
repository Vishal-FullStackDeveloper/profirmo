const express = require('express');
const profileController = require('../controllers/profileController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// All profile routes require an authenticated user.
router.use(authenticate);

// Current user's complete profile.
router.get('/', profileController.getProfile);

// Update personal info + address.
router.put('/', profileController.updateProfile);

// Upsert professional details (professionals + firm professionals only).
router.put(
  '/professional',
  authorize('professional', 'firm_professional'),
  profileController.updateProfessionalProfile
);

module.exports = router;
