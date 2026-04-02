const { query, getClient } = require('../config/database');

// Get user profile
const getProfile = async (req, res) => {
  try {
    const { userId } = req.user;

    const result = await query(
      `SELECT 
        id, name, email, phone, role, is_verified, wallet_balance,
        subscription_plan, subscription_status, commission_rate,
        language_preference, profile_photo, created_at
      FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  const client = await getClient();

  try {
    const { userId } = req.user;
    const { name, phone, languagePreference, profile_photo } = req.body;

    await client.query('BEGIN');

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (phone) {
      updates.push(`phone = $${paramCount}`);
      values.push(phone);
      paramCount++;
    }

    if (languagePreference) {
      updates.push(`language_preference = $${paramCount}`);
      values.push(languagePreference);
      paramCount++;
    }

    if (profile_photo !== undefined) {
      updates.push(`profile_photo = $${paramCount}`);
      values.push(profile_photo);
      paramCount++;
    }

    if (updates.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(userId);
    const result = await client.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING
       id, name, email, phone, role, wallet_balance, subscription_plan, language_preference, profile_photo`,
      values
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  } finally {
    client.release();
  }
}

// Get wallet balance and transactions
const getWallet = async (req, res) => {
  try {
    const { userId } = req.user;
    const { page = 1, limit = 20 } = req.query;

    // Get wallet balance
    const balanceResult = await query(
      'SELECT wallet_balance FROM users WHERE id = $1',
      [userId]
    );

    // Get recent transactions
    const offset = (page - 1) * limit;
    const transactionsResult = await query(
      `SELECT * FROM wallet_transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({
      success: true,
      data: {
        balance: parseFloat(balanceResult.rows[0].wallet_balance),
        transactions: transactionsResult.rows,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet',
      error: error.message
    });
  }
};

// Add funds to wallet
const addFunds = async (req, res) => {
  const client = await getClient();
  
  try {
    const { userId } = req.user;
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    if (!paymentMethod || !['telebirr', 'chapa', 'cbe_birr'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }

    await client.query('BEGIN');

    // Get current balance
    const userResult = await client.query(
      'SELECT wallet_balance FROM users WHERE id = $1',
      [userId]
    );

    const currentBalance = parseFloat(userResult.rows[0].wallet_balance);
    const newBalance = currentBalance + parseFloat(amount);

    // Update wallet balance
    await client.query(
      'UPDATE users SET wallet_balance = $1 WHERE id = $2',
      [newBalance, userId]
    );

    // Log transaction
    await client.query(
      `INSERT INTO wallet_transactions (
        user_id, type, amount, balance_before, balance_after,
        payment_method, status, description
      ) VALUES ($1, 'deposit', $2, $3, $4, $5, 'completed', 'Wallet deposit via ${paymentMethod}')`,
      [userId, amount, currentBalance, newBalance, paymentMethod]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Funds added successfully',
      data: {
        previousBalance: currentBalance,
        addedAmount: parseFloat(amount),
        newBalance: newBalance
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add funds error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add funds',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Withdraw funds from wallet
const withdrawFunds = async (req, res) => {
  const client = await getClient();
  
  try {
    const { userId } = req.user;
    const { amount, paymentMethod, accountDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    await client.query('BEGIN');

    // Get current balance
    const userResult = await client.query(
      'SELECT wallet_balance FROM users WHERE id = $1',
      [userId]
    );

    const currentBalance = parseFloat(userResult.rows[0].wallet_balance);

    if (currentBalance < parseFloat(amount)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    const newBalance = currentBalance - parseFloat(amount);

    // Update wallet balance
    await client.query(
      'UPDATE users SET wallet_balance = $1 WHERE id = $2',
      [newBalance, userId]
    );

    // Log transaction
    await client.query(
      `INSERT INTO wallet_transactions (
        user_id, type, amount, balance_before, balance_after,
        payment_method, status, description
      ) VALUES ($1, 'withdrawal', $2, $3, $4, $5, 'completed', 
      'Wallet withdrawal to ${paymentMethod}')`,
      [userId, amount, currentBalance, newBalance, paymentMethod]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Withdrawal processed successfully',
      data: {
        previousBalance: currentBalance,
        withdrawnAmount: parseFloat(amount),
        newBalance: newBalance
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Withdraw funds error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to withdraw funds',
      error: error.message
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getWallet,
  addFunds,
  withdrawFunds
};
