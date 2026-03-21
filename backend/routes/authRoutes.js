const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/invite/:token', authController.getInviteDetail);
router.post('/invite/activate', authController.activateInvite);
router.post('/invite/create', authMiddleware, authController.createInvite);
router.get('/verify', authMiddleware, authController.verifyToken);

module.exports = router;
