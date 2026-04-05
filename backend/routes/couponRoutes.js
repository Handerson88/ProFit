const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const authMiddleware = require('../middleware/auth');

// Public access for checkout (requires user auth)
router.post('/validate', authMiddleware, couponController.validateCoupon);

module.exports = router;
