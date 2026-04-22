const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const {
  sendMessage,
  getHistory,
  getSuggestions,
  getPopularQuestions,
  getBidRecommendation,
  getCreateAuctionRecommendation
} = require('../controllers/assistant.controller');

// Public routes
router.post('/message', sendMessage);
router.get('/suggestions', getSuggestions);

// Recommendation routes (optional auth — better with user context)
router.get('/recommend/bid/:auctionId', verifyToken, getBidRecommendation);
router.get('/recommend/create-auction/:category', verifyToken, getCreateAuctionRecommendation);

// Protected routes
router.get('/history', verifyToken, getHistory);

// Admin routes
router.get('/popular-questions', verifyToken, isAdmin, getPopularQuestions);

module.exports = router;
