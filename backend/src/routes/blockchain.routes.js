const express = require('express');
const router = express.Router();
const blockchainController = require('../controllers/blockchain.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Protected routes - require authentication
router.post('/create', verifyToken, blockchainController.createEscrow);
router.post('/:escrowId/fund', verifyToken, blockchainController.fundEscrow);
router.post('/:escrowId/ship', verifyToken, blockchainController.markShipped);
router.post('/:escrowId/confirm-delivery', verifyToken, blockchainController.confirmDelivery);
router.get('/:escrowId/status', verifyToken, blockchainController.getEscrowStatus);
router.get('/my-escrows', verifyToken, blockchainController.getUserEscrows);

// Admin routes
router.post('/:escrowId/release', verifyToken, isAdmin, blockchainController.releaseFunds);
router.post('/:escrowId/refund', verifyToken, isAdmin, blockchainController.refundBuyer);

module.exports = router;
