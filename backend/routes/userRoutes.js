const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
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

router.get('/profile', authMiddleware, userController.getProfile);
router.put('/update', authMiddleware, userController.updateProfile);
router.post('/quiz', authMiddleware, userController.submitQuiz);
router.post('/photo-upload', authMiddleware, upload.single('photo'), userController.updateProfilePhoto);
router.put('/notifications', authMiddleware, userController.updateNotificationSettings);

// Preferences
router.get('/preferences', authMiddleware, preferenceController.getPreferences);
router.put('/preferences', authMiddleware, preferenceController.updatePreferences);
router.get('/referrals', authMiddleware, userController.getReferralStats);
router.get('/app-status', authMiddleware, userController.getAppStatus);

module.exports = router;
