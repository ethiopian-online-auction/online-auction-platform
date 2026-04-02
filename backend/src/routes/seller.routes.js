const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const {
  applyToBecomeSeller,
  uploadDocuments,
  getMyApplication,
  updateApplication,
  getSellerDashboard,
  getSellerAnalytics
} = require('../controllers/seller.controller');

// All routes require authentication
router.use(verifyToken);

// Seller application routes
router.post('/apply', applyToBecomeSeller);
router.post('/documents', uploadDocuments);
router.get('/my-application', getMyApplication);
router.put('/application/:id', updateApplication);

// Seller dashboard routes
router.get('/dashboard', getSellerDashboard);
router.get('/analytics', getSellerAnalytics);

module.exports = router;
