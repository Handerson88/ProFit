const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const activityController = require('../controllers/activityController');

router.post('/log', authMiddleware, activityController.logActivity);

module.exports = router;
