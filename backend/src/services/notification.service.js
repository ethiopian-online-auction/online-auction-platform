const { query } = require('../config/database');

/**
 * Notification Service
 * Handles creating, fetching, and managing notifications.
 * Also broadcasts real-time events via Socket.IO when io is provided.
 */

/**
 * Create a notification and optionally push it via Socket.IO
 * @param {object} params
 * @param {string} params.userId        - recipient user UUID
 * @param {string} params.type          - new_bid | outbid | auction_won | auction_ended | payment | system
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} [params.auctionId]   - related auction UUID (optional)
 * @param {string} [params.link]        - frontend link (optional)
 * @param {object} [params.io]          - Socket.IO server instance (optional)
 */
async function createNotification({ userId, type, title, message, auctionId = null, link = null, io = null }) {
    const result = await query(
        `INSERT INTO notifications (user_id, type, title, message, related_auction_id, is_read)
     VALUES ($1, $2, $3, $4, $5, false)
     RETURNING *`,
        [userId, type, title, message, auctionId]
    );

    const notification = result.rows[0];

    // Push real-time event to the user's personal room
    if (io) {
        io.to(`user:${userId}`).emit('notification:new', {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            is_read: false,
            created_at: notification.created_at,
            link: link || (auctionId ? `/auction/${auctionId}` : '#')
        });
    }

    return notification;
}

/**
 * Get all notifications for a user (newest first, limit 50)
 */
async function getUserNotifications(userId) {
    const result = await query(
        `SELECT id, type, title, message, is_read, related_auction_id, created_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
        [userId]
    );
    return result.rows;
}

/**
 * Mark a single notification as read
 */
async function markAsRead(notificationId, userId) {
    const result = await query(
        `UPDATE notifications SET is_read = true
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
        [notificationId, userId]
    );
    return result.rows[0] || null;
}

/**
 * Mark all notifications as read for a user
 */
async function markAllAsRead(userId) {
    await query(
        `UPDATE notifications SET is_read = true WHERE user_id = $1`,
        [userId]
    );
}

/**
 * Get unread count for a user
 */
async function getUnreadCount(userId) {
    const result = await query(
        `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
        [userId]
    );
    return parseInt(result.rows[0].count, 10);
}

module.exports = {
    createNotification,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount
};
