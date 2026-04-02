const { query, getClient } = require('../config/database');

// Get all auctions with filters
const getAuctions = async (req, res) => {
  try {
    const {
      category,
      status, // No default - show all active and pending if not specified
      search,
      minPrice,
      maxPrice,
      sortBy = 'end_time',
      order = 'ASC',
      page = 1,
      limit = 20
    } = req.query;

    let queryText = `
      SELECT
        a.*,
        u.name as seller_name,
        u.email as seller_email,
        COUNT(DISTINCT b.id) as total_bids
      FROM auctions a
      LEFT JOIN users u ON a.seller_id = u.id
      LEFT JOIN bids b ON a.id = b.auction_id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramCount = 1;

    // Show active and pending auctions by default, or filter by specific status
    if (status) {
      queryText += ` AND a.status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    } else {
      // Default: show active and pending (not ended/cancelled)
      queryText += ` AND a.status IN ($${paramCount}, $${paramCount + 1})`;
      queryParams.push('active', 'pending');
      paramCount += 2;
    }

    if (category) {
      queryText += ` AND a.category = $${paramCount}`;
      queryParams.push(category);
      paramCount++;
    }

    if (search) {
      queryText += ` AND (a.title ILIKE $${paramCount} OR a.description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    if (minPrice) {
      queryText += ` AND a.current_bid >= $${paramCount}`;
      queryParams.push(minPrice);
      paramCount++;
    }

    if (maxPrice) {
      queryText += ` AND a.current_bid <= $${paramCount}`;
      queryParams.push(maxPrice);
      paramCount++;
    }

    queryText += ` GROUP BY a.id, u.name, u.email`;
    queryText += ` ORDER BY a.${sortBy} ${order}`;

    const offset = (page - 1) * limit;
    queryText += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      data: {
        auctions: result.rows,
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Get auctions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch auctions',
      error: error.message
    });
  }
};

// Get single auction by ID
const getAuctionById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        a.*,
        u.name as seller_name,
        u.email as seller_email,
        u.phone as seller_phone,
        COUNT(DISTINCT b.id) as total_bids,
        MAX(b.amount) as highest_bid
      FROM auctions a
      LEFT JOIN users u ON a.seller_id = u.id
      LEFT JOIN bids b ON a.id = b.auction_id
      WHERE a.id = $1
      GROUP BY a.id, u.name, u.email, u.phone`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    // Get bid history
    const bidsResult = await query(
      `SELECT 
        b.id,
        b.amount,
        b.bid_time,
        b.is_auto_bid,
        u.name as bidder_name
      FROM bids b
      LEFT JOIN users u ON b.bidder_id = u.id
      WHERE b.auction_id = $1
      ORDER BY b.bid_time DESC
      LIMIT 10`,
      [id]
    );

    res.json({
      success: true,
      data: {
        auction: result.rows[0],
        bidHistory: bidsResult.rows
      }
    });
  } catch (error) {
    console.error('Get auction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch auction',
      error: error.message
    });
  }
};

// Create new auction
const createAuction = async (req, res) => {
  const client = await getClient();
  
  try {
    const {
      title,
      description,
      category,
      startingBid,
      buyNowPrice,
      reservePrice,
      startTime,
      endTime,
      images,
      shippingInfo,
      itemCondition,
      isPrivate = false
    } = req.body;

    const { userId } = req.user;

    // Validate required fields
    if (!title || !description || !category || !startingBid || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO auctions (
        seller_id, title, description, category, starting_bid, current_bid,
        buy_now_price, reserve_price, start_time, end_time, images,
        shipping_info, item_condition, is_private, status
      ) VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        userId,
        title,
        description,
        category,
        startingBid,
        buyNowPrice || null,
        reservePrice || null,
        startTime || new Date(),
        endTime,
        JSON.stringify(images || []),
        JSON.stringify(shippingInfo || {}),
        itemCondition,
        isPrivate,
        startTime && new Date(startTime) > new Date() ? 'pending' : 'active'
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Auction created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create auction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create auction',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Update auction
const updateAuction = async (req, res) => {
  const client = await getClient();
  
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const updates = req.body;

    await client.query('BEGIN');

    // Check if auction belongs to user
    const auctionCheck = await client.query(
      'SELECT seller_id, status FROM auctions WHERE id = $1',
      [id]
    );

    if (auctionCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    if (auctionCheck.rows[0].seller_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this auction'
      });
    }

    // Can't update active auctions with bids
    if (auctionCheck.rows[0].status === 'active') {
      const bidsCheck = await client.query(
        'SELECT COUNT(*) FROM bids WHERE auction_id = $1',
        [id]
      );
      
      if (parseInt(bidsCheck.rows[0].count) > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Cannot update auction with existing bids'
        });
      }
    }

    // Build update query dynamically
    const allowedFields = ['title', 'description', 'buy_now_price', 'images', 'shipping_info'];
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(updates[key]);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updateValues.push(id);
    const result = await client.query(
      `UPDATE auctions SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      updateValues
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Auction updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update auction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update auction',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Delete/Cancel auction
const deleteAuction = async (req, res) => {
  const client = await getClient();
  
  try {
    const { id } = req.params;
    const { userId } = req.user;

    await client.query('BEGIN');

    // Check if auction belongs to user
    const auctionCheck = await client.query(
      'SELECT seller_id, status FROM auctions WHERE id = $1',
      [id]
    );

    if (auctionCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    if (auctionCheck.rows[0].seller_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this auction'
      });
    }

    // Check for bids
    const bidsCheck = await client.query(
      'SELECT COUNT(*) FROM bids WHERE auction_id = $1',
      [id]
    );

    if (parseInt(bidsCheck.rows[0].count) > 0) {
      // Can't delete, only cancel
      await client.query(
        'UPDATE auctions SET status = $1 WHERE id = $2',
        ['cancelled', id]
      );
      
      await client.query('COMMIT');
      
      return res.json({
        success: true,
        message: 'Auction cancelled (had bids)'
      });
    }

    // No bids, can delete
    await client.query('DELETE FROM auctions WHERE id = $1', [id]);
    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Auction deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete auction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete auction',
      error: error.message
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getAuctions,
  getAuctionById,
  createAuction,
  updateAuction,
  deleteAuction
};
