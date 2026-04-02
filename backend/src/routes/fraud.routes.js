const express = require('express');
const router = express.Router();
const fraudController = require('../controllers/fraud.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Public route - analyze bid for fraud (called internally)
router.post('/analyze', fraudController.analyzeBid);

// Admin routes
router.get('/logs',        verifyToken, isAdmin, fraudController.getFraudLogs);
router.get('/alerts',      verifyToken, isAdmin, fraudController.getAlerts);
router.get('/statistics',  verifyToken, isAdmin, fraudController.getStatistics);
router.get('/thresholds',  verifyToken, isAdmin, fraudController.getThresholds);
router.get('/accuracy',    verifyToken, isAdmin, fraudController.getModelAccuracy);
router.post('/auto-tune',  verifyToken, isAdmin, fraudController.autoTune);
router.post('/feedback/:logId', verifyToken, isAdmin, fraudController.provideFeedback);

module.exports = router;
