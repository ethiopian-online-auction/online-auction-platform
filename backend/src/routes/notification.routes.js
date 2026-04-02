const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/', verifyToken, (req, res) => {
  res.json({ success: true, message: 'List notifications endpoint' });
});

router.put('/:id/read', verifyToken, (req, res) => {
  res.json({ success: true, message: 'Mark notification as read endpoint' });
});

router.put('/read-all', verifyToken, (req, res) => {
  res.json({ success: true, message: 'Mark all as read endpoint' });
});

module.exports = router;
