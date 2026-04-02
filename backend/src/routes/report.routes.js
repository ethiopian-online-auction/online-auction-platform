const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { createReport } = require('../controllers/report.controller');

// User report submission
router.post('/', verifyToken, createReport);

module.exports = router;
