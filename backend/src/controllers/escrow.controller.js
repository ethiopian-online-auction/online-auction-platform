const { query, getClient } = require('../config/database');

// Create escrow transaction after winning auction
const createEscrow = async (req, res) => {
  const client = await getClient();
  
  try {
    const { auctionId } = req.body;
    const { userId } = req.user;

    if (!auctionId) {
      return res.status(400).json({
        success: false,
        message: 'Auction ID is required'
      });
    }

    await client.query('BEGIN');

    // Get auction and verify winner
    const auctionResult = await client.query(
      `SELECT a.*, b.bidder_id, b.amount as winning_amount
       FROM auctions a
       LEFT JOIN bids b ON a.id = b.auction_id AND b.status = 'active'
       WHERE a.id = $1`,
      [auctionId]
    );

    if (auctionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    const auction = auctionResult.rows[0];

    // Verify user is the winner
    if (auction.bidder_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'You are not the winner of this auction'
      });
    }

    // Check if escrow already exists
    const existingEscrow = await client.query(
      'SELECT * FROM escrow_transactions WHERE auction_id = $1',
      [auctionId]
    );

    if (existingEscrow.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Escrow already exists for this auction',
        data: existingEscrow.rows[0]
      });
    }

    // Generate escrow ID
    const escrowId = `ESC-${Date.now().toString().slice(-8)}`;

    // Create escrow transaction
    const escrowResult = await client.query(
      `INSERT INTO escrow_transactions (
        escrow_id, auction_id, buyer_id, seller_id, amount, status,
        blockchain_tx_hash, smart_contract_address
      ) VALUES ($1, $2, $3, $4, $5, 'in-escrow', $6, $7)
      RETURNING *`,
      [
        escrowId,
        auctionId,
        userId,
        auction.seller_id,
        auction.winning_amount,
        `0x${Math.random().toString(16).slice(2, 66)}`, // Mock blockchain hash
        process.env.ESCROW_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'
      ]
    );

    // Update auction status
    await client.query(
      `UPDATE auctions SET status = 'ended' WHERE id = $1`,
      [auctionId]
    );

    // Update bid status
    await client.query(
      `UPDATE bids SET status = 'won' WHERE auction_id = $1 AND bidder_id = $2`,
      [auctionId, userId]
    );

    // Log wallet transaction
    await client.query(
      `INSERT INTO wallet_transactions (
        user_id, type, amount, balance_before, balance_after,
        reference_id, payment_method, status, description
      ) VALUES ($1, 'escrow_lock', $2,
        (SELECT wallet_balance FROM users WHERE id = $1),
        (SELECT wallet_balance FROM users WHERE id = $1),
        $3, 'blockchain', 'completed', 'Funds locked in blockchain escrow'
      )`,
      [userId, auction.winning_amount, escrowId]
    );

    // Create notifications
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, related_auction_id)
       VALUES 
       ($1, 'escrow_created', 'Payment in Escrow', 
        'Your payment is now secured in blockchain escrow', $2),
       ($3, 'auction_won', 'Your Item Sold!', 
        'Buyer payment is in escrow. Ship the item to receive payment', $2)`,
      [userId, auctionId, auction.seller_id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Escrow created successfully',
      data: escrowResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create escrow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create escrow',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Buyer provides shipping/tracking ID after receiving item
const provideShippingId = async (req, res) => {
  const client = await getClient();
  
  try {
    const { id } = req.params;
    const { shippingId } = req.body;
    const { userId } = req.user;

    if (!shippingId) {
      return res.status(400).json({
        success: false,
        message: 'Shipping ID is required'
      });
    }

    await client.query('BEGIN');

    // Get escrow transaction
    const escrowResult = await client.query(
      'SELECT * FROM escrow_transactions WHERE id = $1',
      [id]
    );

    if (escrowResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Escrow transaction not found'
      });
    }

    const escrow = escrowResult.rows[0];

    // Verify user is the buyer
    if (escrow.buyer_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check escrow status
    if (escrow.status !== 'in-escrow') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Cannot provide shipping ID. Current status: ${escrow.status}`
      });
    }

    // Update escrow with shipping ID
    await client.query(
      `UPDATE escrow_transactions 
       SET shipping_id = $1, status = 'pending-verification', shipping_verified_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [shippingId, id]
    );

    // Create notification for admin
    const adminResult = await client.query(
      `SELECT id FROM users WHERE role = 'admin' LIMIT 1`
    );

    if (adminResult.rows.length > 0) {
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES ($1, 'verify_shipping', 'Verify Shipping ID', 
         'Buyer provided shipping ID: ${shippingId}. Please verify and release funds.')`,
        [adminResult.rows[0].id]
      );
    }

    // Notify buyer
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, 'shipping_submitted', 'Shipping ID Submitted', 
       'Your shipping ID has been submitted. Admin will verify and release funds to seller.')`,
      [userId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Shipping ID submitted successfully. Awaiting admin verification.'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Provide shipping ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit shipping ID',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Admin verifies shipping and releases funds to seller
const verifyAndReleaseFunds = async (req, res) => {
  const client = await getClient();
  
  try {
    const { id } = req.params;
    const { userId, role } = req.user;

    // Only admin can verify
    if (role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can verify and release funds'
      });
    }

    await client.query('BEGIN');

    // Get escrow transaction
    const escrowResult = await client.query(
      'SELECT * FROM escrow_transactions WHERE id = $1',
      [id]
    );

    if (escrowResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Escrow transaction not found'
      });
    }

    const escrow = escrowResult.rows[0];

    if (escrow.status !== 'pending-verification') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Cannot release funds. Current status: ${escrow.status}`
      });
    }

    // Calculate seller amount (after commission)
    const sellerResult = await client.query(
      'SELECT commission_rate FROM users WHERE id = $1',
      [escrow.seller_id]
    );

    const commissionRate = parseFloat(sellerResult.rows[0].commission_rate || 0);
    const commissionAmount = (parseFloat(escrow.amount) * commissionRate) / 100;
    const sellerAmount = parseFloat(escrow.amount) - commissionAmount;

    // Release funds to seller
    await client.query(
      `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
      [sellerAmount, escrow.seller_id]
    );

    // Log wallet transaction for seller
    await client.query(
      `INSERT INTO wallet_transactions (
        user_id, type, amount, balance_before, balance_after,
        reference_id, payment_method, status, description
      ) VALUES ($1, 'escrow_release', $2,
        (SELECT wallet_balance - $2 FROM users WHERE id = $1),
        (SELECT wallet_balance FROM users WHERE id = $1),
        $3, 'blockchain', 'completed', $4
      )`,
      [escrow.seller_id, sellerAmount, escrow.escrow_id,
       `Escrow funds released (Commission: ${commissionAmount} ETB)`]
    );

    // Update escrow status
    await client.query(
      `UPDATE escrow_transactions 
       SET status = 'released', released_at = CURRENT_TIMESTAMP, verified_by_admin_id = $1
       WHERE id = $2`,
      [userId, id]
    );

    // Create notifications
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES 
       ($1, 'funds_released', 'Payment Received', $3),
       ($2, 'delivery_confirmed', 'Delivery Confirmed', 'Admin verified delivery. Funds released to seller.')`,
      [escrow.seller_id, escrow.buyer_id, `ETB ${sellerAmount.toLocaleString()} has been released to your wallet. Your auction sale is complete!`]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Funds released to seller successfully',
      data: {
        amount: sellerAmount,
        commission: commissionAmount
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Release funds error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to release funds',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Open dispute
const openDispute = async (req, res) => {
  const client = await getClient();
  
  try {
    const { id } = req.params;
    const { reason, evidence } = req.body;
    const { userId } = req.user;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required'
      });
    }

    await client.query('BEGIN');

    // Get escrow transaction
    const escrowResult = await client.query(
      'SELECT * FROM escrow_transactions WHERE id = $1',
      [id]
    );

    if (escrowResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Escrow transaction not found'
      });
    }

    const escrow = escrowResult.rows[0];

    // Verify user is buyer or seller
    if (escrow.buyer_id !== userId && escrow.seller_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Create dispute
    const disputeResult = await client.query(
      `INSERT INTO disputes (escrow_transaction_id, opened_by_user_id, reason, evidence, status)
       VALUES ($1, $2, $3, $4, 'open')
       RETURNING *`,
      [id, userId, reason, JSON.stringify(evidence || {})]
    );

    // Update escrow status
    await client.query(
      `UPDATE escrow_transactions SET status = 'disputed' WHERE id = $1`,
      [id]
    );

    // Notify admin
    const adminResult = await client.query(
      `SELECT id FROM users WHERE role = 'admin' LIMIT 1`
    );

    if (adminResult.rows.length > 0) {
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES ($1, 'dispute_opened', 'New Dispute', 
         'A dispute has been opened for escrow ${escrow.escrow_id}')`,
        [adminResult.rows[0].id]
      );
    }

    // Notify other party
    const otherPartyId = escrow.buyer_id === userId ? escrow.seller_id : escrow.buyer_id;
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, 'dispute_opened', 'Dispute Opened', 
       'A dispute has been opened for your transaction')`,
      [otherPartyId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Dispute opened successfully',
      data: disputeResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Open dispute error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to open dispute',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Get user's escrow transactions
const getMyTransactions = async (req, res) => {
  try {
    const { userId } = req.user;
    const { status, page = 1, limit = 20 } = req.query;

    let queryText = `
      SELECT 
        e.*,
        a.title as auction_title,
        a.images,
        CASE 
          WHEN e.buyer_id = $1 THEN 'buyer'
          WHEN e.seller_id = $1 THEN 'seller'
        END as user_role
      FROM escrow_transactions e
      LEFT JOIN auctions a ON e.auction_id = a.id
      WHERE e.buyer_id = $1 OR e.seller_id = $1
    `;

    const queryParams = [userId];
    let paramCount = 2;

    if (status) {
      queryText += ` AND e.status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }

    queryText += ` ORDER BY e.created_at DESC`;
    
    const offset = (page - 1) * limit;
    queryText += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      data: {
        transactions: result.rows,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
};

module.exports = {
  createEscrow,
  provideShippingId,
  verifyAndReleaseFunds,
  openDispute,
  getMyTransactions
};
