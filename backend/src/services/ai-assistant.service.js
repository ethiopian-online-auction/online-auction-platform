const { query } = require('../config/database');

/**
 * AI Virtual Assistant Service
 * Provides intelligent responses to user queries about the auction platform
 */

class AIAssistantService {
  constructor() {
    // Knowledge base for the auction platform
    this.knowledgeBase = {
      // Bidding related
      bidding: {
        keywords: ['bid', 'bidding', 'place bid', 'how to bid', 'minimum bid'],
        responses: [
          "To place a bid: 1) Find an auction you like, 2) Enter your bid amount (must be higher than current bid), 3) Click 'Place Bid'. Your bid will be recorded immediately!",
          "The minimum bid is always shown on the auction page. It's typically the current bid plus a minimum increment.",
          "You can enable Auto-Bid to automatically bid up to your maximum amount when others bid against you."
        ]
      },
      
      // Wallet related
      wallet: {
        keywords: ['wallet', 'balance', 'add funds', 'money', 'payment', 'deposit'],
        responses: [
          "To add funds to your wallet: Go to Dashboard → Wallet tab → Click 'Add Funds' → Enter amount → Choose payment method (Chapa, Telebirr, or CBE Birr).",
          "Your wallet balance is used for bidding and buying items. Funds are held securely until transactions complete.",
          "You can view your transaction history in the Wallet tab of your dashboard."
        ]
      },
      
      // Escrow related
      escrow: {
        keywords: ['escrow', 'payment protection', 'secure payment', 'funds held'],
        responses: [
          "When you win an auction, your payment goes into escrow - a secure holding account. The seller only receives payment after you confirm delivery.",
          "Escrow protects both buyers and sellers. Buyers are protected from fraud, and sellers are guaranteed payment for delivered items.",
          "To release escrow: Receive your item → Provide the shipping/tracking ID → Admin verifies → Funds released to seller."
        ]
      },
      
      // Seller related
      seller: {
        keywords: ['become seller', 'sell', 'create auction', 'seller account'],
        responses: [
          "To become a seller: Go to 'Become a Seller' page → Fill out the application → Upload required documents → Wait for admin approval (usually 24-48 hours).",
          "Sellers can create auctions, set starting bids, and offer 'Buy Now' prices. You'll need a verified seller account first.",
          "Seller subscription plans: Free (5 auctions/month), Premium (unlimited auctions + featured listings), Enterprise (priority support + analytics)."
        ]
      },
      
      // Dispute related
      dispute: {
        keywords: ['dispute', 'problem', 'issue', 'complaint', 'refund', 'not received'],
        responses: [
          "If you have an issue with your purchase, you can open a dispute after confirming delivery. Go to the auction page → Click 'Open Dispute' → Describe the issue.",
          "Common dispute reasons: Item not as described, item damaged, wrong item received, or item not received at all.",
          "An admin will review your dispute within 24-48 hours and make a fair decision. You may receive a full refund, partial refund, or the seller may keep the payment."
        ]
      },
      
      // Account related
      account: {
        keywords: ['account', 'profile', 'verify', 'verification', 'email', 'password'],
        responses: [
          "To verify your account: Check your email for the verification link → Click the link → Your account is now verified!",
          "Verified accounts can place bids and make purchases. Unverified accounts can only browse auctions.",
          "To update your profile: Go to Settings → Edit your information → Upload a profile photo → Save changes."
        ]
      },
      
      // General help
      general: {
        keywords: ['help', 'how', 'what', 'guide', 'tutorial', 'start'],
        responses: [
          "Welcome to our auction platform! You can browse auctions, place bids, buy items instantly, and even become a seller. What would you like to know more about?",
          "Here's what you can do: Browse auctions, place bids, use Auto-Bid, add funds to wallet, track your bids, and manage your profile.",
          "Need help with something specific? Ask me about: bidding, wallet, becoming a seller, disputes, or account verification."
        ]
      },
      
      // Auction status
      status: {
        keywords: ['auction status', 'when ends', 'time left', 'active', 'ended'],
        responses: [
          "Each auction shows a countdown timer. When it reaches zero, the auction ends and the highest bidder wins!",
          "You can see all your active bids in your Dashboard → My Bids tab.",
          "Auction statuses: Active (accepting bids), Ended (bidding closed), Completed (payment processed)."
        ]
      },
      
      // Shipping
      shipping: {
        keywords: ['shipping', 'delivery', 'tracking', 'receive item'],
        responses: [
          "After winning an auction and paying, the seller will ship your item. You'll receive tracking information.",
          "When you receive your item, provide the shipping/tracking ID on the auction page to confirm delivery. This releases payment to the seller.",
          "If you don't receive your item, you can open a dispute for a refund."
        ]
      },
      
      // Fees
      fees: {
        keywords: ['fee', 'cost', 'charge', 'commission', 'price'],
        responses: [
          "Buyers: No fees! You only pay the winning bid amount.",
          "Sellers: Free plan (5 auctions/month), Premium ($9.99/month for unlimited), Enterprise ($29.99/month with extra features).",
          "Payment processing fees: Chapa (2.5%), Telebirr (1.5%), CBE Birr (2%)."
        ]
      }
    };
  }

  /**
   * Process user message and generate response
   */
  async processMessage(userId, message) {
    try {
      const lowerMessage = message.toLowerCase();
      
      // Find matching category
      let bestMatch = null;
      let highestScore = 0;

      for (const [category, data] of Object.entries(this.knowledgeBase)) {
        const score = this.calculateMatchScore(lowerMessage, data.keywords);
        if (score > highestScore) {
          highestScore = score;
          bestMatch = { category, data };
        }
      }

      // Generate response
      let response;
      if (bestMatch && highestScore > 0) {
        // Get a random response from the matched category
        const responses = bestMatch.data.responses;
        response = responses[Math.floor(Math.random() * responses.length)];
      } else {
        // Default response for unmatched queries
        response = "I'm here to help! I can answer questions about bidding, wallet, becoming a seller, disputes, account verification, and more. What would you like to know?";
      }

      // Log the conversation
      await this.logConversation(userId, message, response, bestMatch?.category || 'unknown');

      return {
        success: true,
        response,
        category: bestMatch?.category || 'general',
        confidence: highestScore
      };
    } catch (error) {
      console.error('AI Assistant error:', error);
      return {
        success: false,
        response: "I'm having trouble right now. Please try again or contact support.",
        error: error.message
      };
    }
  }

  /**
   * Calculate match score between message and keywords
   */
  calculateMatchScore(message, keywords) {
    let score = 0;
    for (const keyword of keywords) {
      if (message.includes(keyword.toLowerCase())) {
        score += keyword.split(' ').length; // Multi-word keywords get higher score
      }
    }
    return score;
  }

  /**
   * Log conversation for analytics and improvement
   */
  async logConversation(userId, userMessage, botResponse, category) {
    try {
      await query(
        `INSERT INTO virtual_assistant_logs 
         (user_id, user_message, bot_response, category, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [userId, userMessage, botResponse, category]
      );
    } catch (error) {
      console.error('Failed to log conversation:', error);
      // Don't throw - logging failure shouldn't break the assistant
    }
  }

  /**
   * Get conversation history for a user
   */
  async getConversationHistory(userId, limit = 10) {
    try {
      const result = await query(
        `SELECT user_message, bot_response, category, created_at
         FROM virtual_assistant_logs
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
      );

      return {
        success: true,
        history: result.rows
      };
    } catch (error) {
      console.error('Failed to get conversation history:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get popular questions (for analytics)
   */
  async getPopularQuestions(limit = 10) {
    try {
      const result = await query(
        `SELECT category, COUNT(*) as count
         FROM virtual_assistant_logs
         WHERE created_at > NOW() - INTERVAL '30 days'
         GROUP BY category
         ORDER BY count DESC
         LIMIT $1`,
        [limit]
      );

      return {
        success: true,
        questions: result.rows
      };
    } catch (error) {
      console.error('Failed to get popular questions:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get suggested questions based on context
   */
  getSuggestedQuestions(context = 'general') {
    const suggestions = {
      general: [
        "How do I place a bid?",
        "How do I add funds to my wallet?",
        "How do I become a seller?",
        "What is escrow and how does it work?"
      ],
      auction: [
        "What's the minimum bid?",
        "How do I enable auto-bid?",
        "When does this auction end?",
        "Can I cancel my bid?"
      ],
      payment: [
        "How do I add funds?",
        "What payment methods are accepted?",
        "Are there any fees?",
        "How long does payment take?"
      ],
      seller: [
        "How do I create an auction?",
        "What are the seller fees?",
        "How do I get verified as a seller?",
        "What subscription plans are available?"
      ]
    };

    return suggestions[context] || suggestions.general;
  }
}

module.exports = new AIAssistantService();
