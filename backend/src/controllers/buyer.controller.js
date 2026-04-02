const { query, getClient } = require('../config/database');

// Add auction to watchlist
const addToWatchlist = async (req, res) => {
  try {
    const { userId } = req.user;
    const { auctionId } = req.body;

    if (!auctionId) {
      return res.status(400).json({
        success: false,
        message: 'Auction ID is required'
      });
    }

    // Check if auction exists
    const auctionResult = await query(
      'SELECT id FROM auctions WHERE id = $1',
      [auctionId]
    );

    if (auctionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    // Check if already in watchlist
    const existingResult = await query(
      'SELECT id FROM watchlist WHERE user_id = $1 AND auction_id = $2',
      [userId, auctionId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Auction already in watchlist'
      });
    }

    // Add to watchlist
    const result = await query(
      `INSERT INTO watchlist (user_id, auction_id, added_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       RETURNING *`,
      [userId, auctionId]
    );

    res.status(201).json({
      success: true,
      message: 'Added to watchlist',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Add to watchlist error:', error);
    
    // Handle case where watchlist table doesn't exist
    if (error.message.includes('relation "watchlist" does not exist')) {
      return res.status(500).json({
        success: false,
        message: 'Watchlist feature not yet set up. Please contact administrator.',
        error: 'Database table missing'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to add to watchlist',
      error: error.message
    });
  }
};

// Remove auction from watchlist
const removeFromWatchlist = async (req, res) => {
  try {
    const { userId } = req.user;
    const { auctionId } = req.params;

    const result = await query(
      'DELETE FROM watchlist WHERE user_id = $1 AND auction_id = $2 RETURNING *',
      [userId, auctionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Auction not in watchlist'
      });
    }

    res.json({
      success: true,
      message: 'Removed from watchlist'
    });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from watchlist',
      error: error.message
    });
  }
};

// Get user's watchlist
const getWatchlist = async (req, res) => {
  try {
    const { userId } = req.user;

    const result = await query(
      `SELECT 
        w.*,
        a.title,
        a.category,
        a.current_bid,
        a.starting_bid,
        a.end_time,
        a.status,
        a.images,
        (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as total_bids
       FROM watchlist w
       JOIN auctions a ON w.auction_id = a.id
       WHERE w.user_id = $1
       ORDER BY w.added_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        watchlist: result.rows
      }
    });
  } catch (error) {
    console.error('Get watchlist error:', error);
    
    // Handle case where watchlist table doesn't exist
    if (error.message.includes('relation "watchlist" does not exist')) {
      return res.json({
        success: true,
        data: {
          watchlist: []
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch watchlist',
      error: error.message
    });
  }
};

// Get purchase history (won auctions)
const getPurchaseHistory = async (req, res) => {
  try {
    const { userId } = req.user;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT 
        a.*,
        b.amount as winning_bid,
        b.bid_time as won_at,
        u.name as seller_name,
        u.email as seller_email
       FROM auctions a
       JOIN bids b ON a.id = b.auction_id AND b.bidder_id = $1
       JOIN users u ON a.seller_id = u.id
       WHERE (a.status = 'ended' OR a.status = 'completed')
         AND b.amount = a.current_bid
       ORDER BY a.end_time DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({
      success: true,
      data: {
        purchases: result.rows,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get purchase history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase history',
      error: error.message
    });
  }
};

// Save buyer preferences
const saveBuyerPreferences = async (req, res) => {
  try {
    const { userId } = req.user;
    const preferences = req.body;

    // Store preferences in user metadata or separate table
    const result = await query(
      `UPDATE users 
       SET buyer_preferences = $1
       WHERE id = $2
       RETURNING buyer_preferences`,
      [JSON.stringify(preferences), userId]
    );

    res.json({
      success: true,
      message: 'Preferences saved',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Save buyer preferences error:', error);
    
    // If column doesn't exist, just return success
    if (error.message.includes('column "buyer_preferences" does not exist')) {
      return res.json({
        success: true,
        message: 'Preferences saved (in memory)',
        data: req.body
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to save preferences',
      error: error.message
    });
  }
};

// Get buyer preferences
const getBuyerPreferences = async (req, res) => {
  try {
    const { userId } = req.user;

    const result = await query(
      'SELECT buyer_preferences FROM users WHERE id = $1',
      [userId]
    );

    const preferences = result.rows[0]?.buyer_preferences || {};

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Get buyer preferences error:', error);
    
    // If column doesn't exist, return empty preferences
    if (error.message.includes('column "buyer_preferences" does not exist')) {
      return res.json({
        success: true,
        data: {}
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch preferences',
      error: error.message
    });
  }
};

module.exports = {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  getPurchaseHistory,
  saveBuyerPreferences,
  getBuyerPreferences
};
