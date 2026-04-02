const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { query } = require('../config/database');

// Get user's wallet transactions
router.get('/transactions', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { limit = 10, page = 1 } = req.query;
    
    const offset = (page - 1) * limit;
    
    const result = await query(
      `SELECT * FROM wallet_transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    res.json({
      success: true,
      data: {
        transactions: result.rows,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get wallet transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet transactions',
      error: error.message
    });
  }
});

// Get wallet balance
router.get('/balance', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;
    
    const result = await query(
      'SELECT wallet_balance FROM users WHERE id = $1',
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
      data: {
        balance: parseFloat(result.rows[0].wallet_balance)
      }
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet balance',
      error: error.message
    });
  }
});

// Temporary endpoint to add funds directly (for testing without payment providers)
// TODO: Remove this in production and use real payment integration
router.get('/add-funds-test', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { amount } = req.query;
    
    console.log('💰 Add funds request received');
    console.log('💰 User ID:', userId);
    console.log('💰 Amount:', amount);
    
    if (!amount || parseFloat(amount) <= 0) {
      console.log('❌ Invalid amount');
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }
    
    const amountValue = parseFloat(amount);
    
    // Get current balance
    const userResult = await query(
      'SELECT wallet_balance FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const currentBalance = parseFloat(userResult.rows[0].wallet_balance || 0);
    const newBalance = currentBalance + amountValue;
    
    console.log('💰 Current balance:', currentBalance);
    console.log('💰 New balance:', newBalance);
    
    // Update wallet balance
    await query(
      'UPDATE users SET wallet_balance = $1 WHERE id = $2',
      [newBalance, userId]
    );
    
    // Try to log transaction (but don't fail if table doesn't exist)
    try {
      await query(
        `INSERT INTO wallet_transactions (
          user_id, type, amount, balance_before, balance_after,
          reference_id, payment_method, status, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          userId,
          'deposit',
          amountValue,
          currentBalance,
          newBalance,
          `TEST-${Date.now()}`,
          'test',
          'completed',
          'Test deposit (no payment provider)'
        ]
      );
      console.log('✅ Transaction logged');
    } catch (logError) {
      console.warn('⚠️ Could not log transaction (table may not exist):', logError.message);
      // Continue anyway - balance was updated
    }
    
    console.log('✅ Funds added successfully');
    console.log('✅ Sending response with status 200');
    
    // Explicitly set status 200 and return success
    return res.status(200).json({
      success: true,
      message: 'Funds added successfully',
      data: {
        previousBalance: currentBalance,
        newBalance: newBalance,
        amountAdded: amountValue
      }
    });
  } catch (error) {
    console.error('❌ Add funds test error:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to add funds',
      error: error.message
    });
  }
});

module.exports = router;
