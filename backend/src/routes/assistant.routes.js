const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const {
  sendMessage,
  getHistory,
  getSuggestions,
  getPopularQuestions
} = require('../controllers/assistant.controller');

// Public routes (no auth required for basic chat)
router.post('/message', sendMessage);
router.get('/suggestions', getSuggestions);

// Protected routes (require authentication)
router.get('/history', verifyToken, getHistory);

// Admin routes
router.get('/popular-questions', verifyToken, isAdmin, getPopularQuestions);

module.exports = router;
