const { query } = require('../config/database');

/**
 * AI Recommendation Service
 * Provides smart bidding and auction creation advice based on real DB data
 */
class RecommendationService {

  // ─── BID RECOMMENDATIONS ────────────────────────────────────────────────────
  async getBidRecommendation(auctionId, userId) {
    try {
      // 1. Get auction details
      const auctionResult = await query(
        `SELECT a.*, u.name as seller_name,
                COUNT(DISTINCT b.id) as total_bids,
                MAX(b.amount) as highest_bid,
                MIN(b.amount) as lowest_bid,
                AVG(b.amount) as avg_bid
         FROM auctions a
         LEFT JOIN users u ON a.seller_id = u.id
         LEFT JOIN bids b ON a.id = b.auction_id
         WHERE a.id = $1
         GROUP BY a.id, u.name`,
        [auctionId]
      );

      if (auctionResult.rows.length === 0) {
        return { success: false, message: 'Auction not found' };
      }

      const auction = auctionResult.rows[0];
      const currentBid = parseFloat(auction.current_bid);
      const startingBid = parseFloat(auction.starting_bid);
      const totalBids = parseInt(auction.total_bids) || 0;
      const avgBid = parseFloat(auction.avg_bid) || currentBid;
      const buyNowPrice = auction.buy_now_price ? parseFloat(auction.buy_now_price) : null;
      const reservePrice = auction.reserve_price ? parseFloat(auction.reserve_price) : null;

      // 2. Time analysis
      const endTime = new Date(auction.end_time);
      const now = new Date();
      const hoursLeft = (endTime - now) / (1000 * 60 * 60);
      const minutesLeft = (endTime - now) / (1000 * 60);

      // 3. Get similar auctions in same category to compare prices
      const similarResult = await query(
        `SELECT AVG(current_bid) as avg_category_bid,
                MAX(current_bid) as max_category_bid,
                COUNT(*) as similar_count
         FROM auctions
         WHERE category = $1
           AND status IN ('active', 'ended')
           AND id != $2
           AND created_at > NOW() - INTERVAL '30 days'`,
        [auction.category, auctionId]
      );
      const similar = similarResult.rows[0];
      const avgCategoryBid = parseFloat(similar.avg_category_bid) || currentBid;

      // 4. Get user's bid history on this auction
      let userBid = null;
      if (userId) {
        const userBidResult = await query(
          `SELECT amount, status FROM bids
           WHERE auction_id = $1 AND bidder_id = $2
           ORDER BY amount DESC LIMIT 1`,
          [auctionId, userId]
        );
        if (userBidResult.rows.length > 0) {
          userBid = userBidResult.rows[0];
        }
      }

      // 5. Get user wallet balance
      let walletBalance = null;
      if (userId) {
        const walletResult = await query(
          'SELECT wallet_balance FROM users WHERE id = $1',
          [userId]
        );
        if (walletResult.rows.length > 0) {
          walletBalance = parseFloat(walletResult.rows[0].wallet_balance);
        }
      }

      // 6. Build recommendations
      const recommendations = [];
      const tips = [];

      // Suggested bid amounts
      const minNextBid = currentBid + 100;
      const smartBid = Math.ceil((currentBid * 1.05) / 100) * 100; // 5% above current, rounded
      const strongBid = Math.ceil((currentBid * 1.15) / 100) * 100; // 15% above, rounded

      // Urgency analysis
      let urgency = 'low';
      let urgencyMessage = '';
      if (minutesLeft < 30) {
        urgency = 'critical';
        urgencyMessage = `⚡ Only ${Math.floor(minutesLeft)} minutes left! Bid now or lose it.`;
      } else if (hoursLeft < 2) {
        urgency = 'high';
        urgencyMessage = `🔥 Less than 2 hours remaining. Competition is heating up!`;
      } else if (hoursLeft < 24) {
        urgency = 'medium';
        urgencyMessage = `⏰ Ends in ${Math.floor(hoursLeft)} hours. Don't wait too long.`;
      } else {
        urgencyMessage = `📅 ${Math.floor(hoursLeft / 24)} days left. You have time, but watch for last-minute bidders.`;
      }

      // Competition analysis
      let competitionLevel = 'low';
      if (totalBids > 20) competitionLevel = 'very high';
      else if (totalBids > 10) competitionLevel = 'high';
      else if (totalBids > 5) competitionLevel = 'medium';

      // Price vs category average
      const priceVsMarket = currentBid < avgCategoryBid * 0.8
        ? 'below_market'
        : currentBid > avgCategoryBid * 1.2
        ? 'above_market'
        : 'fair_market';

      // Build tip list
      if (priceVsMarket === 'below_market') {
        tips.push(`💡 This item is priced ${Math.round((1 - currentBid / avgCategoryBid) * 100)}% below similar ${auction.category} auctions — great value!`);
      } else if (priceVsMarket === 'above_market') {
        tips.push(`⚠️ Current bid is ${Math.round((currentBid / avgCategoryBid - 1) * 100)}% above the average for ${auction.category}. Bid carefully.`);
      } else {
        tips.push(`✅ Current price is in line with similar ${auction.category} items on the platform.`);
      }

      if (totalBids === 0) {
        tips.push(`🎯 No bids yet! You could win this at the starting price of ETB ${startingBid.toLocaleString()}.`);
      } else if (competitionLevel === 'very high') {
        tips.push(`🏆 ${totalBids} bids placed — this is a hot item. Consider using Auto-Bid to stay competitive without watching constantly.`);
      } else if (competitionLevel === 'high') {
        tips.push(`📈 ${totalBids} bids so far. Competition is active — set a maximum budget before bidding.`);
      }

      if (buyNowPrice) {
        const buyNowVsBid = buyNowPrice / currentBid;
        if (buyNowVsBid < 1.3) {
          tips.push(`🛒 Buy Now price (ETB ${buyNowPrice.toLocaleString()}) is only ${Math.round((buyNowVsBid - 1) * 100)}% above current bid. Consider buying now to guarantee the item.`);
        }
      }

      if (urgency === 'critical' || urgency === 'high') {
        tips.push(`⚡ Enable Auto-Bid now — set your maximum and let the system bid for you in the final minutes.`);
      }

      if (walletBalance !== null && walletBalance < minNextBid) {
        tips.push(`💳 Your wallet balance (ETB ${walletBalance.toLocaleString()}) is below the minimum next bid. Top up your wallet first!`);
      }

      if (userBid && userBid.status === 'outbid') {
        tips.push(`🔄 You were outbid at ETB ${parseFloat(userBid.amount).toLocaleString()}. Bid at least ETB ${minNextBid.toLocaleString()} to get back in the lead.`);
      }

      return {
        success: true,
        data: {
          auction: {
            title: auction.title,
            category: auction.category,
            currentBid,
            totalBids,
            hoursLeft: Math.max(0, hoursLeft),
            endTime: auction.end_time
          },
          suggestedBids: {
            minimum: minNextBid,
            smart: smartBid,
            strong: strongBid,
            buyNow: buyNowPrice
          },
          analysis: {
            urgency,
            urgencyMessage,
            competitionLevel,
            priceVsMarket,
            avgCategoryBid: Math.round(avgCategoryBid),
            similarAuctionsCount: parseInt(similar.similar_count) || 0
          },
          tips,
          userBid,
          walletBalance
        }
      };
    } catch (error) {
      console.error('Bid recommendation error:', error);
      return { success: false, message: error.message };
    }
  }

  // ─── AUCTION CREATION RECOMMENDATIONS ───────────────────────────────────────
  async getCreateAuctionRecommendation(category, userId) {
    try {
      // 1. Get market data for this category
      const marketResult = await query(
        `SELECT
           COUNT(*) as total_auctions,
           AVG(starting_bid) as avg_starting_bid,
           AVG(current_bid) as avg_final_bid,
           MAX(current_bid) as max_bid,
           MIN(starting_bid) as min_starting_bid,
           AVG(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) as avg_duration_hours,
           AVG(
             (SELECT COUNT(*) FROM bids WHERE auction_id = a.id)
           ) as avg_bids_per_auction
         FROM auctions a
         WHERE category = $1
           AND status IN ('active', 'ended')
           AND created_at > NOW() - INTERVAL '60 days'`,
        [category]
      );

      // 2. Get best performing auctions in category (most bids)
      const topResult = await query(
        `SELECT a.title, a.starting_bid, a.current_bid,
                COUNT(b.id) as bid_count,
                EXTRACT(EPOCH FROM (a.end_time - a.start_time)) / 3600 as duration_hours
         FROM auctions a
         LEFT JOIN bids b ON a.id = b.auction_id
         WHERE a.category = $1
           AND a.status = 'ended'
           AND a.created_at > NOW() - INTERVAL '60 days'
         GROUP BY a.id
         ORDER BY bid_count DESC
         LIMIT 3`,
        [category]
      );

      // 3. Get seller's own auction history
      let sellerStats = null;
      if (userId) {
        const sellerResult = await query(
          `SELECT COUNT(*) as total,
                  AVG(current_bid) as avg_sale,
                  AVG((SELECT COUNT(*) FROM bids WHERE auction_id = a.id)) as avg_bids
           FROM auctions a
           WHERE seller_id = $1 AND status = 'ended'`,
          [userId]
        );
        sellerStats = sellerResult.rows[0];
      }

      const market = marketResult.rows[0];
      const avgStarting = parseFloat(market.avg_starting_bid) || 0;
      const avgFinal = parseFloat(market.avg_final_bid) || 0;
      const avgDuration = parseFloat(market.avg_duration_hours) || 168;
      const avgBidsPerAuction = parseFloat(market.avg_bids_per_auction) || 0;
      const totalAuctions = parseInt(market.total_auctions) || 0;

      // Build recommendations
      const tips = [];
      const pricing = {};

      if (totalAuctions === 0) {
        tips.push(`🆕 No recent ${category} auctions found. You'd be the first — set a competitive price to attract early bidders.`);
        pricing.suggestedStarting = 1000;
        pricing.suggestedDurationDays = 7;
      } else {
        // Starting price recommendation
        // Best practice: start at 30-50% of expected final price to attract bidders
        const recommendedStart = Math.ceil((avgFinal * 0.4) / 100) * 100;
        const recommendedStartLow = Math.ceil((avgFinal * 0.3) / 100) * 100;
        const recommendedStartHigh = Math.ceil((avgFinal * 0.5) / 100) * 100;

        pricing.suggestedStarting = recommendedStart;
        pricing.suggestedStartingRange = { low: recommendedStartLow, high: recommendedStartHigh };
        pricing.avgFinalPrice = Math.round(avgFinal);
        pricing.avgStartingPrice = Math.round(avgStarting);
        pricing.suggestedDurationDays = avgDuration > 120 ? 7 : Math.round(avgDuration / 24) || 7;

        // Pricing tips
        if (avgStarting > avgFinal * 0.7) {
          tips.push(`📉 Auctions in ${category} with lower starting prices get ${Math.round(avgBidsPerAuction)} bids on average. Starting too high reduces interest.`);
        }

        tips.push(`💰 Similar ${category} auctions average ETB ${Math.round(avgFinal).toLocaleString()} final sale price. Start at ETB ${recommendedStart.toLocaleString()} to attract bidders.`);

        if (avgBidsPerAuction > 5) {
          tips.push(`🔥 ${category} is a popular category with an average of ${Math.round(avgBidsPerAuction)} bids per auction — good choice!`);
        } else if (avgBidsPerAuction < 2) {
          tips.push(`⚠️ ${category} auctions get fewer bids on average. Use high-quality photos and a detailed description to stand out.`);
        }

        // Duration tips
        if (avgDuration < 48) {
          tips.push(`⚡ Short auctions (24-48 hours) work well for ${category}. Creates urgency and drives competitive bidding.`);
        } else {
          tips.push(`📅 7-day auctions perform best for ${category} — gives more buyers time to find and bid on your item.`);
        }
      }

      // General best practice tips
      tips.push(`📸 Auctions with 5+ photos get 3x more bids. Upload clear, well-lit photos from multiple angles.`);
      tips.push(`📝 Write a detailed description including condition, dimensions, age, and any defects. Transparency builds trust.`);
      tips.push(`🏷️ Set a reserve price if you have a minimum acceptable amount — this protects you from selling too low.`);
      tips.push(`🛒 Add a 'Buy Now' price (20-30% above your expected final bid) to capture buyers who don't want to wait.`);

      // Top performing examples
      const examples = topResult.rows.map(r => ({
        title: r.title,
        startingBid: parseFloat(r.starting_bid),
        finalBid: parseFloat(r.current_bid),
        bidCount: parseInt(r.bid_count),
        durationDays: Math.round(parseFloat(r.duration_hours) / 24)
      }));

      return {
        success: true,
        data: {
          category,
          market: {
            totalAuctions,
            avgStartingBid: Math.round(avgStarting),
            avgFinalBid: Math.round(avgFinal),
            avgBidsPerAuction: Math.round(avgBidsPerAuction),
            avgDurationDays: Math.round(avgDuration / 24) || 7
          },
          pricing,
          tips,
          topExamples: examples,
          sellerStats: sellerStats ? {
            totalSold: parseInt(sellerStats.total) || 0,
            avgSalePrice: Math.round(parseFloat(sellerStats.avg_sale) || 0),
            avgBidsReceived: Math.round(parseFloat(sellerStats.avg_bids) || 0)
          } : null
        }
      };
    } catch (error) {
      console.error('Create auction recommendation error:', error);
      return { success: false, message: error.message };
    }
  }
}

module.exports = new RecommendationService();
