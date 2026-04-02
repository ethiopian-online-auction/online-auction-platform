const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is not blacklisted
    const result = await query(
      'SELECT id, email, role, is_blacklisted FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.',
      });
    }

    const user = result.rows[0];

    if (user.is_blacklisted) {
      return res.status(403).json({
        success: false,
        message: 'Account has been suspended.',
      });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.',
    });
  }
  next();
};

// Check if user is seller
const isSeller = (req, res, next) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Seller only.',
    });
  }
  next();
};

// Check if user is buyer or seller
const isBuyerOrSeller = (req, res, next) => {
  if (!['buyer', 'seller', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied.',
    });
  }
  next();
};

module.exports = {
  verifyToken,
  isAdmin,
  isSeller,
  isBuyerOrSeller,
};
