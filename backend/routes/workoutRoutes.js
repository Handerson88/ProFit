const express = require('express');
const router = express.Router();
const workoutController = require('../controllers/workoutController');
const authMiddleware = require('../middleware/auth');
const paywallMiddleware = require('../middleware/paywallMiddleware');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.use(authMiddleware);

// Premium Workout Routes
router.post('/generate', paywallMiddleware, upload.single('image'), workoutController.generateWorkoutPlan);
router.get('/', paywallMiddleware, workoutController.getWorkoutPlans);
router.get('/active', paywallMiddleware, workoutController.getActivePlan);
router.get('/details/:id', paywallMiddleware, workoutController.getWorkoutPlanDetails);
router.post('/reset', paywallMiddleware, workoutController.resetWorkoutPlan);

// Progress tracking might be allowed once they HAVE a plan
router.get('/exercise/progress', workoutController.getExerciseProgress);
router.post('/exercise/complete', workoutController.markExerciseComplete);
router.post('/progress', workoutController.markSessionComplete);
router.get('/progress', workoutController.getWorkoutProgress);

module.exports = router;
