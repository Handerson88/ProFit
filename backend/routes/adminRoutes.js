const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminNotificationController = require('../controllers/adminNotificationController');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public Admin Auth
router.post('/login', adminController.login);

// Protected Admin Routes
router.use(adminMiddleware);

router.get('/dashboard', adminController.getDashboardData);
router.get('/users/activity', adminController.getUsersActivity);
router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
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

// Scanned Dishes
router.get('/scanned-dishes', adminController.getScannedDishes);
router.put('/scanned-dishes/:id', adminController.updateScannedDish);
router.delete('/scanned-dishes/:id', adminController.deleteScannedDish);

// MRR
router.get('/mrr/stats', adminController.getMRRStats);
router.get('/mrr/chart', adminController.getMRRChart);

const adminPreferenceController = require('../controllers/adminPreferenceController');

// ... existing code ...

// Notifications
router.post('/notifications/send', adminNotificationController.sendNotification);
router.get('/notifications', adminNotificationController.getNotifications);
router.get('/notifications/templates', adminNotificationController.getTemplates);

// Preferences
router.get('/preferences', adminPreferenceController.getPreferences);
router.put('/preferences', adminPreferenceController.updatePreferences);

module.exports = router;
