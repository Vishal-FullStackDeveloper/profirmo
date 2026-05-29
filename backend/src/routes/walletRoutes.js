const express = require('express');
const walletController = require('../controllers/walletController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticate);

router.get('/summary', walletController.getSummary);
router.get('/transactions', walletController.listTransactions);

module.exports = router;
