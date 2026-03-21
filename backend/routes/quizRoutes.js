const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const quizController = require('../controllers/quizController');

router.post('/answer', authMiddleware, quizController.saveAnswer);
router.get('/responses', authMiddleware, quizController.getResponses);

module.exports = router;
