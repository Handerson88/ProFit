const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');

// Route to initiate payment from the frontend checkout (Public for guests/leads)
router.post('/initiate', paymentController.initiatePayment);

// Route to get payment status (polling)
router.get('/status/:transactionId', paymentController.getStatus);

// Webhook for gateway to call (public, but in prod should have signature validation)
router.post('/webhook', paymentController.webhook);

module.exports = router;
