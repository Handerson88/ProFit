const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authenticateToken = require('../middleware/auth');
const isAdmin = require('../middleware/adminMiddleware');

// User Routes
router.get('/conversations', authenticateToken, aiController.getConversations);
router.get('/messages/:conversationId', authenticateToken, aiController.getMessages);
router.post('/message', authenticateToken, aiController.sendMessage);
router.post('/new', authenticateToken, aiController.newConversation);

// Admin Routes
router.get('/admin/conversations', authenticateToken, isAdmin, aiController.adminGetAllConversations);
router.post('/admin/reply', authenticateToken, isAdmin, aiController.adminReply);

module.exports = router;
