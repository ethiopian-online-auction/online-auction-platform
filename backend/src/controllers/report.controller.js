const { query } = require('../config/database');

// Create a new report
const createReport = async (req, res) => {
  try {
    const reporterId = req.user.userId; // Changed from req.user.id to req.user.userId
    const { 
      reportedUserId, 
      reportedAuctionId, 
      reason, 
      description 
    } = req.body;

    // Validation
    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Reason is required'
      });
    }

    if (!reportedUserId && !reportedAuctionId) {
      return res.status(400).json({
        success: false,
        message: 'Must report either a user or an auction'
      });
    }

    // Check if user is trying to report themselves
    if (reportedUserId && reportedUserId === reporterId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot report yourself'
      });
    }

    // Insert report into database
    const result = await query(
      `INSERT INTO reports 
        (reporter_id, reported_user_id, reported_auction_id, reason, description, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'open', NOW())
      RETURNING id`,
      [reporterId, reportedUserId || null, reportedAuctionId || null, reason, description || null]
    );

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Our team will review it shortly.',
      data: {
        reportId: result.rows[0].id
      }
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report',
      error: error.message
    });
  }
};

module.exports = {
  createReport
};
