'use client';

import { useState, useEffect } from 'react';

interface Props {
  category: string;
  onApplySuggestion?: (field: string, value: any) => void;
}

export default function AuctionCreateRecommendation({ category, onApplySuggestion }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!category) { setData(null); return; }
    setLoading(true);
    const fetchRec = async () => {
      try {
        const token = localStorage.getItem('token');
        const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${BASE}/assistant/recommend/create-auction/${encodeURIComponent(category)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchRec();
  }, [category]);

  if (!category) return null;

  if (loading) return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 mb-4 flex items-center gap-3">
      <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
      <span className="text-sm text-blue-700">AI is analyzing {category} market data...</span>
    </div>
  );

  if (!data) return null;

  return (
    <div className="rounded-xl border-2 border-purple-300 bg-purple-50 p-4 mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <span className="font-bold text-gray-800">AI Pricing Advisor</span>
          <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
            {data.market.totalAuctions} {category} auctions analyzed
          </span>
        </div>
        <span className="text-gray-500 text-sm">{expanded ? '▲ Hide' : '▼ Show'}</span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">

          {/* Market overview */}
          {data.market.totalAuctions > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Avg Final Price', value: `ETB ${data.market.avgFinalBid.toLocaleString()}`, icon: '💰' },
                { label: 'Avg Starting Bid', value: `ETB ${data.market.avgStartingBid.toLocaleString()}`, icon: '🏁' },
                { label: 'Avg Bids/Auction', value: data.market.avgBidsPerAuction, icon: '🔨' },
                { label: 'Avg Duration', value: `${data.market.avgDurationDays} days`, icon: '📅' },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-lg p-3 text-center border border-purple-100">
                  <div className="text-xl mb-1">{stat.icon}</div>
                  <div className="font-bold text-gray-800 text-sm">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Suggested pricing */}
          {data.pricing.suggestedStarting && (
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Recommended Pricing</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-gray-500">Suggested Starting Bid</p>
                  <p className="text-2xl font-black text-purple-700">
                    ETB {data.pricing.suggestedStarting.toLocaleString()}
                  </p>
                  {data.pricing.suggestedStartingRange && (
                    <p className="text-xs text-gray-400">
                      Range: ETB {data.pricing.suggestedStartingRange.low.toLocaleString()} – {data.pricing.suggestedStartingRange.high.toLocaleString()}
                    </p>
                  )}
                  {onApplySuggestion && (
                    <button
                      onClick={() => onApplySuggestion('startingBid', data.pricing.suggestedStarting)}
                      className="mt-2 text-xs bg-purple-600 text-white px-3 py-1 rounded-full hover:bg-purple-700 transition"
                    >
                      Apply this price
                    </button>
                  )}
                </div>
                <div className="flex-1 text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500">Suggested Duration</p>
                  <p className="text-2xl font-black text-gray-700">
                    {data.pricing.suggestedDurationDays} days
                  </p>
                  <p className="text-xs text-gray-400">Based on top-performing auctions</p>
                  {onApplySuggestion && (
                    <button
                      onClick={() => onApplySuggestion('duration', data.pricing.suggestedDurationDays)}
                      className="mt-2 text-xs bg-gray-600 text-white px-3 py-1 rounded-full hover:bg-gray-700 transition"
                    >
                      Apply duration
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Top examples */}
          {data.topExamples?.length > 0 && (
            <div className="bg-white rounded-lg p-3 border border-purple-100">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Top Performing {category} Auctions</p>
              <div className="space-y-2">
                {data.topExamples.map((ex: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                    <span className="text-gray-700 truncate flex-1 mr-2">🏆 {ex.title}</span>
                    <div className="flex gap-3 text-xs shrink-0">
                      <span className="text-green-600 font-medium">ETB {ex.finalBid.toLocaleString()}</span>
                      <span className="text-gray-400">{ex.bidCount} bids</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seller stats */}
          {data.sellerStats?.totalSold > 0 && (
            <div className="bg-white rounded-lg p-3 border border-purple-100 text-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Your Seller History</p>
              <p className="text-gray-700">
                You've sold <strong>{data.sellerStats.totalSold}</strong> items with an average sale of{' '}
                <strong>ETB {data.sellerStats.avgSalePrice.toLocaleString()}</strong> and{' '}
                <strong>{data.sellerStats.avgBidsReceived}</strong> bids per auction.
              </p>
            </div>
          )}

          {/* Tips */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase">AI Tips for {category}</p>
            {data.tips.map((tip: string, i: number) => (
              <p key={i} className="text-sm text-gray-700 bg-white rounded-lg p-2 border border-purple-100">{tip}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
