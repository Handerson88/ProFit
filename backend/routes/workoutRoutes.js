const express = require('express');
const router = express.Router();
const workoutController = require('../controllers/workoutController');
const authMiddleware = require('../middleware/auth');
const paywallMiddleware = require('../middleware/paywallMiddleware');

router.use(authMiddleware);
router.use(paywallMiddleware);

router.get('/exercise/progress', workoutController.getExerciseProgress);
router.post('/exercise/complete', workoutController.markExerciseComplete);
const multer = require('multer');
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post('/generate', upload.single('image'), workoutController.generateWorkoutPlan);
router.get('/', workoutController.getWorkoutPlans);
router.get('/active', workoutController.getActivePlan);
router.get('/details/:id', workoutController.getWorkoutPlanDetails);
router.post('/progress', workoutController.markSessionComplete);
router.get('/progress', workoutController.getWorkoutProgress);
router.post('/reset', workoutController.resetWorkoutPlan);

module.exports = router;
