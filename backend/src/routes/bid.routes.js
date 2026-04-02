const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const {
  placeBid,
  enableAutoBid,
  getMyBids
} = require('../controllers/bid.controller');

router.post('/place', verifyToken, placeBid);
router.post('/auto-bid', verifyToken, enableAutoBid);
router.get('/my-bids', verifyToken, getMyBids);

module.exports = router;
