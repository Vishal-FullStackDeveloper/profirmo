// Razorpay payment endpoints.
// /webhook is mounted at the app level with express.raw so the signature
// validator can hash the raw body; the rest of the routes use the regular
// JSON body parser through the global middleware.

const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// All non-webhook payment endpoints require an authenticated user.
router.use(authenticate);

router.post('/orders', paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);
router.get('/mine', paymentController.listMine);
router.get('/:id', paymentController.getPayment);

module.exports = router;
