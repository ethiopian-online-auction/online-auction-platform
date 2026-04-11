const { query, getClient } = require('../config/database');
const fraudDetectionService = require('../services/ml-fraud-detection.service');
const notificationService = require('../services/notification.service');

// Place a bid
const placeBid = async (req, res) => {
  const client = await getClient();

  try {
    const { auctionId, amount } = req.body;
    const { userId } = req.user;

    // Run fraud detection analysis
    const fraudAnalysis = await fraudDetectionService.analyzeUserBehavior(
      userId,
      auctionId,
      amount
    );

    // Block if fraud score is too high
    if (fraudAnalysis.shouldBlock) {
      return res.status(403).json({
        success: false,
        message: 'Bid blocked due to suspicious activity',
        fraudScore: fraudAnalysis.fraudScore,
        riskLevel: fraudAnalysis.riskLevel,
        indicators: fraudAnalysis.indicators
      });
    }

    // Warn if medium/high risk but allow
    if (fraudAnalysis.riskLevel === 'medium' || fraudAnalysis.riskLevel === 'high') {
      console.warn(`⚠️ Medium/High risk bid detected:`, {
        userId,
        auctionId,
        amount,
        fraudScore: fraudAnalysis.fraudScore,
        indicators: fraudAnalysis.indicators
      });
    }

    if (!auctionId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Auction ID and amount are required'
      });
    }

    await client.query('BEGIN');

    // Get auction details
    const auctionResult = await client.query(
      `SELECT * FROM auctions WHERE id = $1`,
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

    // Validate auction status - allow both 'active' and 'pending' auctions
    if (auction.status !== 'active' && auction.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Auction is not available for bidding'
      });
    }

    // Check if auction has started
    if (new Date(auction.start_time) > new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Auction has not started yet'
      });
    }

    // Check if auction has ended
    if (new Date(auction.end_time) < new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Auction has ended'
      });
    }

    // Can't bid on own auction
    if (auction.seller_id === userId) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Cannot bid on your own auction'
      });
    }

    // Calculate minimum bid
    const minBid = parseFloat(auction.current_bid) + 100; // Minimum increment of 100 ETB

    if (parseFloat(amount) < minBid) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Minimum bid is ${minBid} ETB`
      });
    }

    // Check user wallet balance
    const userResult = await client.query(
      'SELECT wallet_balance FROM users WHERE id = $1',
      [userId]
    );

    if (parseFloat(userResult.rows[0].wallet_balance) < parseFloat(amount)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }

    // Get current highest bidder
    const currentBidderResult = await client.query(
      `SELECT bidder_id, amount FROM bids 
       WHERE auction_id = $1 AND status = 'active'
       ORDER BY amount DESC LIMIT 1`,
      [auctionId]
    );

    // Mark previous bids as outbid
    await client.query(
      `UPDATE bids SET status = 'outbid' WHERE auction_id = $1 AND status = 'active'`,
      [auctionId]
    );

    // Refund previous bidder
    if (currentBidderResult.rows.length > 0) {
      const previousBidder = currentBidderResult.rows[0];
      const refundAmount = parseFloat(previousBidder.amount);

      await client.query(
        `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
        [refundAmount, previousBidder.bidder_id]
      );

      // Log wallet transaction
      await client.query(
        `INSERT INTO wallet_transactions (
          user_id, type, amount, balance_before, balance_after, 
          reference_id, status, description
        ) VALUES ($1, $2, $3, 
          (SELECT wallet_balance - $3 FROM users WHERE id = $1),
          (SELECT wallet_balance FROM users WHERE id = $1),
          $4, 'completed', 'Bid refund - outbid on auction'
        )`,
        [previousBidder.bidder_id, 'bid_refund', refundAmount, auctionId]
      );
    }

    // Lock funds from new bidder's wallet
    await client.query(
      `UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2`,
      [amount, userId]
    );

    // Log wallet transaction
    await client.query(
      `INSERT INTO wallet_transactions (
        user_id, type, amount, balance_before, balance_after,
        reference_id, status, description
      ) VALUES ($1, $2, $3,
        (SELECT wallet_balance + $3 FROM users WHERE id = $1),
        (SELECT wallet_balance FROM users WHERE id = $1),
        $4, 'completed', 'Bid placed on auction'
      )`,
      [userId, 'bid_placed', amount, auctionId]
    );

    // Place new bid
    const bidResult = await client.query(
      `INSERT INTO bids (auction_id, bidder_id, amount, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING *`,
      [auctionId, userId, amount]
    );

    // Update auction current bid
    await client.query(
      `UPDATE auctions SET current_bid = $1 WHERE id = $2`,
      [amount, auctionId]
    );

    await client.query('COMMIT');

    // Real-time + persistent notifications (after commit so DB is consistent)
    const io = req.app.get('io');

    // Notify seller of new bid
    await notificationService.createNotification({
      userId: auction.seller_id,
      type: 'new_bid',
      title: 'New Bid Received',
      message: `Someone placed a bid of ${amount} ETB on your auction "${auction.title}"`,
      auctionId,
      io
    });

    // Notify previous bidder they were outbid
    if (currentBidderResult.rows.length > 0) {
      await notificationService.createNotification({
        userId: currentBidderResult.rows[0].bidder_id,
        type: 'outbid',
        title: 'You were outbid!',
        message: `Someone placed a higher bid on "${auction.title}". Bid again to stay in the lead.`,
        auctionId,
        io
      });
    }

    // Broadcast live bid update to everyone watching this auction
    if (io) {
      io.to(`auction:${auctionId}`).emit('bid:placed', {
        auctionId,
        amount,
        totalBids: await getBidCount(auctionId)
      });
    }

    res.json({
      success: true,
      message: 'Bid placed successfully',
      data: bidResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Place bid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to place bid',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Enable auto-bid
const enableAutoBid = async (req, res) => {
  const client = await getClient();

  try {
    const { auctionId, maxAmount } = req.body;
    const { userId } = req.user;

    if (!auctionId || !maxAmount) {
      return res.status(400).json({
        success: false,
        message: 'Auction ID and max amount are required'
      });
    }

    await client.query('BEGIN');

    // Get auction details
    const auctionResult = await client.query(
      'SELECT * FROM auctions WHERE id = $1',
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

    if (auction.status !== 'active') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Auction is not active'
      });
    }

    // Check if user already has an active bid
    const existingBid = await client.query(
      `SELECT * FROM bids WHERE auction_id = $1 AND bidder_id = $2 AND status = 'active'`,
      [auctionId, userId]
    );

    if (existingBid.rows.length > 0) {
      // Update existing bid with auto-bid settings
      await client.query(
        `UPDATE bids SET is_auto_bid = true, max_auto_bid = $1 WHERE id = $2`,
        [maxAmount, existingBid.rows[0].id]
      );
    } else {
      // Place initial bid with auto-bid enabled
      const minBid = parseFloat(auction.current_bid) + 100;

      await client.query(
        `INSERT INTO bids (auction_id, bidder_id, amount, is_auto_bid, max_auto_bid, status)
         VALUES ($1, $2, $3, true, $4, 'active')`,
        [auctionId, userId, minBid, maxAmount]
      );

      await client.query(
        `UPDATE auctions SET current_bid = $1 WHERE id = $2`,
        [minBid, auctionId]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Auto-bid enabled successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Auto-bid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enable auto-bid',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Get user's bids
const getMyBids = async (req, res) => {
  try {
    const { userId } = req.user;
    const { status, page = 1, limit = 20 } = req.query;

    let queryText = `
      SELECT 
        b.*,
        a.title as auction_title,
        a.status as auction_status,
        a.end_time,
        a.current_bid,
        a.images,
        CASE 
          WHEN b.amount = a.current_bid THEN true
          ELSE false
        END as is_winning
      FROM bids b
      LEFT JOIN auctions a ON b.auction_id = a.id
      WHERE b.bidder_id = $1
    `;

    const queryParams = [userId];
    let paramCount = 2;

    if (status) {
      queryText += ` AND b.status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }

    queryText += ` ORDER BY b.bid_time DESC`;

    const offset = (page - 1) * limit;
    queryText += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      data: {
        bids: result.rows,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get my bids error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bids',
      error: error.message
    });
  }
};

// Helper function
async function getBidCount(auctionId) {
  const result = await query(
    'SELECT COUNT(*) FROM bids WHERE auction_id = $1',
    [auctionId]
  );
  return parseInt(result.rows[0].count);
}

module.exports = {
  placeBid,
  enableAutoBid,
  getMyBids
};
