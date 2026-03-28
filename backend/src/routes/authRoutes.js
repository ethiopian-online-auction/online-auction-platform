const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  handleValidationErrors
} = require('../middleware/validation');

// Public routes
router.post('/register', registerValidation, handleValidationErrors, register);
router.post('/login', loginValidation, handleValidationErrors, login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfileValidation, handleValidationErrors, updateProfile);
router.put('/change-password', protect, changePasswordValidation, handleValidationErrors, changePassword);
router.post('/logout', protect, logout);

module.exports = router;
