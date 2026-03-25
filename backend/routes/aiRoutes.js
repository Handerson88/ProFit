const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authenticateToken = require('../middleware/auth');
const { isAdmin } = require('../middleware/auth');
const paywallMiddleware = require('../middleware/paywallMiddleware');

// User Routes
router.get('/conversations', authenticateToken, paywallMiddleware, aiController.getConversations);
router.get('/messages/:conversationId', authenticateToken, paywallMiddleware, aiController.getMessages);
router.post('/message', authenticateToken, paywallMiddleware, aiController.sendMessage);
router.post('/new', authenticateToken, paywallMiddleware, aiController.newConversation);

// Admin Routes
router.get('/admin/conversations', authenticateToken, isAdmin, aiController.adminGetAllConversations);
router.post('/admin/reply', authenticateToken, isAdmin, aiController.adminReply);

module.exports = router;
