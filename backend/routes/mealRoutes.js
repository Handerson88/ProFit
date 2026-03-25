const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');
const authMiddleware = require('../middleware/auth');
const paywallMiddleware = require('../middleware/paywallMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for Meal Photos (Memory Storage for Vercel)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Authentication is required for all
router.use(authMiddleware);

// Public/Free routes (No paywall)
router.post('/add', mealController.addMeal);
router.get('/summary', mealController.getDailySummary);

// Specialized / Hybrid Routes
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

// Premium Routes (Paywall required)
router.get('/stats/weekly', paywallMiddleware, mealController.getWeeklyStats);
router.get('/recent', paywallMiddleware, mealController.getRecentMeals);
router.get('/history/calories', paywallMiddleware, mealController.getCalorieHistory);
router.get('/history', paywallMiddleware, mealController.getHistory);
router.put('/:id', paywallMiddleware, mealController.updateMeal);
router.delete('/:id', paywallMiddleware, mealController.deleteMeal);

module.exports = router;
