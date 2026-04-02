const { query } = require('../config/database');

// Get activity logs (admin only)
const getActivityLogs = async (req, res) => {
  try {
    const { userId, actionType, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    let queryText = `
      SELECT 
        al.*,
        u.name as user_name,
        u.email as user_email
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (userId) {
      queryText += ` AND al.user_id = $${paramCount}`;
      params.push(userId);
      paramCount++;
    }

    if (actionType) {
      queryText += ` AND al.action_type = $${paramCount}`;
      params.push(actionType);
      paramCount++;
    }

    if (startDate) {
      queryText += ` AND al.created_at >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      queryText += ` AND al.created_at <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    queryText += ` ORDER BY al.created_at DESC`;
    
    const offset = (page - 1) * limit;
    queryText += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM activity_logs al WHERE 1=1`;
    const countParams = [];
    let countParamNum = 1;

    if (userId) {
      countQuery += ` AND al.user_id = $${countParamNum}`;
      countParams.push(userId);
      countParamNum++;
    }

    if (actionType) {
      countQuery += ` AND al.action_type = $${countParamNum}`;
      countParams.push(actionType);
      countParamNum++;
    }

    const countResult = await query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        logs: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message
    });
  }
};

// Get user's own activity logs
const getMyActivityLogs = async (req, res) => {
  try {
    const { userId } = req.user;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT 
        id, action_type, action_description, ip_address, 
        request_method, request_path, response_status, created_at
       FROM activity_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) FROM activity_logs WHERE user_id = $1',
      [userId]
    );

    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        logs: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get my activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message
    });
  }
};

// Get activity statistics
const getActivityStatistics = async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM activity_logs WHERE created_at > NOW() - INTERVAL '24 hours') as logs_24h,
        (SELECT COUNT(*) FROM activity_logs WHERE created_at > NOW() - INTERVAL '7 days') as logs_7d,
        (SELECT COUNT(DISTINCT user_id) FROM activity_logs WHERE created_at > NOW() - INTERVAL '24 hours') as active_users_24h,
        (SELECT COUNT(DISTINCT ip_address) FROM activity_logs WHERE created_at > NOW() - INTERVAL '24 hours') as unique_ips_24h,
        (SELECT action_type FROM activity_logs GROUP BY action_type ORDER BY COUNT(*) DESC LIMIT 1) as most_common_action
    `);

    // Get action type breakdown
    const actionBreakdown = await query(`
      SELECT action_type, COUNT(*) as count
      FROM activity_logs
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY action_type
      ORDER BY count DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        ...stats.rows[0],
        actionBreakdown: actionBreakdown.rows
      }
    });
  } catch (error) {
    console.error('Get activity statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity statistics',
      error: error.message
    });
  }
};

// Export activity logs (admin only)
const exportActivityLogs = async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    let queryText = `
      SELECT 
        al.*,
        u.name as user_name,
        u.email as user_email
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (startDate) {
      queryText += ` AND al.created_at >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      queryText += ` AND al.created_at <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    queryText += ` ORDER BY al.created_at DESC LIMIT 10000`;

    const result = await query(queryText, params);

    if (format === 'csv') {
      // Convert to CSV
      const csv = convertToCSV(result.rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=activity_logs.csv');
      res.send(csv);
    } else {
      // Return JSON
      res.json({
        success: true,
        data: result.rows
      });
    }
  } catch (error) {
    console.error('Export activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export activity logs',
      error: error.message
    });
  }
};

// Helper function to convert to CSV
function convertToCSV(data) {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(val => 
      typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
    ).join(',')
  );

  return [headers, ...rows].join('\n');
}

module.exports = {
  getActivityLogs,
  getMyActivityLogs,
  getActivityStatistics,
  exportActivityLogs
};
