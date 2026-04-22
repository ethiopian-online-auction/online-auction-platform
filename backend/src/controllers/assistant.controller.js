const aiAssistantService = require('../services/ai-assistant.service');
const recommendationService = require('../services/recommendation.service');

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

/**
 * Get bid recommendation for a specific auction
 */
const getBidRecommendation = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const userId = req.user?.userId || null;
    const result = await recommendationService.getBidRecommendation(auctionId, userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get bid recommendation' });
  }
};

/**
 * Get auction creation recommendations for a category
 */
const getCreateAuctionRecommendation = async (req, res) => {
  try {
    const { category } = req.params;
    const userId = req.user?.userId || null;
    const result = await recommendationService.getCreateAuctionRecommendation(category, userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get auction recommendation' });
  }
};

module.exports = {
  sendMessage,
  getHistory,
  getSuggestions,
  getPopularQuestions,
  getBidRecommendation,
  getCreateAuctionRecommendation
};
