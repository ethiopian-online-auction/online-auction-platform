const blockchainEscrowService = require('../services/blockchain-escrow.service');

/**
 * Create blockchain escrow
 */
exports.createEscrow = async (req, res) => {
  try {
    const { transactionId, buyerId, sellerId, amount, auctionId } = req.body;

    if (!transactionId || !buyerId || !sellerId || !amount || !auctionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const result = await blockchainEscrowService.createEscrow(
      transactionId,
      buyerId,
      sellerId,
      amount,
      auctionId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Create escrow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create escrow',
      error: error.message
    });
  }
};

/**
 * Fund escrow (buyer deposits funds)
 */
exports.fundEscrow = async (req, res) => {
  try {
    const { escrowId } = req.params;
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required'
      });
    }

    const result = await blockchainEscrowService.fundEscrow(escrowId, amount);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Fund escrow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fund escrow',
      error: error.message
    });
  }
};

/**
 * Mark item as shipped (seller)
 */
exports.markShipped = async (req, res) => {
  try {
    const { escrowId } = req.params;
    const { trackingNumber } = req.body;

    if (!trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Tracking number is required'
      });
    }

    const result = await blockchainEscrowService.markShipped(escrowId, trackingNumber);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Mark shipped error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as shipped',
      error: error.message
    });
  }
};

/**
 * Confirm delivery (buyer)
 */
exports.confirmDelivery = async (req, res) => {
  try {
    const { escrowId } = req.params;
    const buyerId = req.user.id; // From auth middleware

    const result = await blockchainEscrowService.confirmDelivery(escrowId, buyerId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Confirm delivery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm delivery',
      error: error.message
    });
  }
};

/**
 * Release funds to seller (admin)
 */
exports.releaseFunds = async (req, res) => {
  try {
    const { escrowId } = req.params;
    const adminId = req.user.id; // From auth middleware

    const result = await blockchainEscrowService.releaseFunds(escrowId, adminId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Release funds error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to release funds',
      error: error.message
    });
  }
};

/**
 * Refund to buyer (admin)
 */
exports.refundBuyer = async (req, res) => {
  try {
    const { escrowId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id; // From auth middleware

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Refund reason is required'
      });
    }

    const result = await blockchainEscrowService.refundBuyer(escrowId, reason, adminId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Refund buyer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refund buyer',
      error: error.message
    });
  }
};

/**
 * Get escrow status
 */
exports.getEscrowStatus = async (req, res) => {
  try {
    const { escrowId } = req.params;

    const result = await blockchainEscrowService.getEscrowStatus(escrowId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get escrow status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get escrow status',
      error: error.message
    });
  }
};

/**
 * Get user's escrows
 */
exports.getUserEscrows = async (req, res) => {
  try {
    const userId = req.user.id;
    const { query } = require('../config/database');

    const result = await query(
      `SELECT 
        e.*,
        u_buyer.name as buyer_name,
        u_seller.name as seller_name,
        a.title as auction_title
      FROM blockchain_escrows e
      LEFT JOIN users u_buyer ON e.buyer_id = u_buyer.id
      LEFT JOIN users u_seller ON e.seller_id = u_seller.id
      LEFT JOIN auctions a ON e.auction_id = a.id
      WHERE e.buyer_id = $1 OR e.seller_id = $1
      ORDER BY e.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get user escrows error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get escrows',
      error: error.message
    });
  }
};
