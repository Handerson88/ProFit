const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');

router.post('/create', authMiddleware, paymentController.createPayment);
router.get('/status/:id', authMiddleware, paymentController.getPaymentStatus);

module.exports = router;
