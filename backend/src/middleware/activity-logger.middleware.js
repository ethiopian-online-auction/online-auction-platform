const { query } = require('../config/database');

// Activity logging middleware
const logActivity = (actionType) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    const startTime = Date.now();

    // Capture response
    res.send = function (data) {
      res.send = originalSend;
      
      // Log activity asynchronously (don't block response)
      setImmediate(async () => {
        try {
          const userId = req.user?.userId || null;
          const ipAddress = req.ip || req.connection.remoteAddress;
          const userAgent = req.get('user-agent');
          const duration = Date.now() - startTime;

          // Sanitize request body (remove sensitive data)
          const sanitizedBody = sanitizeRequestBody(req.body);

          await query(
            `INSERT INTO activity_logs (
              user_id, action_type, action_description, ip_address, user_agent,
              request_method, request_path, request_body, response_status, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              userId,
              actionType,
              generateDescription(actionType, req),
              ipAddress,
              userAgent,
              req.method,
              req.path,
              JSON.stringify(sanitizedBody),
              res.statusCode,
              JSON.stringify({ duration, query: req.query })
            ]
          );
        } catch (error) {
          console.error('Activity logging error:', error);
          // Don't throw - logging failures shouldn't break the app
        }
      });

      return res.send(data);
    };

    next();
  };
};

// Sanitize sensitive data from request body
function sanitizeRequestBody(body) {
  if (!body) return {};
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

// Generate human-readable description
function generateDescription(actionType, req) {
  const descriptions = {
    'user_login': `User logged in from ${req.ip}`,
    'user_logout': 'User logged out',
    'user_register': 'New user registered',
    'auction_create': `Created auction: ${req.body?.title || 'Untitled'}`,
    'auction_update': `Updated auction: ${req.params?.id}`,
    'auction_delete': `Deleted auction: ${req.params?.id}`,
    'bid_place': `Placed bid on auction: ${req.body?.auctionId}`,
    'bid_cancel': `Cancelled bid: ${req.params?.id}`,
    'wallet_add_funds': `Added funds: ${req.body?.amount} ETB`,
    'wallet_withdraw': `Withdrew funds: ${req.body?.amount} ETB`,
    'profile_update': 'Updated profile information',
    'password_change': 'Changed password',
    'seller_apply': 'Applied to become seller',
    'report_submit': 'Submitted a report',
    'dispute_open': 'Opened a dispute',
  };
  
  return descriptions[actionType] || `Performed action: ${actionType}`;
}

// Log specific actions
const logLogin = logActivity('user_login');
const logLogout = logActivity('user_logout');
const logRegister = logActivity('user_register');
const logAuctionCreate = logActivity('auction_create');
const logAuctionUpdate = logActivity('auction_update');
const logAuctionDelete = logActivity('auction_delete');
const logBidPlace = logActivity('bid_place');
const logWalletTransaction = logActivity('wallet_transaction');
const logProfileUpdate = logActivity('profile_update');
const logPasswordChange = logActivity('password_change');

module.exports = {
  logActivity,
  logLogin,
  logLogout,
  logRegister,
  logAuctionCreate,
  logAuctionUpdate,
  logAuctionDelete,
  logBidPlace,
  logWalletTransaction,
  logProfileUpdate,
  logPasswordChange
};
