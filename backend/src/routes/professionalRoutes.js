const express = require('express');
const professionalController = require('../controllers/professionalController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateBody } = require('../middleware/validateRequest');

const router = express.Router();

// Public listing and search.
router.get('/', professionalController.listProfessionals);

// NOTE: /search must be declared before /:id so it is not shadowed.
router.get('/search', professionalController.searchProfessionals);

// Distinct filter values (cities, types, specializations, languages) drawn
// from live data. Declared before /:id so the literal path is not shadowed.
router.get('/filter-options', professionalController.getFilterOptions);

// Phase 7: resubmit a rejected / info-requested professional application.
// Declared before /:id so the literal path is not shadowed by the param.
router.post(
  '/resubmit',
  authenticate,
  authorize('professional'),
  professionalController.resubmitApplication
);

router.get('/:id', professionalController.getProfessional);
router.get('/:id/reviews', professionalController.getProfessionalReviews);
router.get(
  '/:id/availability',
  professionalController.getProfessionalAvailability
);

// Protected: professionals (and firm staff) manage their own availability/rate.
router.patch(
  '/:id/availability',
  authenticate,
  authorize('professional', 'firm'),
  validateBody({ availableNow: 'required' }),
  professionalController.updateAvailability
);

router.patch(
  '/:id/rate',
  authenticate,
  authorize('professional', 'firm'),
  validateBody({ perMinuteRate: 'required|number' }),
  professionalController.updateRate
);

module.exports = router;
