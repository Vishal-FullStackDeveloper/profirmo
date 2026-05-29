const express = require('express');
const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateBody } = require('../middleware/validateRequest');

const router = express.Router();

// All booking routes require an authenticated user.
router.use(authenticate);

router.get('/', bookingController.listBookings);

// Caller-scoped routes — must come before /:id.
router.get('/mine', bookingController.getMyBookings);
router.get('/mine-as-professional', bookingController.getMyAssignedBookings);

router.get('/client/:clientId', bookingController.getBookingsByClient);
router.get(
  '/professional/:professionalId',
  bookingController.getBookingsByProfessional
);

router.post(
  '/',
  validateBody({
    professionalId: 'required',
    duration: 'required|number',
  }),
  bookingController.createBooking
);

router.get('/:id', bookingController.getBooking);
router.patch(
  '/:id/status',
  validateBody({ status: 'required' }),
  bookingController.updateBookingStatus
);

// Booking detail page (client + pro shared) + notes + case conversion.
router.get('/:id/detail', bookingController.getBookingDetail);
// Notes can be body-only, attachments-only, or both. Service validates.
router.post('/:id/notes', bookingController.addBookingNote);
router.post(
  '/:id/convert-to-case',
  bookingController.convertBookingToCase
);

module.exports = router;
