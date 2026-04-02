const bcrypt = require('bcryptjs');
const { query, getClient } = require('../config/database');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt.util');
const { setEx, get, del } = require('../config/redis');

// Register new user
const register = async (req, res) => {
  const client = await getClient();
  
  try {
    const { name, email, phone, password, plan = 'free' } = req.body;

    // Validate input
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    await client.query('BEGIN');

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1 OR phone = $2',
      [email, phone]
    );

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Determine role based on plan
    const role = (plan === 'seller' || plan === 'premium') ? 'seller' : 'buyer';
    const commissionRate = plan === 'seller' ? 10 : plan === 'premium' ? 3 : null;

    // Create user
    const result = await client.query(
      `INSERT INTO users (name, email, phone, password_hash, role, subscription_plan, commission_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, phone, role, subscription_plan`,
      [name, email, phone, passwordHash, role, plan, commissionRate]
    );

    const user = result.rows[0];

    // Generate OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in Redis (expires in 10 minutes)
    await setEx(`otp:${user.id}`, { otp, email, phone }, 600);

    await client.query('COMMIT');

    // TODO: Send OTP via SMS and Email
    console.log(`OTP for ${email}: ${otp}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your account with OTP.',
      data: {
        userId: user.id,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'User ID and OTP are required',
      });
    }

    // Get OTP from Redis
    const storedData = await get(`otp:${userId}`);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired or invalid',
      });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    // Update user verification status
    await query(
      'UPDATE users SET is_verified = TRUE, subscription_status = $1 WHERE id = $2',
      ['active', userId]
    );

    // Delete OTP from Redis
    await del(`otp:${userId}`);

    res.json({
      success: true,
      message: 'Account verified successfully',
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed',
      error: error.message,
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find user
    const result = await query(
      `SELECT id, name, email, phone, password_hash, role, is_verified, is_blacklisted, 
              subscription_plan, subscription_status, wallet_balance
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = result.rows[0];

    // Check if blacklisted
    if (user.is_blacklisted) {
      return res.status(403).json({
        success: false,
        message: 'Account has been suspended',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in Redis
    await setEx(`refresh_token:${user.id}`, refreshToken, 7 * 24 * 60 * 60); // 7 days

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.is_verified,
          subscription: {
            plan: user.subscription_plan,
            status: user.subscription_status,
          },
          walletBalance: parseFloat(user.wallet_balance),
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const { userId } = req.user;

    // Delete refresh token from Redis
    await del(`refresh_token:${userId}`);

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message,
    });
  }
};

// Forgot Password - generate reset token
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const result = await query('SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1)', [email]);

    if (result.rows.length === 0) {
      return res.json({ success: true, message: 'If that email exists, a reset code has been sent.' });
    }

    const user = result.rows[0];

    // Generate 6-digit reset OTP
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in memory/Redis for 15 minutes
    await setEx(`reset_otp:${user.id}`, { otp: resetOtp, email: user.email }, 900);

    console.log(`Password reset OTP for ${email}: ${resetOtp}`);

    // Send real email if SMTP is configured
    if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      try {
        const { sendResetOTP } = require('../services/email.service');
        await sendResetOTP(user.email, resetOtp, user.name);
      } catch (emailErr) {
        console.error('Email send failed:', emailErr.message);
      }
    }

    res.json({
      success: true,
      message: 'If that email exists, a reset code has been sent.',
      ...(process.env.NODE_ENV !== 'production' && { devOtp: resetOtp, userId: user.id }),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to process request', error: error.message });
  }
};

// Reset Password - verify OTP and set new password
const resetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;

    if (!userId || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'userId, otp, and newPassword are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const storedData = await get(`reset_otp:${userId}`);

    if (!storedData) {
      return res.status(400).json({ success: false, message: 'Reset code expired or invalid' });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid reset code' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);

    await del(`reset_otp:${userId}`);

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
  }
};

module.exports = {
  register,
  verifyOTP,
  login,
  logout,
  forgotPassword,
  resetPassword,
};
