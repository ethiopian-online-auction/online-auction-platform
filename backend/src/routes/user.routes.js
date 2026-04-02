const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const {
  getProfile,
  updateProfile,
  getWallet,
  addFunds,
  withdrawFunds
} = require('../controllers/user.controller');

router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.get('/wallet', verifyToken, getWallet);
router.post('/wallet/add-funds', verifyToken, addFunds);
router.post('/wallet/withdraw', verifyToken, withdrawFunds);

module.exports = router;
