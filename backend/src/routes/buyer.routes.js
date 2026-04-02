const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  getPurchaseHistory,
  saveBuyerPreferences,
  getBuyerPreferences
} = require('../controllers/buyer.controller');

// All routes require authentication
router.use(verifyToken);

// Watchlist routes
router.post('/watchlist/add', addToWatchlist);
router.delete('/watchlist/:auctionId', removeFromWatchlist);
router.get('/watchlist', getWatchlist);

// Purchase history
router.get('/purchase-history', getPurchaseHistory);

// Buyer preferences
router.post('/preferences', saveBuyerPreferences);
router.get('/preferences', getBuyerPreferences);

module.exports = router;
