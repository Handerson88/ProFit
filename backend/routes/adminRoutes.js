const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const workoutController = require('../controllers/workoutController');
const adminNotificationController = require('../controllers/adminNotificationController');
const billingController = require('../controllers/billingController');
const adminMiddleware = require('../middleware/adminMiddleware');
const adminPreferenceController = require('../controllers/adminPreferenceController');
const influencerController = require('../controllers/influencerController');

const adminCommunicationController = require('../controllers/adminCommunicationController');
const couponController = require('../controllers/couponController');

// Public Admin Auth
router.post('/login', adminController.login);

// Protected Admin Routes
router.use(adminMiddleware);

router.get('/dashboard', adminController.getDashboardData);
router.get('/users/activity', adminController.getUsersActivity);
router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.get('/users/export', adminController.exportUsers);
router.get('/admins', adminController.getAdmins);
router.post('/users/status/:id', adminController.toggleUserStatus);
router.put('/users/limits/:id', adminController.updateUserScanLimit);
router.post('/users/invite', adminController.inviteUser);
router.get('/users/:id', adminController.getUserDetails);
router.delete('/users/:id', adminController.deleteUser);
router.get('/foods', adminController.getFoods);
router.put('/foods/:id', adminController.updateFood);
router.delete('/foods/:id', adminController.deleteFood);
router.get('/plans', adminController.getPlans);
router.get('/logs', adminController.getLogs);
router.get('/ai-foods', adminController.getAIDetectedFoods);
router.post('/ai-foods/migrate', adminController.migrateAIDetectedFoods);

// Coupons
router.get('/coupons', couponController.listCoupons);
router.post('/coupons', couponController.createCoupon);
router.post('/coupons/toggle/:id', couponController.toggleCouponStatus);
router.get('/coupons/influencer-stats', couponController.getInfluencerStats);

// Scanned Dishes
router.get('/scanned-dishes', adminController.getScannedDishes);
router.put('/scanned-dishes/:id', adminController.updateScannedDish);
router.delete('/scanned-dishes/:id', adminController.deleteScannedDish);

// MRR
router.get('/mrr/stats', adminController.getMRRStats);
router.get('/mrr/chart', adminController.getMRRChart);
router.get('/funnel-stats', adminController.getFunnelStats);

// Influencers
router.post('/influencers/invite', influencerController.inviteInfluencer);

// Workouts
router.get('/workouts/activity', adminController.getWorkoutActivity);
router.get('/workouts/stats', adminController.getWorkoutDashboardStats);
router.get('/workouts/session/:id', adminController.getWorkoutSessionDetails);
router.post('/workouts/migrate', workoutController.migrateWorkoutsToDatabase);

// Notifications
router.post('/notifications/send', adminNotificationController.sendNotification);
router.post('/notifications/test-automated', adminNotificationController.testAutomatedPush);
router.get('/notifications', adminNotificationController.getNotifications);
router.get('/notifications/templates', adminNotificationController.getTemplates);
router.post('/notifications/schedule', adminNotificationController.scheduleNotification);
router.get('/notifications/scheduled', adminNotificationController.getScheduledNotifications);
router.delete('/notifications/scheduled/:id', adminNotificationController.deleteScheduledNotification);

// Preferences
router.get('/preferences', adminPreferenceController.getPreferences);
router.put('/preferences', adminPreferenceController.updatePreferences);

// Billing
router.post('/billing/send-email', billingController.sendManualBillingEmail);
router.get('/billing/status', billingController.getBillingStatus);

// Unified Communication
router.post('/communication/send', adminCommunicationController.sendManualCommunication);
router.post('/communication/schedule', adminCommunicationController.scheduleCommunication);
router.get('/communication/scheduled', adminCommunicationController.getScheduledCommunications);
router.delete('/communication/scheduled/:id', adminCommunicationController.deleteScheduledCommunication);
router.get('/communication/history', adminCommunicationController.getHistory);

module.exports = router;
