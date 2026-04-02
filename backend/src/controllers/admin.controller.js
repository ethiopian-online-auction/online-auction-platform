const { query, getClient } = require('../config/database');

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        id, name, email, phone, role, wallet_balance,
        subscription_plan, subscription_status, is_verified,
        is_blacklisted, created_at,
        fayda_id, fayda_verified
      FROM users
      ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Get all auctions (admin only)
const getAllAuctions = async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        a.id, a.title, a.description, a.category, a.starting_bid,
        a.current_bid, a.status, a.start_time, a.end_time,
        a.created_at, a.seller_id,
        u.name as seller_name, u.email as seller_email,
        (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as total_bids
      FROM auctions a
      LEFT JOIN users u ON a.seller_id = u.id
      ORDER BY a.created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get all auctions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch auctions',
      error: error.message
    });
  }
};

// Get all disputes
const getDisputes = async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        d.id, d.auction_id, d.buyer_id, d.seller_id, d.reason, d.description,
        d.status, d.resolution, d.created_at, d.resolved_at,
        a.title as auction_title,
        bu.name as buyer_name, bu.email as buyer_email,
        su.name as seller_name, su.email as seller_email
      FROM disputes d
      LEFT JOIN auctions a ON d.auction_id = a.id
      LEFT JOIN users bu ON d.buyer_id = bu.id
      LEFT JOIN users su ON d.seller_id = su.id
      ORDER BY d.created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch disputes',
      error: error.message
    });
  }
};

// Resolve dispute
const resolveDispute = async (req, res) => {
  const client = await getClient();
  
  try {
    const { disputeId } = req.params;
    const { resolution, winner } = req.body; // winner: 'buyer' or 'seller'

    await client.query('BEGIN');

    // Update dispute status
    await client.query(
      `UPDATE disputes 
       SET status = 'resolved', resolution = $1, resolved_at = NOW()
       WHERE id = $2`,
      [resolution, disputeId]
    );

    // If there's a winner, handle refund/payment
    if (winner) {
      const dispute = await client.query(
        'SELECT * FROM disputes WHERE id = $1',
        [disputeId]
      );
      
      // TODO: Handle escrow release based on winner
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Dispute resolved successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Resolve dispute error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve dispute',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Get all reports
const getReports = async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        r.id, r.reporter_id, r.reported_user_id, r.reported_auction_id,
        r.reason, r.description, r.status, r.created_at, r.resolved_at,
        ru.name as reporter_name, ru.email as reporter_email,
        rpu.name as reported_user_name, rpu.email as reported_user_email,
        a.title as auction_title
      FROM reports r
      LEFT JOIN users ru ON r.reporter_id = ru.id
      LEFT JOIN users rpu ON r.reported_user_id = rpu.id
      LEFT JOIN auctions a ON r.reported_auction_id = a.id
      ORDER BY r.created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
};

// Review report
const reviewReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { action, notes } = req.body; // action: 'dismiss', 'warn', 'suspend', 'ban'

    await query(
      `UPDATE reports 
       SET status = 'reviewed', admin_action = $1, admin_notes = $2, resolved_at = NOW()
       WHERE id = $3`,
      [action, notes, reportId]
    );

    // If action is suspend or ban, update user status
    if (action === 'suspend' || action === 'ban') {
      const report = await query('SELECT reported_user_id FROM reports WHERE id = $1', [reportId]);
      if (report.rows.length > 0) {
        await query(
          `UPDATE users SET status = $1 WHERE id = $2`,
          [action === 'ban' ? 'banned' : 'suspended', report.rows[0].reported_user_id]
        );
      }
    }

    res.json({
      success: true,
      message: 'Report reviewed successfully'
    });
  } catch (error) {
    console.error('Review report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review report',
      error: error.message
    });
  }
};

// Get all transactions
const getTransactions = async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        e.id, e.escrow_id, e.auction_id, e.buyer_id, e.seller_id,
        e.amount, e.status, e.shipping_id, e.created_at,
        e.released_at, e.blockchain_tx_hash,
        a.title as auction_title,
        bu.name as buyer_name, bu.email as buyer_email,
        su.name as seller_name, su.email as seller_email
      FROM escrow_transactions e
      LEFT JOIN auctions a ON e.auction_id = a.id
      LEFT JOIN users bu ON e.buyer_id = bu.id
      LEFT JOIN users su ON e.seller_id = su.id
      ORDER BY e.created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows
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

// Release escrow
const releaseEscrow = async (req, res) => {
  const client = await getClient();
  
  try {
    const { transactionId } = req.params;

    await client.query('BEGIN');

    // Get transaction details
    const transaction = await client.query(
      'SELECT * FROM transactions WHERE id = $1',
      [transactionId]
    );

    if (transaction.rows.length === 0) {
      throw new Error('Transaction not found');
    }

    const tx = transaction.rows[0];

    // Update transaction status
    await client.query(
      `UPDATE transactions 
       SET status = 'completed', completed_at = NOW()
       WHERE id = $1`,
      [transactionId]
    );

    // Add funds to seller's wallet
    await client.query(
      `UPDATE users 
       SET wallet_balance = wallet_balance + $1
       WHERE id = $2`,
      [tx.amount, tx.seller_id]
    );

    // Record wallet transaction
    await client.query(
      `INSERT INTO wallet_transactions (user_id, amount, type, description, status)
       VALUES ($1, $2, 'credit', $3, 'completed')`,
      [tx.seller_id, tx.amount, `Payment for auction #${tx.auction_id}`]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Escrow released successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Release escrow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to release escrow',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Get seller applications
const getSellerApplications = async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        u.id, u.name, u.email, u.phone, u.role,
        u.subscription_plan, u.subscription_status,
        u.created_at, u.is_verified
      FROM users u
      WHERE u.role = 'seller' AND u.subscription_status = 'pending'
      ORDER BY u.created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        businessName: user.name, // Can be enhanced with separate business_name field
        documents: user.is_verified ? 'Verified' : 'Pending',
        status: user.subscription_status,
        appliedDate: new Date(user.created_at).toLocaleDateString()
      }))
    });
  } catch (error) {
    console.error('Get seller applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller applications',
      error: error.message
    });
  }
};

// Approve seller application
const approveSellerApplication = async (req, res) => {
  const client = await getClient();
  try {
    const { sellerId } = req.params;

    await client.query('BEGIN');

    // Get the application to find the user_id
    const appResult = await client.query(
      `SELECT user_id FROM seller_applications WHERE id = $1`,
      [sellerId]
    );

    if (appResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const userId = appResult.rows[0].user_id;

    // Update application status
    await client.query(
      `UPDATE seller_applications SET status = 'approved', reviewed_at = NOW() WHERE id = $1`,
      [sellerId]
    );

    // Upgrade user role to seller + activate subscription
    await client.query(
      `UPDATE users 
       SET role = 'seller', subscription_status = 'active', is_verified = true
       WHERE id = $1`,
      [userId]
    );

    // Notify the user
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, 'seller_approved', 'Seller Application Approved', 
       'Congratulations! Your seller application has been approved. You can now create auctions.')`,
      [userId]
    );

    await client.query('COMMIT');

    res.json({ success: true, message: 'Seller application approved and user role updated to seller' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Approve seller error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve seller', error: error.message });
  } finally {
    client.release();
  }
};

// Reject seller application
const rejectSellerApplication = async (req, res) => {
  const client = await getClient();
  try {
    const { sellerId } = req.params;
    const { reason } = req.body;

    await client.query('BEGIN');

    const appResult = await client.query(
      `SELECT user_id FROM seller_applications WHERE id = $1`,
      [sellerId]
    );

    if (appResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const userId = appResult.rows[0].user_id;

    await client.query(
      `UPDATE seller_applications 
       SET status = 'rejected', rejection_reason = $1, reviewed_at = NOW() WHERE id = $2`,
      [reason || 'Application did not meet requirements', sellerId]
    );

    // Revert role to buyer
    await client.query(
      `UPDATE users SET role = 'buyer', subscription_status = 'inactive' WHERE id = $1`,
      [userId]
    );

    // Notify the user
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, 'seller_rejected', 'Seller Application Rejected', 
       $2)`,
      [userId, `Your seller application was not approved. Reason: ${reason || 'Did not meet requirements'}. You may resubmit after addressing the issues.`]
    );

    await client.query('COMMIT');

    res.json({ success: true, message: 'Seller application rejected' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reject seller error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject seller', error: error.message });
  } finally {
    client.release();
  }
};

// Manually change a user's role (admin only)
const changeUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['buyer', 'seller', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Role must be one of: ${validRoles.join(', ')}` });
    }

    // Prevent removing the last admin
    if (role !== 'admin') {
      const adminCount = await query(`SELECT COUNT(*) FROM users WHERE role = 'admin'`);
      const currentUser = await query(`SELECT role FROM users WHERE id = $1`, [userId]);
      if (currentUser.rows[0]?.role === 'admin' && parseInt(adminCount.rows[0].count) <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot remove the last admin' });
      }
    }

    await query(`UPDATE users SET role = $1 WHERE id = $2`, [role, userId]);

    res.json({ success: true, message: `User role updated to ${role}` });
  } catch (error) {
    console.error('Change user role error:', error);
    res.status(500).json({ success: false, message: 'Failed to change role', error: error.message });
  }
};

// Add a new user directly (admin only — no OTP required)
const addUser = async (req, res) => {
  try {
    const { name, email, phone, password, role = 'buyer' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const existing = await query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists' });
    }

    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (name, email, phone, password_hash, role, is_verified, subscription_plan, subscription_status)
       VALUES ($1, $2, $3, $4, $5, true, 'free', 'active')
       RETURNING id, name, email, phone, role, is_verified, created_at`,
      [name, email, phone || null, passwordHash, role]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'User created successfully' });
  } catch (error) {
    console.error('Add user error:', error);
    res.status(500).json({ success: false, message: 'Failed to create user', error: error.message });
  }
};

// Verify / unverify a user
const toggleVerifyUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await query(`SELECT is_verified FROM users WHERE id = $1`, [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newStatus = !result.rows[0].is_verified;
    await query(`UPDATE users SET is_verified = $1 WHERE id = $2`, [newStatus, userId]);

    res.json({ success: true, message: newStatus ? 'User verified' : 'User unverified', verified: newStatus });
  } catch (error) {
    console.error('Toggle verify user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  }
};

// Block / unblock a user
const toggleBlockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await query(`SELECT is_blacklisted, role FROM users WHERE id = $1`, [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { is_blacklisted, role } = result.rows[0];
    if (role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot block an admin' });
    }

    const newStatus = !is_blacklisted;
    await query(`UPDATE users SET is_blacklisted = $1 WHERE id = $2`, [newStatus, userId]);

    res.json({ success: true, message: newStatus ? 'User blocked' : 'User unblocked', blocked: newStatus });
  } catch (error) {
    console.error('Toggle block user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  }
};

// Get activity log
const getActivityLog = async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        'User Registration' as action, 
        name as user_name, 
        'New user registered' as description,
        created_at,
        '👤' as icon
      FROM users
      WHERE created_at > NOW() - INTERVAL '7 days'
      UNION ALL
      SELECT 
        'Auction Created' as action,
        u.name as user_name,
        'Created auction: ' || a.title as description,
        a.created_at,
        '🔨' as icon
      FROM auctions a
      JOIN users u ON a.seller_id = u.id
      WHERE a.created_at > NOW() - INTERVAL '7 days'
      UNION ALL
      SELECT 
        'Bid Placed' as action,
        u.name as user_name,
        'Placed bid on: ' || a.title as description,
        b.bid_time as created_at,
        '💰' as icon
      FROM bids b
      JOIN users u ON b.bidder_id = u.id
      JOIN auctions a ON b.auction_id = a.id
      WHERE b.bid_time > NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 50`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity log',
      error: error.message
    });
  }
};

// Get enhanced statistics
const getEnhancedStatistics = async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        (SELECT COALESCE(SUM(current_bid), 0) FROM auctions WHERE status = 'completed') as total_revenue,
        (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '30 days') as active_users,
        (SELECT COUNT(*) FROM auctions) as total_auctions,
        (SELECT COUNT(*) FROM disputes WHERE status = 'pending') as pending_disputes
    `);

    res.json({
      success: true,
      data: stats.rows[0]
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getAllAuctions,
  getDisputes,
  resolveDispute,
  getReports,
  reviewReport,
  getTransactions,
  releaseEscrow,
  getSellerApplications,
  approveSellerApplication,
  rejectSellerApplication,
  getActivityLog,
  getEnhancedStatistics,
  changeUserRole,
  toggleBlockUser,
  toggleVerifyUser,
  addUser,
};
