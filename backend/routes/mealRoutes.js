const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');
const authMiddleware = require('../middleware/auth');
const paywallMiddleware = require('../middleware/paywallMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for Meal Photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join('./uploads', 'meals', req.user.id);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'meal-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// All meal routes require authentication and are subject to paywall
router.use(authMiddleware);
router.use(paywallMiddleware);

router.post('/add', mealController.addMeal);

router.post('/scan', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer Error:', err);
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      console.error('Unknown Upload Error:', err);
      return res.status(500).json({ message: `Unknown upload error: ${err.message}` });
    }
    next();
  });
}, mealController.scanMeal);

router.get('/summary', mealController.getDailySummary);
router.get('/stats/weekly', mealController.getWeeklyStats);
router.get('/recent', mealController.getRecentMeals);
router.get('/history/calories', mealController.getCalorieHistory);
router.get('/history', mealController.getHistory);
router.put('/:id', mealController.updateMeal);
router.delete('/:id', mealController.deleteMeal);

module.exports = router;
