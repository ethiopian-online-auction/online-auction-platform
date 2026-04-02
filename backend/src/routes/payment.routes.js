const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const paymentService = require('../services/payment.service');
const { query, getClient } = require('../config/database');
const crypto = require('crypto');

// Initialize payment (unified endpoint)
router.post('/initialize', verifyToken, async (req, res) => {
  try {
    const { provider, amount } = req.body;
    const { userId, user } = req.user;

    if (!provider || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Provider and amount are required'
      });
    }

    if (amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum amount is 100 ETB'
      });
    }

    // Generate unique transaction reference
    const txRef = `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const callbackUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/callback/${provider}`;
    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?tab=wallet`;

    // Prepare payment data based on provider
    let paymentData = {
      amount,
      orderId: txRef,
      callbackUrl,
      returnUrl
    };

    if (provider === 'chapa') {
      paymentData = {
        ...paymentData,
        currency: 'ETB',
        email: user.email,
        firstName: user.name.split(' ')[0],
        lastName: user.name.split(' ')[1] || '',
        phoneNumber: user.phone,
        txRef
      };
    } else if (provider === 'telebirr') {
      paymentData = {
        ...paymentData,
        userId,
        userName: user.name,
        phoneNumber: user.phone,
        notifyUrl: callbackUrl
      };
    } else if (provider === 'cbe_birr') {
      paymentData = {
        ...paymentData,
        customerName: user.name,
        customerPhone: user.phone,
        description: 'Wallet Top-up'
      };
    }

    // Initialize payment with provider
    const result = await paymentService.initializePayment(provider, paymentData);

    if (result.success) {
      // Save payment record
      await query(
        `INSERT INTO payments (
          payment_id, buyer_id, amount, currency, method, status
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [txRef, userId, amount, 'ETB', provider, 'pending']
      );

      res.json({
        success: true,
        data: {
          checkoutUrl: result.data.checkoutUrl,
          txRef: result.data.txRef || result.data.orderId,
          provider
        }
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment',
      error: error.message
    });
  }
});

// Payment callback (webhook)
router.post('/callback/:provider', async (req, res) => {
  const client = await getClient();
  
  try {
    const { provider } = req.params;
    const callbackData = req.body;

    console.log(`Payment callback from ${provider}:`, callbackData);

    // Extract transaction reference based on provider
    let txRef;
    if (provider === 'chapa') {
      txRef = callbackData.tx_ref || callbackData.trx_ref;
    } else if (provider === 'telebirr') {
      txRef = callbackData.outTradeNo;
    } else if (provider === 'cbe_birr') {
      txRef = callbackData.order_id;
    }

    if (!txRef) {
      return res.status(400).json({
        success: false,
        message: 'Transaction reference not found'
      });
    }

    // Verify payment with provider
    const verification = await paymentService.verifyPayment(provider, txRef);

    if (verification.success) {
      await client.query('BEGIN');

      // Get payment record
      const paymentResult = await client.query(
        'SELECT * FROM payments WHERE payment_id = $1',
        [txRef]
      );

      if (paymentResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Payment record not found'
        });
      }

      const payment = paymentResult.rows[0];

      // Update payment status
      await client.query(
        'UPDATE payments SET status = $1 WHERE payment_id = $2',
        ['completed', txRef]
      );

      // Add funds to user wallet
      await client.query(
        'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
        [verification.amount, payment.buyer_id]
      );

      // Log wallet transaction
      await client.query(
        `INSERT INTO wallet_transactions (
          user_id, type, amount, balance_before, balance_after,
          reference_id, payment_method, status, description
        ) VALUES (
          $1, 'deposit', $2,
          (SELECT wallet_balance - $2 FROM users WHERE id = $1),
          (SELECT wallet_balance FROM users WHERE id = $1),
          $3, $4, 'completed', 'Wallet top-up via ${provider}'
        )`,
        [payment.buyer_id, verification.amount, txRef, provider]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Payment processed successfully'
      });
    } else {
      // Update payment as failed
      await query(
        'UPDATE payments SET status = $1 WHERE payment_id = $2',
        ['failed', txRef]
      );

      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Payment callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment callback',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Verify payment status
router.get('/verify/:txRef', verifyToken, async (req, res) => {
  try {
    const { txRef } = req.params;

    // Get payment record
    const paymentResult = await query(
      'SELECT * FROM payments WHERE payment_id = $1',
      [txRef]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const payment = paymentResult.rows[0];

    // Verify with provider
    const verification = await paymentService.verifyPayment(payment.method, txRef);

    res.json({
      success: true,
      data: {
        status: payment.status,
        amount: payment.amount,
        method: payment.method,
        verified: verification.success
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

// Legacy endpoints for backward compatibility
router.post('/telebirr/initiate', verifyToken, (req, res) => {
  req.body.provider = 'telebirr';
  return router.handle(req, res);
});

router.post('/chapa/initiate', verifyToken, (req, res) => {
  req.body.provider = 'chapa';
  return router.handle(req, res);
});

router.post('/cbe/initiate', verifyToken, (req, res) => {
  req.body.provider = 'cbe_birr';
  return router.handle(req, res);
});

module.exports = router;
