const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const {
  getAuctions,
  getAuctionById,
  createAuction,
  updateAuction,
  deleteAuction
} = require('../controllers/auction.controller');

// Public routes
router.get('/', getAuctions);
router.get('/:id', getAuctionById);

// Protected routes - anyone can create/manage auctions
router.post('/', verifyToken, createAuction);
router.put('/:id', verifyToken, updateAuction);
router.delete('/:id', verifyToken, deleteAuction);

module.exports = router;
