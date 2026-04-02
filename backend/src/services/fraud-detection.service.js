const { query, getClient } = require('../config/database');

class FraudDetectionService {
  // Check for suspicious activity patterns
  async checkSuspiciousActivity(userId, activityType, metadata = {}) {
    const checks = [
      this.checkMultipleAccounts(userId, metadata.ipAddress),
      this.checkRapidActions(userId, activityType),
      this.checkUnusualBidding(userId),
      this.checkFailedLogins(userId),
      this.checkLocationChanges(userId, metadata.ipAddress)
    ];

    const results = await Promise.all(checks);
    const suspiciousActivities = results.filter(r => r.isSuspicious);

    if (suspiciousActivities.length > 0) {
      await this.createFraudAlert(userId, suspiciousActivities, metadata);
      await this.updateUserFraudScore(userId, suspiciousActivities);
    }

    return {
      isSuspicious: suspiciousActivities.length > 0,
      alerts: suspiciousActivities
    };
  }

  // Check for multiple accounts from same IP
  async checkMultipleAccounts(userId, ipAddress) {
    if (!ipAddress) return { isSuspicious: false };

    try {
      const result = await query(
        `SELECT COUNT(DISTINCT user_id) as account_count
         FROM activity_logs
         WHERE ip_address = $1
         AND created_at > NOW() - INTERVAL '24 hours'`,
        [ipAddress]
      );

      const accountCount = parseInt(result.rows[0]?.account_count || 0);
      
      if (accountCount > 3) {
        return {
          isSuspicious: true,
          type: 'multiple_accounts',
          severity: 'high',
          description: `${accountCount} different accounts accessed from same IP in 24 hours`,
          riskScore: 30
        };
      }
    } catch (error) {
      console.error('Multiple accounts check error:', error);
    }

    return { isSuspicious: false };
  }

  // Check for rapid actions (bot-like behavior)
  async checkRapidActions(userId, actionType) {
    try {
      const result = await query(
        `SELECT COUNT(*) as action_count
         FROM activity_logs
         WHERE user_id = $1
         AND action_type = $2
         AND created_at > NOW() - INTERVAL '5 minutes'`,
        [userId, actionType]
      );

      const actionCount = parseInt(result.rows[0]?.action_count || 0);
      
      if (actionCount > 10) {
        return {
          isSuspicious: true,
          type: 'rapid_actions',
          severity: 'medium',
          description: `${actionCount} ${actionType} actions in 5 minutes (possible bot)`,
          riskScore: 20
        };
      }
    } catch (error) {
      console.error('Rapid actions check error:', error);
    }

    return { isSuspicious: false };
  }

  // Check for unusual bidding patterns
  async checkUnusualBidding(userId) {
    try {
      // Check for bid sniping (bidding in last seconds repeatedly)
      const snipingResult = await query(
        `SELECT COUNT(*) as snipe_count
         FROM bids b
         JOIN auctions a ON b.auction_id = a.id
         WHERE b.bidder_id = $1
         AND b.created_at > a.end_time - INTERVAL '30 seconds'
         AND b.created_at > NOW() - INTERVAL '7 days'`,
        [userId]
      );

      const snipeCount = parseInt(snipingResult.rows[0]?.snipe_count || 0);
      
      if (snipeCount > 5) {
        return {
          isSuspicious: true,
          type: 'bid_sniping',
          severity: 'low',
          description: `Bid sniping detected: ${snipeCount} last-second bids in 7 days`,
          riskScore: 10
        };
      }

      // Check for bid cancellation pattern
      const cancellationResult = await query(
        `SELECT COUNT(*) as cancel_count
         FROM bids
         WHERE bidder_id = $1
         AND status = 'cancelled'
         AND created_at > NOW() - INTERVAL '7 days'`,
        [userId]
      );

      const cancelCount = parseInt(cancellationResult.rows[0]?.cancel_count || 0);
      
      if (cancelCount > 3) {
        return {
          isSuspicious: true,
          type: 'frequent_cancellations',
          severity: 'medium',
          description: `${cancelCount} bid cancellations in 7 days`,
          riskScore: 15
        };
      }
    } catch (error) {
      console.error('Unusual bidding check error:', error);
    }

    return { isSuspicious: false };
  }

  // Check for failed login attempts
  async checkFailedLogins(userId) {
    try {
      const result = await query(
        `SELECT failed_login_attempts
         FROM users
         WHERE id = $1`,
        [userId]
      );

      const failedAttempts = parseInt(result.rows[0]?.failed_login_attempts || 0);
      
      if (failedAttempts >= 5) {
        return {
          isSuspicious: true,
          type: 'failed_logins',
          severity: 'high',
          description: `${failedAttempts} failed login attempts`,
          riskScore: 25
        };
      }
    } catch (error) {
      console.error('Failed logins check error:', error);
    }

    return { isSuspicious: false };
  }

  // Check for suspicious location changes
  async checkLocationChanges(userId, currentIp) {
    if (!currentIp) return { isSuspicious: false };

    try {
      const result = await query(
        `SELECT DISTINCT ip_address
         FROM activity_logs
         WHERE user_id = $1
         AND created_at > NOW() - INTERVAL '1 hour'
         ORDER BY created_at DESC
         LIMIT 5`,
        [userId]
      );

      const recentIps = result.rows.map(r => r.ip_address);
      const uniqueIps = new Set(recentIps);
      
      if (uniqueIps.size > 3) {
        return {
          isSuspicious: true,
          type: 'location_hopping',
          severity: 'high',
          description: `Account accessed from ${uniqueIps.size} different IPs in 1 hour`,
          riskScore: 30
        };
      }
    } catch (error) {
      console.error('Location changes check error:', error);
    }

    return { isSuspicious: false };
  }

  // Create fraud alert
  async createFraudAlert(userId, suspiciousActivities, metadata) {
    try {
      const highestSeverity = this.getHighestSeverity(suspiciousActivities);
      const totalRiskScore = suspiciousActivities.reduce((sum, a) => sum + (a.riskScore || 0), 0);
      
      const descriptions = suspiciousActivities.map(a => a.description).join('; ');
      
      await query(
        `INSERT INTO fraud_alerts (
          user_id, alert_type, severity, description, evidence, ip_address, status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
        [
          userId,
          suspiciousActivities[0].type,
          highestSeverity,
          descriptions,
          JSON.stringify({ activities: suspiciousActivities, metadata }),
          metadata.ipAddress || null
        ]
      );

      // Log suspicious activity
      for (const activity of suspiciousActivities) {
        await query(
          `INSERT INTO suspicious_activities (
            user_id, activity_type, description, risk_score, ip_address, metadata, auto_flagged
          ) VALUES ($1, $2, $3, $4, $5, $6, true)`,
          [
            userId,
            activity.type,
            activity.description,
            activity.riskScore || 0,
            metadata.ipAddress || null,
            JSON.stringify(metadata)
          ]
        );
      }
    } catch (error) {
      console.error('Create fraud alert error:', error);
    }
  }

  // Update user fraud score
  async updateUserFraudScore(userId, suspiciousActivities) {
    try {
      const totalRiskScore = suspiciousActivities.reduce((sum, a) => sum + (a.riskScore || 0), 0);
      
      await query(
        `UPDATE users
         SET fraud_score = LEAST(fraud_score + $1, 100),
             last_suspicious_activity = NOW()
         WHERE id = $2`,
        [totalRiskScore, userId]
      );

      // Auto-lock account if fraud score is too high
      const userResult = await query(
        'SELECT fraud_score FROM users WHERE id = $1',
        [userId]
      );
      
      const fraudScore = parseInt(userResult.rows[0]?.fraud_score || 0);
      
      if (fraudScore >= 80) {
        await query(
          `UPDATE users
           SET account_locked_until = NOW() + INTERVAL '24 hours'
           WHERE id = $1`,
          [userId]
        );
      }
    } catch (error) {
      console.error('Update fraud score error:', error);
    }
  }

  // Get highest severity from activities
  getHighestSeverity(activities) {
    const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
    let highest = 'low';
    
    activities.forEach(activity => {
      if (severityOrder[activity.severity] > severityOrder[highest]) {
        highest = activity.severity;
      }
    });
    
    return highest;
  }

  // Get fraud statistics
  async getFraudStatistics() {
    try {
      const stats = await query(`
        SELECT 
          (SELECT COUNT(*) FROM fraud_alerts WHERE status = 'pending') as pending_alerts,
          (SELECT COUNT(*) FROM fraud_alerts WHERE created_at > NOW() - INTERVAL '24 hours') as alerts_24h,
          (SELECT COUNT(*) FROM users WHERE fraud_score > 50) as high_risk_users,
          (SELECT COUNT(*) FROM users WHERE account_locked_until > NOW()) as locked_accounts,
          (SELECT AVG(fraud_score) FROM users) as avg_fraud_score
      `);

      return stats.rows[0];
    } catch (error) {
      console.error('Get fraud statistics error:', error);
      return {};
    }
  }
}

module.exports = new FraudDetectionService();
