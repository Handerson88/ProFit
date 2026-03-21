const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const auth = require('../middleware/auth');
const paywallMiddleware = require('../middleware/paywallMiddleware');

router.use(auth);
router.use(paywallMiddleware);

router.get('/my', achievementController.getUserAchievements);
router.get('/all', achievementController.getAllAchievements);

module.exports = router;
