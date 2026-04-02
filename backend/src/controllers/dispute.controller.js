const { query } = require('../config/database');

// Create a new dispute
const createDispute = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      auctionId, 
      sellerId,
      reason, 
      description 
    } = req.body;

    // Validation
    if (!auctionId || !sellerId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Auction ID, Seller ID, and reason are required'
      });
    }

    // Check if user is the buyer of this auction
    const auctionCheck = await query(
      `SELECT winner_id FROM auctions WHERE id = $1`,
      [auctionId]
    );

    if (auctionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    // Verify the user is the winner/buyer
    if (auctionCheck.rows[0].winner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only open disputes for auctions you won'
      });
    }

    // Check if dispute already exists for this auction
    const existingDispute = await query(
      `SELECT id FROM disputes WHERE auction_id = $1 AND buyer_id = $2 AND status = 'pending'`,
      [auctionId, userId]
    );

    if (existingDispute.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A pending dispute already exists for this auction'
      });
    }

    // Insert dispute into database
    const result = await query(
      `INSERT INTO disputes 
        (auction_id, buyer_id, seller_id, reason, description, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
      RETURNING id`,
      [auctionId, userId, sellerId, reason, description || null]
    );

    res.status(201).json({
      success: true,
      message: 'Dispute opened successfully. An admin will review it shortly.',
      data: {
        disputeId: result.rows[0].id
      }
    });
  } catch (error) {
    console.error('Create dispute error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create dispute',
      error: error.message
    });
  }
};

// Get user's disputes
const getUserDisputes = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await query(
      `SELECT 
        d.id, d.auction_id, d.reason, d.description, d.status, 
        d.resolution, d.created_at, d.resolved_at,
        a.title as auction_title,
        u_seller.name as seller_name,
        u_seller.email as seller_email
      FROM disputes d
      LEFT JOIN auctions a ON d.auction_id = a.id
      LEFT JOIN users u_seller ON d.seller_id = u_seller.id
      WHERE d.buyer_id = $1
      ORDER BY d.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get user disputes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch disputes',
      error: error.message
    });
  }
};

// Get dispute by ID
const getDisputeById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { disputeId } = req.params;

    const result = await query(
      `SELECT 
        d.id, d.auction_id, d.reason, d.description, d.status, 
        d.resolution, d.created_at, d.resolved_at,
        a.title as auction_title,
        u_buyer.name as buyer_name,
        u_buyer.email as buyer_email,
        u_seller.name as seller_name,
        u_seller.email as seller_email
      FROM disputes d
      LEFT JOIN auctions a ON d.auction_id = a.id
      LEFT JOIN users u_buyer ON d.buyer_id = u_buyer.id
      LEFT JOIN users u_seller ON d.seller_id = u_seller.id
      WHERE d.id = $1 AND (d.buyer_id = $2 OR d.seller_id = $2)`,
      [disputeId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found or you do not have access'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get dispute error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dispute',
      error: error.message
    });
  }
};

module.exports = {
  createDispute,
  getUserDisputes,
  getDisputeById
};
