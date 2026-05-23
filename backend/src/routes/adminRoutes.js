const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// All admin routes require an authenticated platform_admin.
router.use(authenticate, authorize('platform_admin'));

router.get('/stats', adminController.getStats);
router.get('/overview', adminController.getOverview);
router.get('/users', adminController.listUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);

// --- Phase 7: professional approval workflow ------------------------------
// /pending and the legacy-Professional approve route are declared BEFORE the
// /:approvalId param route so they are not shadowed by it.
router.get(
  '/professionals/pending',
  adminController.listPendingApprovals
);
// Legacy Professional-table approval (kept for back-compat).
router.patch(
  '/professionals/:id/approve',
  adminController.approveProfessional
);
router.post(
  '/professionals/:approvalId/approve',
  adminController.approveProfessionalApplication
);
router.post(
  '/professionals/:approvalId/reject',
  adminController.rejectProfessionalApplication
);
router.post(
  '/professionals/:approvalId/request-info',
  adminController.requestProfessionalInfo
);
router.get(
  '/professionals/:approvalId',
  adminController.getProfessionalApproval
);

// --- Phase 8: firm approval workflow --------------------------------------
// /firms/pending is declared BEFORE /firms/:approvalId so it is not shadowed
// by the param route. The legacy GET /firms (Firm table) is kept untouched.
router.get('/firms/pending', adminController.listPendingFirms);
router.get('/firms', adminController.listFirms);
router.post(
  '/firms/:approvalId/approve',
  adminController.approveFirmApplication
);
router.post(
  '/firms/:approvalId/reject',
  adminController.rejectFirmApplication
);
router.post(
  '/firms/:approvalId/request-modifications',
  adminController.requestFirmModifications
);
router.get('/firms/:approvalId', adminController.getFirmApproval);

router.get('/bookings', adminController.listBookings);
router.get('/audit-logs', adminController.listAuditLogs);

// --- Reviews & review appeals ---------------------------------------------
// Only an admin can change or delete reviews, and resolve appeals.
router.get('/reviews', adminController.listReviews);
router.patch('/reviews/:id', adminController.updateReview);
router.delete('/reviews/:id', adminController.deleteReview);
router.get('/review-appeals', adminController.listReviewAppeals);
router.post(
  '/review-appeals/:id/resolve',
  adminController.resolveReviewAppeal
);

module.exports = router;
