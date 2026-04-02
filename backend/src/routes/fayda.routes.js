const express = require('express');
const router = express.Router();
const faydaController = require('../controllers/fayda.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Public — initiate SSO login (returns authUrl)
router.get('/login', faydaController.initiateLogin);

// OAuth callback from Fayda eSignet
router.get('/callback', faydaController.handleCallback);

// Mock authorize page (GET = show form, POST = submit)
router.get('/mock-authorize', faydaController.mockAuthorize);
router.post('/mock-authorize', express.urlencoded({ extended: true }), faydaController.mockAuthorizeSubmit);

// Protected — initiate KYC for logged-in user
router.get('/kyc', verifyToken, faydaController.initiateKYC);

// Protected — get KYC status
router.get('/kyc/status', verifyToken, faydaController.getKYCStatus);

module.exports = router;
