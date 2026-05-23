const express = require('express');
const firmJoinController = require('../controllers/firmJoinController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Every firm-join route requires an authenticated user.
router.use(authenticate);

// Professional side.
router.get('/membership', firmJoinController.getMyMembership);
router.get('/joinable', firmJoinController.listJoinable);
router.get('/requests/mine', firmJoinController.listMyRequests);
router.post('/requests', firmJoinController.requestJoin);
router.post('/requests/:id/cancel', firmJoinController.cancelRequest);
router.post('/leave', firmJoinController.leaveFirm);

// Firm owner / co-owner side.
router.get('/requests/firm', firmJoinController.listFirmRequests);
router.post('/requests/:id/decide', firmJoinController.decideRequest);

module.exports = router;
