const { query, getClient } = require('../config/database');

// Apply to become a seller
const applyToBecomeSeller = async (req, res) => {
  const client = await getClient();
  
  try {
    const { userId } = req.user;
    const {
      businessName,
      businessType,
      businessRegistrationNumber,
      taxId,
      phone,
      email,
      address,
      documents
    } = req.body;

    // Validation
    if (!businessName || !businessType || !phone || !email) {
      return res.status(400).json({
        success: false,
        message: 'Business name, type, phone, and email are required'
      });
    }

    await client.query('BEGIN');

    // Check if user already has a pending or approved application
    const existingApp = await client.query(
      `SELECT * FROM seller_applications 
       WHERE user_id = $1 AND status IN ('pending', 'under_review', 'approved')`,
      [userId]
    );

    if (existingApp.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `You already have a ${existingApp.rows[0].status} application`,
        data: existingApp.rows[0]
      });
    }

    // Create seller application
    const result = await client.query(
      `INSERT INTO seller_applications (
        user_id, business_name, business_type, business_registration_number,
        tax_id, phone, email, address, documents, status, submitted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        userId,
        businessName,
        businessType,
        businessRegistrationNumber || null,
        taxId || null,
        phone,
        email,
        address || null,
        JSON.stringify(documents || [])
      ]
    );

    // Update user subscription status
    await client.query(
      `UPDATE users SET subscription_status = 'pending' WHERE id = $1`,
      [userId]
    );

    // Notify admin
    const adminResult = await client.query(
      `SELECT id FROM users WHERE role = 'admin' LIMIT 1`
    );

    if (adminResult.rows.length > 0) {
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES ($1, 'seller_application', 'New Seller Application', 
         'New seller application from ${businessName}')`,
        [adminResult.rows[0].id]
      );
    }

    // Notify user
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, 'application_submitted', 'Application Submitted', 
       'Your seller application has been submitted and is under review')`,
      [userId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Seller application submitted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Apply to become seller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Upload documents for seller application
const uploadDocuments = async (req, res) => {
  try {
    const { userId } = req.user;
    const { documents } = req.body; // Array of document objects with {type, url, name}

    if (!documents || !Array.isArray(documents)) {
      return res.status(400).json({
        success: false,
        message: 'Documents array is required'
      });
    }

    // Get user's application
    const appResult = await query(
      `SELECT * FROM seller_applications WHERE user_id = $1 ORDER BY submitted_at DESC LIMIT 1`,
      [userId]
    );

    if (appResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No application found. Please submit an application first.'
      });
    }

    const application = appResult.rows[0];

    // Update documents
    const existingDocs = JSON.parse(application.documents || '[]');
    const updatedDocs = [...existingDocs, ...documents];

    await query(
      `UPDATE seller_applications SET documents = $1 WHERE id = $2`,
      [JSON.stringify(updatedDocs), application.id]
    );

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      data: { documents: updatedDocs }
    });
  } catch (error) {
    console.error('Upload documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload documents',
      error: error.message
    });
  }
};

// Get my seller application
const getMyApplication = async (req, res) => {
  try {
    const { userId } = req.user;

    const result = await query(
      `SELECT sa.*, u.name as user_name, u.email as user_email
       FROM seller_applications sa
       JOIN users u ON sa.user_id = u.id
       WHERE sa.user_id = $1
       ORDER BY sa.submitted_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No application found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get my application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application',
      error: error.message
    });
  }
};

// Update application (resubmit after rejection)
const updateApplication = async (req, res) => {
  const client = await getClient();
  
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const updateData = req.body;

    await client.query('BEGIN');

    // Get application
    const appResult = await client.query(
      `SELECT * FROM seller_applications WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (appResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const application = appResult.rows[0];

    // Only allow updates if rejected
    if (application.status !== 'rejected') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Can only update rejected applications'
      });
    }

    // Update application
    const result = await client.query(
      `UPDATE seller_applications 
       SET business_name = COALESCE($1, business_name),
           business_type = COALESCE($2, business_type),
           business_registration_number = COALESCE($3, business_registration_number),
           tax_id = COALESCE($4, tax_id),
           phone = COALESCE($5, phone),
           email = COALESCE($6, email),
           address = COALESCE($7, address),
           documents = COALESCE($8, documents),
           status = 'resubmitted',
           submitted_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [
        updateData.businessName,
        updateData.businessType,
        updateData.businessRegistrationNumber,
        updateData.taxId,
        updateData.phone,
        updateData.email,
        updateData.address,
        updateData.documents ? JSON.stringify(updateData.documents) : null,
        id
      ]
    );

    // Notify admin
    const adminResult = await client.query(
      `SELECT id FROM users WHERE role = 'admin' LIMIT 1`
    );

    if (adminResult.rows.length > 0) {
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES ($1, 'seller_application', 'Seller Application Resubmitted', 
         'A seller application has been resubmitted for review')`,
        [adminResult.rows[0].id]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Application updated and resubmitted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application',
      error: error.message
    });
  } finally {
    client.release();
  }
};

module.exports = {
  applyToBecomeSeller,
  uploadDocuments,
  getMyApplication,
  updateApplication
};


// Get seller dashboard data
const getSellerDashboard = async (req, res) => {
  try {
    const { userId } = req.user;

    // Get seller's auctions
    const auctionsResult = await query(
      `SELECT 
        a.*,
        COUNT(DISTINCT b.id) as total_bids,
        MAX(b.amount) as highest_bid
       FROM auctions a
       LEFT JOIN bids b ON a.id = b.auction_id
       WHERE a.seller_id = $1
       GROUP BY a.id
       ORDER BY a.created_at DESC`,
      [userId]
    );

    // Calculate stats
    const auctions = auctionsResult.rows;
    const activeAuctions = auctions.filter(a => a.status === 'active');
    const endedAuctions = auctions.filter(a => a.status === 'ended' || a.status === 'completed');
    
    const totalRevenue = endedAuctions.reduce((sum, a) => sum + parseFloat(a.current_bid || 0), 0);
    const totalBids = auctions.reduce((sum, a) => sum + parseInt(a.total_bids || 0), 0);
    const conversionRate = auctions.length > 0 ? (endedAuctions.length / auctions.length) * 100 : 0;

    res.json({
      success: true,
      data: {
        auctions,
        stats: {
          totalRevenue,
          activeAuctions: activeAuctions.length,
          totalBids,
          conversionRate
        }
      }
    });
  } catch (error) {
    console.error('Get seller dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller dashboard',
      error: error.message
    });
  }
};

// Get seller analytics
const getSellerAnalytics = async (req, res) => {
  try {
    const { userId } = req.user;
    const { period = '30' } = req.query; // days

    // Get revenue over time
    const revenueResult = await query(
      `SELECT 
        DATE(a.end_time) as date,
        SUM(a.current_bid) as revenue,
        COUNT(*) as auctions_ended
       FROM auctions a
       WHERE a.seller_id = $1 
         AND (a.status = 'ended' OR a.status = 'completed')
         AND a.end_time >= NOW() - INTERVAL '${period} days'
       GROUP BY DATE(a.end_time)
       ORDER BY date DESC`,
      [userId]
    );

    // Get category performance
    const categoryResult = await query(
      `SELECT 
        a.category,
        COUNT(*) as total_auctions,
        SUM(a.current_bid) as total_revenue,
        AVG(a.current_bid) as avg_price
       FROM auctions a
       WHERE a.seller_id = $1
         AND (a.status = 'ended' OR a.status = 'completed')
       GROUP BY a.category
       ORDER BY total_revenue DESC`,
      [userId]
    );

    // Get top bidders
    const biddersResult = await query(
      `SELECT 
        u.name,
        u.email,
        COUNT(DISTINCT b.auction_id) as auctions_participated,
        COUNT(b.id) as total_bids,
        SUM(b.amount) as total_bid_amount
       FROM bids b
       JOIN users u ON b.bidder_id = u.id
       JOIN auctions a ON b.auction_id = a.id
       WHERE a.seller_id = $1
       GROUP BY u.id, u.name, u.email
       ORDER BY total_bids DESC
       LIMIT 10`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        revenue: revenueResult.rows,
        categories: categoryResult.rows,
        topBidders: biddersResult.rows
      }
    });
  } catch (error) {
    console.error('Get seller analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller analytics',
      error: error.message
    });
  }
};

module.exports = {
  applyToBecomeSeller,
  uploadDocuments,
  getMyApplication,
  updateApplication,
  getSellerDashboard,
  getSellerAnalytics
};
