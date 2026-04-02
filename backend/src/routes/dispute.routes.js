const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { createDispute, getUserDisputes, getDisputeById } = require('../controllers/dispute.controller');

// User dispute routes
router.post('/', verifyToken, createDispute);
router.get('/my-disputes', verifyToken, getUserDisputes);
router.get('/:disputeId', verifyToken, getDisputeById);

module.exports = router;
