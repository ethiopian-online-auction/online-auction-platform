const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const {
  getActivityLogs,
  getMyActivityLogs,
  getActivityStatistics,
  exportActivityLogs
} = require('../controllers/activity.controller');

// User routes (authenticated)
router.get('/my-logs', verifyToken, getMyActivityLogs);

// Admin routes
router.get('/logs', verifyToken, isAdmin, getActivityLogs);
router.get('/statistics', verifyToken, isAdmin, getActivityStatistics);
router.get('/export', verifyToken, isAdmin, exportActivityLogs);

module.exports = router;
