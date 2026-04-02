const fraudDetectionService = require('../services/ml-fraud-detection.service');
const { query } = require('../config/database');

/**
 * Analyze bid for fraud
 */
exports.analyzeBid = async (req, res) => {
  try {
    const { userId, auctionId, bidAmount } = req.body;

    if (!userId || !auctionId || !bidAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const analysis = await fraudDetectionService.analyzeUserBehavior(
      userId,
      auctionId,
      bidAmount
    );

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Analyze bid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze bid',
      error: error.message
    });
  }
};

/**
 * Get fraud detection logs (admin only)
 */
exports.getFraudLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, riskLevel, userId } = req.query;
    const offset = (page - 1) * limit;

    let queryText = `
      SELECT 
        f.*,
        u.name as user_name,
        u.email as user_email,
        a.title as auction_title
      FROM fraud_detection_logs f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN auctions a ON f.auction_id = a.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (riskLevel) {
      queryText += ` AND f.risk_level = $${paramCount}`;
      params.push(riskLevel);
      paramCount++;
    }

    if (userId) {
      queryText += ` AND f.user_id = $${paramCount}`;
      params.push(userId);
      paramCount++;
    }

    queryText += ` ORDER BY f.detected_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM fraud_detection_logs WHERE 1=1';
    const countParams = [];
    let countParamNum = 1;

    if (riskLevel) {
      countQuery += ` AND risk_level = $${countParamNum}`;
      countParams.push(riskLevel);
      countParamNum++;
    }

    if (userId) {
      countQuery += ` AND user_id = $${countParamNum}`;
      countParams.push(userId);
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        logs: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get fraud logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get fraud logs',
      error: error.message
    });
  }
};

/**
 * Provide feedback on fraud detection (admin only)
 */
exports.provideFeedback = async (req, res) => {
  try {
    const { logId } = req.params;
    const { wasActualFraud } = req.body;

    if (typeof wasActualFraud !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'wasActualFraud must be a boolean'
      });
    }

    await fraudDetectionService.provideFeedback(logId, wasActualFraud);

    res.json({
      success: true,
      message: 'Feedback recorded successfully'
    });
  } catch (error) {
    console.error('Provide feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record feedback',
      error: error.message
    });
  }
};

/**
 * Get fraud statistics (admin only)
 */
exports.getStatistics = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const stats = await fraudDetectionService.getFraudStatistics(parseInt(days));

    res.json(stats);
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message
    });
  }
};

/**
 * Get high-risk alerts (admin only)
 */
exports.getAlerts = async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        f.*,
        u.name as user_name,
        u.email as user_email,
        a.title as auction_title
      FROM fraud_detection_logs f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN auctions a ON f.auction_id = a.id
      WHERE f.risk_level IN ('high', 'critical')
      AND f.detected_at > NOW() - INTERVAL '24 hours'
      ORDER BY f.fraud_score DESC, f.detected_at DESC
      LIMIT 50`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get alerts',
      error: error.message
    });
  }
};

/**
 * Auto-tune ML thresholds from real feedback data (admin only)
 */
exports.autoTune = async (req, res) => {
  try {
    await fraudDetectionService.autoTuneThresholds();
    res.json({ success: true, message: 'ML thresholds auto-tuned from real data' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Auto-tune failed', error: error.message });
  }
};

/**
 * Get current ML thresholds (admin only)
 */
exports.getThresholds = async (req, res) => {
  try {
    const result = await query(
      `SELECT threshold_name, threshold_value, description, last_updated
       FROM ml_thresholds ORDER BY threshold_name`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get thresholds', error: error.message });
  }
};

/**
 * Get ML model accuracy from feedback data (admin only)
 */
exports.getModelAccuracy = async (req, res) => {
  try {
    const result = await query(`
      SELECT
        COUNT(*) as total_detections,
        COUNT(*) FILTER (WHERE actual_fraud IS NOT NULL) as reviewed,
        COUNT(*) FILTER (WHERE actual_fraud = true)  as confirmed_fraud,
        COUNT(*) FILTER (WHERE actual_fraud = false) as confirmed_legit,
        COUNT(*) FILTER (WHERE actual_fraud = true  AND fraud_score >= 0.5) as true_positives,
        COUNT(*) FILTER (WHERE actual_fraud = false AND fraud_score >= 0.5) as false_positives,
        COUNT(*) FILTER (WHERE actual_fraud = true  AND fraud_score <  0.5) as false_negatives,
        COUNT(*) FILTER (WHERE actual_fraud = false AND fraud_score <  0.5) as true_negatives,
        ROUND(AVG(fraud_score)::numeric, 3) as avg_fraud_score,
        ROUND(AVG(fraud_score) FILTER (WHERE actual_fraud = true)::numeric,  3) as avg_score_fraud,
        ROUND(AVG(fraud_score) FILTER (WHERE actual_fraud = false)::numeric, 3) as avg_score_legit
      FROM fraud_detection_logs
      WHERE detected_at > NOW() - INTERVAL '30 days'
    `);

    const d = result.rows[0];
    const reviewed = parseInt(d.reviewed) || 0;
    const tp = parseInt(d.true_positives)  || 0;
    const tn = parseInt(d.true_negatives)  || 0;
    const fp = parseInt(d.false_positives) || 0;
    const fn = parseInt(d.false_negatives) || 0;

    const accuracy   = reviewed > 0 ? ((tp + tn) / reviewed * 100).toFixed(1) : null;
    const precision  = (tp + fp) > 0 ? (tp / (tp + fp) * 100).toFixed(1) : null;
    const recall     = (tp + fn) > 0 ? (tp / (tp + fn) * 100).toFixed(1) : null;
    const f1 = precision && recall
      ? (2 * parseFloat(precision) * parseFloat(recall) / (parseFloat(precision) + parseFloat(recall))).toFixed(1)
      : null;

    res.json({
      success: true,
      data: {
        ...d,
        accuracy_pct: accuracy,
        precision_pct: precision,
        recall_pct: recall,
        f1_score: f1,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get model accuracy', error: error.message });
  }
};
