const express = require('express');
const payoutController = require('../controllers/payoutController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticate);

router.get('/me/available', payoutController.getAvailable);
router.get('/mine', payoutController.listMine);
router.post('/mine', payoutController.createMine);

module.exports = router;
