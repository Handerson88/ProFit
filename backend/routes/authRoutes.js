const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const influencerController = require('../controllers/influencerController');
const authMiddleware = require('../middleware/auth');

router.get('/promotion-status', authController.getPromotionStatus);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/invite/:token', authController.getInviteDetail);
router.post('/invite/activate', authController.activateInvite);
router.post('/invite/create', authMiddleware, authController.createInvite);
router.get('/verify', authMiddleware, authController.verifyToken);

// Influencer Routes
router.get('/influencer/verify', influencerController.verifyInviteToken);
router.post('/influencer/accept', influencerController.acceptInvite);

module.exports = router;
