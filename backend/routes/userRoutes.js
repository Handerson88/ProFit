const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const subscriptionMiddleware = require('../middleware/subscriptionMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for Profile Photos (Memory Storage for Vercel)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

const preferenceController = require('../controllers/preferenceController');
const couponController = require('../controllers/couponController');

router.get('/profile', authMiddleware, userController.getProfile);
router.get('/dashboard-bootstrap', authMiddleware, subscriptionMiddleware, userController.getDashboardBootstrap);
router.put('/update', authMiddleware, userController.updateProfile);
router.post('/quiz', authMiddleware, userController.submitQuiz);
router.post('/photo-upload', authMiddleware, subscriptionMiddleware, upload.single('photo'), userController.updateProfilePhoto);
router.put('/notifications', authMiddleware, userController.updateNotificationSettings);
router.put('/funnel-step', authMiddleware, userController.updateFunnelStep);

// Coupons
router.post('/coupons/validate', authMiddleware, couponController.validateCoupon);

// Preferences
router.get('/preferences', authMiddleware, subscriptionMiddleware, preferenceController.getPreferences);
router.put('/preferences', authMiddleware, subscriptionMiddleware, preferenceController.updatePreferences);
router.get('/referrals', authMiddleware, subscriptionMiddleware, userController.getReferralStats);
router.get('/app-status', authMiddleware, userController.getAppStatus);

module.exports = router;
