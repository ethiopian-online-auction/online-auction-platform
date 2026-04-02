const aiAssistantService = require('../services/ai-assistant.service');

/**
 * Send message to AI assistant
 */
const sendMessage = async (req, res) => {
  try {
    const userId = req.user?.userId || null;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const result = await aiAssistantService.processMessage(userId, message);

    res.json(result);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process message',
      error: error.message
    });
  }
};

/**
 * Get conversation history
 */
const getHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 10;

    const result = await aiAssistantService.getConversationHistory(userId, limit);

    res.json(result);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversation history',
      error: error.message
    });
  }
};

/**
 * Get suggested questions
 */
const getSuggestions = async (req, res) => {
  try {
    const context = req.query.context || 'general';
    const suggestions = aiAssistantService.getSuggestedQuestions(context);

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suggestions',
      error: error.message
    });
  }
};

/**
 * Get popular questions (admin only)
 */
const getPopularQuestions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = await aiAssistantService.getPopularQuestions(limit);

    res.json(result);
  } catch (error) {
    console.error('Get popular questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get popular questions',
      error: error.message
    });
  }
};

module.exports = {
  sendMessage,
  getHistory,
  getSuggestions,
  getPopularQuestions
};
