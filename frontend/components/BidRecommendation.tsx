'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface BidRecommendationProps {
  auctionId: string;
  onBidSelect?: (amount: number) => void;
}

export default function BidRecommendation({ auctionId, onBidSelect }: BidRecommendationProps) {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !auctionId) { setLoading(false); return; }
    const fetchRec = async () => {
      try {
        const token = localStorage.getItem('token');
        const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${BASE}/assistant/recommend/bid/${auctionId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchRec();
  }, [auctionId, isAuthenticated]);

  if (!isAuthenticated || loading || !data) return null;

  const urgencyColor: Record<string, string> = {
    critical: 'border-red-400 bg-red-50',
    high: 'border-orange-400 bg-orange-50',
    medium: 'border-yellow-400 bg-yellow-50',
    low: 'border-blue-300 bg-blue-50'
  };

  const urgencyBadge: Record<string, string> = {
    critical: 'bg-red-500 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-white',
    low: 'bg-blue-500 text-white'
  };

  return (
    <div className={`rounded-xl border-2 ${urgencyColor[data.analysis.urgency] || 'border-blue-300 bg-blue-50'} p-4 mb-4`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <span className="font-bold text-gray-800">AI Bid Advisor</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${urgencyBadge[data.analysis.urgency] || 'bg-blue-500 text-white'}`}>
            {data.analysis.urgency === 'critical' ? '⚡ Act Now' :
             data.analysis.urgency === 'high' ? '🔥 Urgent' :
             data.analysis.urgency === 'medium' ? '⏰ Soon' : '📅 Relaxed'}
          </span>
        </div>
        <span className="text-gray-500 text-sm">{expanded ? '▲ Less' : '▼ More'}</span>
      </button>

      {/* Urgency message always visible */}
      <p className="text-sm text-gray-700 mt-2 font-medium">{data.analysis.urgencyMessage}</p>

      {expanded && (
        <div className="mt-4 space-y-4">

          {/* Suggested bid amounts */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Suggested Bid Amounts</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onBidSelect?.(data.suggestedBids.minimum)}
                className="flex flex-col items-center p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition"
              >
                <span className="text-xs text-gray-500">Minimum</span>
                <span className="font-bold text-gray-800">ETB {data.suggestedBids.minimum.toLocaleString()}</span>
              </button>
              <button
                onClick={() => onBidSelect?.(data.suggestedBids.smart)}
                className="flex flex-col items-center p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition relative"
              >
                <span className="text-xs opacity-80">Smart ⭐</span>
                <span className="font-bold">ETB {data.suggestedBids.smart.toLocaleString()}</span>
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full font-bold">Best</span>
              </button>
              <button
                onClick={() => onBidSelect?.(data.suggestedBids.strong)}
                className="flex flex-col items-center p-3 bg-white border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition"
              >
                <span className="text-xs text-gray-500">Strong</span>
                <span className="font-bold text-gray-800">ETB {data.suggestedBids.strong.toLocaleString()}</span>
              </button>
            </div>
            {data.suggestedBids.buyNow && (
              <button
                onClick={() => onBidSelect?.(data.suggestedBids.buyNow)}
                className="w-full mt-2 p-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
              >
                🛒 Buy Now — ETB {data.suggestedBids.buyNow.toLocaleString()}
              </button>
            )}
          </div>

          {/* Market analysis */}
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Market Analysis</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Competition:</span>
                <span className={`ml-1 font-medium ${
                  data.analysis.competitionLevel === 'very high' ? 'text-red-600' :
                  data.analysis.competitionLevel === 'high' ? 'text-orange-600' :
                  data.analysis.competitionLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {data.analysis.competitionLevel}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Avg in category:</span>
                <span className="ml-1 font-medium text-gray-800">
                  ETB {data.analysis.avgCategoryBid.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Total bids:</span>
                <span className="ml-1 font-medium text-gray-800">{data.auction.totalBids}</span>
              </div>
              <div>
                <span className="text-gray-500">Price vs market:</span>
                <span className={`ml-1 font-medium ${
                  data.analysis.priceVsMarket === 'below_market' ? 'text-green-600' :
                  data.analysis.priceVsMarket === 'above_market' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {data.analysis.priceVsMarket === 'below_market' ? '✅ Below avg' :
                   data.analysis.priceVsMarket === 'above_market' ? '⚠️ Above avg' : '✅ Fair price'}
                </span>
              </div>
            </div>
          </div>

          {/* Wallet balance warning */}
          {data.walletBalance !== null && (
            <div className={`text-sm p-2 rounded-lg ${
              data.walletBalance < data.suggestedBids.minimum
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              💳 Your wallet: ETB {data.walletBalance.toLocaleString()}
              {data.walletBalance < data.suggestedBids.minimum && ' — Top up needed!'}
            </div>
          )}

          {/* Tips */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase">AI Tips</p>
            {data.tips.map((tip: string, i: number) => (
              <p key={i} className="text-sm text-gray-700 bg-white rounded-lg p-2 border border-gray-100">{tip}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
