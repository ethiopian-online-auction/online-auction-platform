const { query, getClient } = require('../config/database');

// Get user profile
const getProfile = async (req, res) => {
  try {
    const { userId } = req.user;

    const result = await query(
      `SELECT 
        id, name, email, phone, role, is_verified, wallet_balance,
        subscription_plan, subscription_status, commission_rate,
        language_preference, profile_photo, created_at
      FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  const client = await getClient();
  
  try {
    const { userId } = req.user;
    const { name, phone, languagePreference, profile_photo } = req.body;

    await client.query('BEGIN');

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (phone) {
      updates.push(`phone = $${paramCount}`);
      values.push(phone);
      paramCount++;
    }

    if (languagePreference) {
      updates.push(`language_preference = $${paramCount}`);
      values.push(languagePreference);
      paramCount++;
    }

    if (profile_photo !== undefined) {
      updates.push(`profile_photo = $${paramCount}`);
      values.push(profile_photo);
      paramCount++;
    }

    if (updates.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(userId);
    const result = await client.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING 
       id, name, email, phone, role, wallet_balance, subscription_plan, language_preference, profile_photo`,
      values
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getProfile,
  updateProfile
};
