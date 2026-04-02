const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const {
  createEscrow,
  provideShippingId,
  verifyAndReleaseFunds,
  openDispute,
  getMyTransactions
} = require('../controllers/escrow.controller');

router.post('/create', verifyToken, createEscrow);
router.post('/:id/provide-shipping-id', verifyToken, provideShippingId);
router.post('/:id/verify-release', verifyToken, isAdmin, verifyAndReleaseFunds);
router.post('/:id/dispute', verifyToken, openDispute);
router.get('/my-transactions', verifyToken, getMyTransactions);

module.exports = router;
