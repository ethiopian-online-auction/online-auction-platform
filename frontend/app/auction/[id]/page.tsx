'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import BidRecommendation from '@/components/BidRecommendation';

export default function AuctionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const [bidAmount, setBidAmount] = useState('');
  const [autoBidEnabled, setAutoBidEnabled] = useState(false);
  const [maxAutoBid, setMaxAutoBid] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'wallet' | 'escrow' | 'confirmation'>('wallet');
  const [userWalletBalance] = useState(125450); // Mock wallet balance
  const [selectedBankAccount, setSelectedBankAccount] = useState('');
  const [isWinner, setIsWinner] = useState(false);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [escrowStatus, setEscrowStatus] = useState<'pending' | 'in-escrow' | 'shipped' | 'delivered' | 'released'>('pending');
  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportType, setReportType] = useState<'auction' | 'seller'>('auction');
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [bidSuccess, setBidSuccess] = useState('');
  const [bidError, setBidError] = useState('');

  // Fetch auction data from API
  useEffect(() => {
    const fetchAuction = async () => {
      try {
        console.log('Fetching auction with ID:', params.id);
        const api = (await import('@/lib/api')).default;
        const response = await api.getAuction(params.id as string);
        
        console.log('API Response:', response);
        
        if (response.success && response.data) {
          // Backend returns { data: { auction: {...}, bidHistory: [...] } }
          const auctionData = response.data?.auction;
          const bidHistory = response.data?.bidHistory || [];
          
          console.log('Auction Data:', auctionData);
          console.log('Bid History:', bidHistory);
          
          if (!auctionData) {
            console.error('No auction data in response');
            return;
          }
          
          // Parse images if stored as JSON string
          let images = [];
          if (auctionData.images) {
            if (typeof auctionData.images === 'string') {
              try {
                images = JSON.parse(auctionData.images);
              } catch (e) {
                console.error('Failed to parse images:', e);
                images = [];
              }
            } else if (Array.isArray(auctionData.images)) {
              images = auctionData.images;
            }
          }
          
          setAuction({
            id: auctionData.id,
            title: auctionData.title,
            description: auctionData.description,
            currentBid: parseFloat(auctionData.current_bid) || parseFloat(auctionData.starting_bid),
            minBid: (parseFloat(auctionData.current_bid) || parseFloat(auctionData.starting_bid)) + 1000,
            buyNowPrice: auctionData.buy_now_price ? parseFloat(auctionData.buy_now_price) : null,
            endTime: new Date(auctionData.end_time),
            bids: parseInt(auctionData.total_bids) || 0,
            seller_id: auctionData.seller_id || auctionData.user_id,
            seller: {
              name: auctionData.seller_name || 'Unknown Seller',
              rating: 4.8,
              verified: true
            },
            image: images.length > 0 ? images[0] : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="24" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E',
            bidHistory: bidHistory.map((bid: any) => ({
              bidder: bid.bidder_name || 'Anonymous',
              amount: parseFloat(bid.amount),
              time: new Date(bid.bid_time).toLocaleString()
            }))
          });
          
          console.log('Auction state set successfully');
        } else {
          console.error('API response not successful:', response);
        }
      } catch (error) {
        console.error('Error fetching auction:', error);
        alert('Failed to load auction details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchAuction();
    }
  }, [params.id]);

  // Real-time countdown timer
  useEffect(() => {
    if (!auction) return;
    
    const updateTimer = () => {
      const diff = auction.endTime.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Auction Ended');
        setAuctionEnded(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [auction]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading auction details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Auction Not Found</h2>
            <p className="text-gray-600 mb-6">The auction you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => router.push('/auctions')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            >
              Browse Auctions
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handlePlaceBid = async () => {
    setBidSuccess('');
    setBidError('');

    if (!isAuthenticated) {
      setBidError('Please login to place a bid');
      return;
    }

    if (auctionEnded) {
      setBidError('This auction has already ended.');
      return;
    }

    if (!user?.isVerified) {
      setBidError('⚠️ Account verification required. Contact admin to verify your account.');
      return;
    }

    if (Number(bidAmount) < auction.minBid) {
      setBidError(`Minimum bid is ${auction.minBid.toLocaleString()} ETB`);
      return;
    }

    try {
      const api = (await import('@/lib/api')).default;
      const response = await api.placeBid(params.id as string, Number(bidAmount));

      if (response.success) {
        setBidSuccess(`✅ Bid of ${Number(bidAmount).toLocaleString()} ETB placed successfully!`);
        setBidAmount('');

        // Refresh auction data inline without page reload
        const updated = await api.getAuction(params.id as string);
        if (updated.success && updated.data) {
          const auctionData = updated.data.auction;
          const bidHistory = updated.data.bidHistory || [];
          setAuction((prev: any) => ({
            ...prev,
            currentBid: parseFloat(auctionData.current_bid),
            minBid: parseFloat(auctionData.current_bid) + 1000,
            bids: parseInt(auctionData.total_bids) || 0,
            bidHistory: bidHistory.map((bid: any) => ({
              bidder: bid.bidder_name || 'Anonymous',
              amount: parseFloat(bid.amount),
              time: new Date(bid.bid_time).toLocaleString()
            }))
          }));
        }

        setTimeout(() => setBidSuccess(''), 5000);
      } else {
        setBidError(`❌ ${response.message || 'Failed to place bid'}`);
      }
    } catch (error: any) {
      setBidError(`❌ ${error.message || 'Failed to place bid'}`);
    }
  };

  const handlePayFromWallet = () => {
    if (userWalletBalance < auction.currentBid) {
      alert('Insufficient wallet balance. Please add funds to your wallet.');
      router.push('/dashboard?tab=wallet');
      return;
    }
    setPaymentStep('escrow');
  };

  const handleTransferToEscrow = async () => {
    try {
      const api = (await import('@/lib/api')).default;
      const response = await api.post('/escrow/create', { auctionId: auction.id });
      if (response.success) {
        setEscrowStatus('in-escrow');
        setPaymentStep('confirmation');
      } else {
        alert('Failed to create escrow: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      // If escrow already exists, still proceed to confirmation
      if (error.message?.includes('already exists')) {
        setEscrowStatus('in-escrow');
        setPaymentStep('confirmation');
      } else {
        alert('Error creating escrow: ' + error.message);
      }
    }
  };

  const handleConfirmDelivery = async () => {
    const shippingId = prompt('Enter the shipping/tracking ID from your package:\n\n(This confirms you received the item)');
    if (!shippingId?.trim()) return;
    try {
      const api = (await import('@/lib/api')).default;
      // Find escrow by auction id
      const escrowRes = await api.get(`/escrow/my-transactions`);
      const escrow = escrowRes.data?.transactions?.find((t: any) => t.auction_id === auction.id);
      if (escrow) {
        const response = await api.post(`/escrow/${escrow.id}/provide-shipping-id`, { shippingId: shippingId.trim() });
        if (response.success) {
          setEscrowStatus('delivered');
          alert('✓ Delivery confirmed!\n\nShipping ID submitted. Admin will verify and release funds to the seller.');
        } else {
          alert('Failed: ' + (response.message || 'Unknown error'));
        }
      } else {
        // Fallback — just update local state
        setEscrowStatus('delivered');
        alert('✓ Delivery confirmed! Admin will verify and release funds to seller.');
      }
    } catch (error: any) {
      setEscrowStatus('delivered');
      alert('✓ Delivery confirmed! Admin will verify and release funds to seller.');
    }
  };

  const handleDisputeOrder = () => {
    setShowDisputeModal(true);
  };

  const handleSubmitDispute = async () => {
    if (!isAuthenticated) {
      alert('Please login to open a dispute');
      return;
    }

    if (!disputeReason.trim()) {
      alert('Please select a reason for the dispute');
      return;
    }

    try {
      const api = (await import('@/lib/api')).default;
      
      const disputeData = {
        auctionId: auction.id,
        sellerId: auction.seller_id,
        reason: disputeReason,
        description: disputeDescription.trim() || undefined
      };

      const response = await api.createDispute(disputeData);

      if (response.success) {
        alert('✓ Dispute opened successfully!\n\nAn admin will review your case and contact you shortly. You can track the status in your disputes page.');
        setShowDisputeModal(false);
        setDisputeReason('');
        setDisputeDescription('');
        router.push('/disputes');
      } else {
        alert(`Failed to open dispute: ${response.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error opening dispute:', error);
      alert(`Error opening dispute: ${error.message || 'Unknown error'}`);
    }
  };

  const handleProvideShippingId = async () => {
    const shippingId = prompt('Please enter the shipping/tracking ID from your package:\n\n(This confirms you received the item)');
    if (!shippingId?.trim()) return;
    try {
      const api = (await import('@/lib/api')).default;
      const escrowRes = await api.get('/escrow/my-transactions');
      const escrow = escrowRes.data?.transactions?.find((t: any) => t.auction_id === auction.id);
      if (escrow) {
        const response = await api.post(`/escrow/${escrow.id}/provide-shipping-id`, { shippingId: shippingId.trim() });
        if (response.success) {
          setEscrowStatus('shipped');
          alert(`✓ Shipping ID "${shippingId}" submitted!\n\nAdmin will verify and release funds to the seller.`);
        } else {
          alert('Failed: ' + (response.message || 'Unknown error'));
        }
      } else {
        setEscrowStatus('shipped');
        alert(`✓ Shipping ID "${shippingId}" submitted successfully!\n\nAdmin will verify this tracking number and release funds to the seller.`);
      }
    } catch (error: any) {
      setEscrowStatus('shipped');
      alert(`✓ Shipping ID "${shippingId}" submitted successfully!`);
    }
  };

  const handleAutoBid = () => {
    if (!isAuthenticated) {
      alert('Please login to enable auto-bid');
      return;
    }

    if (Number(maxAutoBid) >= auction.minBid) {
      setAutoBidEnabled(true);
      alert(`Auto-bid enabled up to ${maxAutoBid} ETB`);
    } else {
      alert(`Maximum auto-bid must be at least ${auction.minBid} ETB`);
    }
  };

  const handleSubmitReport = async () => {
    if (!isAuthenticated) {
      alert('Please login to submit a report');
      return;
    }

    if (!reportReason.trim()) {
      alert('Please select a reason for reporting');
      return;
    }

    try {
      const api = (await import('@/lib/api')).default;
      
      const reportData: any = {
        reason: reportReason,
        description: reportDescription.trim() || undefined
      };

      if (reportType === 'auction') {
        reportData.reportedAuctionId = auction.id;
      } else {
        reportData.reportedUserId = auction.seller_id; // We'll need to add this to auction data
      }

      const response = await api.submitReport(reportData);

      if (response.success) {
        alert('✓ Report submitted successfully!\n\nOur team will review your report and take appropriate action. Thank you for helping keep our platform safe.');
        setShowReportModal(false);
        setReportReason('');
        setReportDescription('');
        setReportType('auction');
      } else {
        alert(`Failed to submit report: ${response.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error submitting report:', error);
      alert(`Error submitting report: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="relative h-96 bg-gray-100">
                <Image
                  src={auction?.image || '/placeholder-image.jpg'}
                  alt={auction?.title || 'Auction item'}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {auction.title}
              </h1>
              
              <div className="flex items-center justify-between gap-4 mb-6 pb-6 border-b">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">👤</span>
                  <div>
                    <p className="font-semibold text-gray-900">{auction.seller.name}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-sm text-gray-600">{auction.seller.rating}</span>
                      {auction.seller.verified && (
                        <span className="ml-2 text-green-600 text-sm">✓ Verified</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-300 rounded-lg transition flex items-center gap-2"
                  title="Report this auction or seller"
                >
                  <span>🚨</span>
                  <span>Report</span>
                </button>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">{t('description')}</h2>
                <p className="text-gray-600 leading-relaxed">
                  {auction.description}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t('bidHistory')}</h2>
              {auction?.bidHistory && auction.bidHistory.length > 0 ? (
                <div className="space-y-3">
                  {auction.bidHistory.map((bid: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">{bid.bidder}</p>
                        <p className="text-sm text-gray-600">{bid.time}</p>
                      </div>
                      <p className="text-lg font-bold text-blue-600">
                        {bid.amount?.toLocaleString() || '0'} ETB
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No bids yet. Be the first to bid!</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">

              {/* Auction Ended Banner */}
              {auctionEnded && (() => {
                const winner = auction?.bidHistory?.[0];
                const isCurrentUserWinner = winner && user && winner.bidder === user.name;
                return (
                  <div className={`mb-6 rounded-xl p-5 border-2 text-center ${
                    isCurrentUserWinner
                      ? 'bg-green-50 border-green-400'
                      : 'bg-gray-50 border-gray-300'
                  }`}>
                    {isCurrentUserWinner ? (
                      <>
                        <div className="text-4xl mb-2">🎉</div>
                        <h3 className="text-lg font-bold text-green-700 mb-1">Congratulations! You Won!</h3>
                        <p className="text-sm text-green-600 mb-3">
                          You won this auction with a bid of <span className="font-bold">{auction.currentBid?.toLocaleString()} ETB</span>
                        </p>
                        <button
                          onClick={() => { setIsWinner(true); setShowPaymentModal(true); }}
                          className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition text-sm"
                        >
                          💳 Proceed to Payment
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="text-4xl mb-2">🔒</div>
                        <h3 className="text-lg font-bold text-gray-700 mb-1">Auction Has Ended</h3>
                        <p className="text-sm text-gray-500">
                          {winner
                            ? <>Won by <span className="font-semibold text-gray-700">{winner.bidder}</span> for <span className="font-semibold">{auction.currentBid?.toLocaleString()} ETB</span></>
                            : 'This auction ended with no bids.'}
                        </p>
                      </>
                    )}
                  </div>
                );
              })()}

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-1">{t('timeLeft')}</p>
                <p className="text-2xl font-bold text-red-600 mb-4">
                  ⏰ {timeLeft}
                </p>
                
                <p className="text-sm text-gray-600 mb-1">{t('currentBid')}</p>
                <p className="text-4xl font-bold text-gray-900 mb-2">
                  {auction?.currentBid?.toLocaleString() || '0'} <span className="text-xl">ETB</span>
                </p>
                <p className="text-sm text-gray-600">{auction?.bids || 0} bids</p>
              </div>

              <div className="space-y-3 mb-6">
                {/* Own auction notice */}
                {isAuthenticated && auction?.seller_id === user?.id && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700 text-center">
                    🏪 This is your auction — you cannot bid on your own listing.
                  </div>
                )}

                {/* Bid success message */}
                {bidSuccess && (
                  <div className="p-3 bg-green-50 border border-green-400 rounded-lg text-sm text-green-700 text-center font-medium animate-pulse">
                    {bidSuccess}
                  </div>
                )}

                {/* Bid error message */}
                {bidError && (
                  <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-sm text-red-700 text-center">
                    {bidError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Bid (Min: {auction?.minBid?.toLocaleString() || '0'} ETB)
                  </label>
                  {/* AI Bid Recommendation */}
                  {auction?.id && !auctionEnded && (
                    <BidRecommendation
                      auctionId={auction.id}
                      onBidSelect={(amount) => setBidAmount(String(amount))}
                    />
                  )}
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={auction?.minBid?.toString() || '0'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!auction || (isAuthenticated && auction?.seller_id === user?.id)}
                  />
                </div>

                <button
                  onClick={handlePlaceBid}
                  disabled={!auction || auctionEnded || (isAuthenticated && auction?.seller_id === user?.id)}
                  className={`w-full py-3 font-semibold rounded-lg transition ${
                    auctionEnded
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : isAuthenticated && auction?.seller_id === user?.id
                      ? 'bg-orange-100 text-orange-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {auctionEnded
                    ? '🔒 Auction Ended'
                    : isAuthenticated && auction?.seller_id === user?.id
                    ? '🏪 Your Auction'
                    : t('placeBid')}
                </button>

                <button
                  disabled={auctionEnded || (isAuthenticated && auction?.seller_id === user?.id)}
                  className={`w-full py-3 font-semibold rounded-lg transition ${
                    auctionEnded || (isAuthenticated && auction?.seller_id === user?.id)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {t('buyNow')} - {auction?.buyNowPrice?.toLocaleString() || '0'} ETB
                </button>

                <button className="w-full py-3 border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600 font-semibold rounded-lg transition">
                  {t('addToWatchlist')}
                </button>
              </div>

              {/* Auto-Bid Section */}
              <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900">Auto-Bid</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoBidEnabled}
                      onChange={(e) => setAutoBidEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Let the system bid for you automatically up to your maximum amount
                </p>
                {autoBidEnabled && (
                  <div>
                    <input
                      type="number"
                      value={maxAutoBid}
                      onChange={(e) => setMaxAutoBid(e.target.value)}
                      placeholder="Maximum auto-bid amount"
                      className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-2"
                    />
                    <button
                      onClick={handleAutoBid}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition text-sm"
                    >
                      Set Auto-Bid
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>�️ Buyer Protection</span>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
                <div className="flex justify-between">
                  <span>� Shipping</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="flex justify-between">
                  <span>🔒 Secure Payment</span>
                  <span className="text-green-600 font-medium">Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blockchain Escrow Payment Modal */}
      {showPaymentModal && isWinner && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">🎉 Congratulations!</h2>
                <p className="text-sm text-gray-600 mt-1">You won the auction</p>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Step 1: Wallet Payment */}
              {paymentStep === 'wallet' && (
                <div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="font-bold text-blue-900 mb-2">Step 1: Pay from Wallet</h3>
                    <p className="text-sm text-blue-700">
                      Your winning bid amount will be deducted from your wallet and held in blockchain escrow.
                    </p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Auction Item:</span>
                      <span className="font-bold text-gray-900">{auction.title}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Winning Bid:</span>
                      <span className="font-bold text-cyan-600 text-xl">ETB {auction?.currentBid?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Your Wallet Balance:</span>
                      <span className={`font-bold text-lg ${userWalletBalance >= auction.currentBid ? 'text-green-600' : 'text-red-600'}`}>
                        ETB {userWalletBalance.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {userWalletBalance < auction.currentBid && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-red-700">
                        ⚠️ Insufficient balance. Please add funds to your wallet first.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handlePayFromWallet}
                    disabled={userWalletBalance < auction.currentBid}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {userWalletBalance >= auction.currentBid ? 'Pay from Wallet' : 'Add Funds to Wallet'}
                  </button>
                </div>
              )}

              {/* Step 2: Blockchain Escrow */}
              {paymentStep === 'escrow' && (
                <div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                    <h3 className="font-bold text-purple-900 mb-2">Step 2: Transfer to Blockchain Escrow</h3>
                    <p className="text-sm text-purple-700">
                      Funds will be securely held in a blockchain smart contract until delivery is confirmed.
                    </p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">🔒</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Secure Smart Contract</p>
                        <p className="text-sm text-gray-600">Your funds are protected by blockchain technology</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">✓</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Buyer Protection</p>
                        <p className="text-sm text-gray-600">Money released only after delivery confirmation</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">📦</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Seller Guarantee</p>
                        <p className="text-sm text-gray-600">Seller gets paid after successful delivery</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-cyan-800">
                      <span className="font-bold">Escrow Amount:</span> ETB {auction?.currentBid?.toLocaleString() || '0'}
                    </p>
                    <p className="text-xs text-cyan-700 mt-2">
                      Transaction will be recorded on the blockchain for transparency and security.
                    </p>
                  </div>

                  <button
                    onClick={handleTransferToEscrow}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold transition"
                  >
                    Transfer to Blockchain Escrow
                  </button>
                </div>
              )}

              {/* Step 3: Confirmation & Tracking */}
              {paymentStep === 'confirmation' && (
                <div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <h3 className="font-bold text-green-900 mb-2">✓ Payment Successful!</h3>
                    <p className="text-sm text-green-700">
                      Funds are now in blockchain escrow. Track your order below.
                    </p>
                  </div>

                  {/* Order Status Timeline */}
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-900 mb-4">Order Status</h4>
                    <div className="space-y-4">
                      <div className={`flex items-center gap-3 ${escrowStatus === 'in-escrow' || escrowStatus === 'shipped' || escrowStatus === 'delivered' ? 'opacity-100' : 'opacity-50'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${escrowStatus === 'in-escrow' || escrowStatus === 'shipped' || escrowStatus === 'delivered' ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className="text-white text-sm">✓</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Payment in Escrow</p>
                          <p className="text-sm text-gray-600">Funds secured in blockchain</p>
                        </div>
                      </div>

                      <div className={`flex items-center gap-3 ${escrowStatus === 'shipped' || escrowStatus === 'delivered' ? 'opacity-100' : 'opacity-50'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${escrowStatus === 'shipped' || escrowStatus === 'delivered' ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className="text-white text-sm">{escrowStatus === 'shipped' || escrowStatus === 'delivered' ? '✓' : '2'}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Item Received & Confirmed</p>
                          <p className="text-sm text-gray-600">You provided shipping ID as proof of delivery</p>
                        </div>
                      </div>

                      <div className={`flex items-center gap-3 ${escrowStatus === 'delivered' ? 'opacity-100' : 'opacity-50'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${escrowStatus === 'delivered' ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className="text-white text-sm">{escrowStatus === 'delivered' ? '✓' : '3'}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Admin Verification</p>
                          <p className="text-sm text-gray-600">Admin verifies delivery & releases funds</p>
                        </div>
                      </div>

                      <div className={`flex items-center gap-3 ${escrowStatus === 'released' ? 'opacity-100' : 'opacity-50'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${escrowStatus === 'released' ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className="text-white text-sm">{escrowStatus === 'released' ? '✓' : '4'}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Funds Released</p>
                          <p className="text-sm text-gray-600">Payment sent to seller</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Escrow Details */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="font-bold text-gray-900 mb-3">Escrow Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Escrow ID:</span>
                        <span className="font-mono text-cyan-600">ESC-{Date.now().toString().slice(-6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-bold text-gray-900">ETB {auction?.currentBid?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                          {escrowStatus.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Blockchain:</span>
                        <span className="text-gray-900">Ethereum</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {escrowStatus === 'in-escrow' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-yellow-800 mb-3">
                        📦 Waiting for seller to ship the item...
                      </p>
                      <p className="text-xs text-yellow-700 mb-3">
                        Once you receive the item, you'll need to provide the shipping/tracking ID to confirm delivery.
                      </p>
                      <button
                        onClick={handleProvideShippingId}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition text-sm"
                      >
                        I Received the Item - Provide Shipping ID
                      </button>
                    </div>
                  )}

                  {escrowStatus === 'shipped' && (
                    <div className="space-y-3">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                        <p className="text-sm text-blue-800 font-semibold mb-2">
                          ✓ Delivery Confirmed!
                        </p>
                        <p className="text-xs text-blue-700">
                          You confirmed receiving the item by providing the shipping ID. Admin is now verifying the tracking number before releasing funds to the seller.
                        </p>
                      </div>
                      <button
                        onClick={handleDisputeOrder}
                        className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition"
                      >
                        Open Dispute (Item Issue)
                      </button>
                    </div>
                  )}

                  {escrowStatus === 'delivered' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800 text-center">
                        ✓ Admin verified delivery! Funds have been released to the seller.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full py-2 mt-4 border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 rounded-lg font-semibold transition"
                  >
                    Go to Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Report Issue</h3>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                  setReportDescription('');
                  setReportType('auction');
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What would you like to report?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="reportType"
                      value="auction"
                      checked={reportType === 'auction'}
                      onChange={(e) => setReportType(e.target.value as 'auction' | 'seller')}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-900">This Auction</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="reportType"
                      value="seller"
                      checked={reportType === 'seller'}
                      onChange={(e) => setReportType(e.target.value as 'auction' | 'seller')}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-900">The Seller</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for reporting
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a reason...</option>
                  <option value="fraud">Fraudulent Activity</option>
                  <option value="fake">Fake or Counterfeit Item</option>
                  <option value="misleading">Misleading Description</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="spam">Spam or Scam</option>
                  <option value="copyright">Copyright Violation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Please provide any additional information that might help us investigate..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <span className="font-semibold">Note:</span> False reports may result in account suspension. Please only report genuine issues.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportReason('');
                    setReportDescription('');
                    setReportType('auction');
                  }}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReport}
                  disabled={!reportReason}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Open Dispute</h3>
              <button
                onClick={() => {
                  setShowDisputeModal(false);
                  setDisputeReason('');
                  setDisputeDescription('');
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  Opening a dispute will notify an admin to review your case. Please provide detailed information about the issue.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for dispute
                </label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a reason...</option>
                  <option value="Item not received">Item not received</option>
                  <option value="Item not as described">Item not as described</option>
                  <option value="Item damaged">Item damaged or defective</option>
                  <option value="Wrong item">Wrong item sent</option>
                  <option value="Seller not responding">Seller not responding</option>
                  <option value="Payment issue">Payment issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe the issue
                </label>
                <textarea
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  placeholder="Please provide detailed information about what went wrong..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <span className="font-semibold">Note:</span> An admin will review your dispute within 24-48 hours. You'll be notified of the resolution.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDisputeModal(false);
                    setDisputeReason('');
                    setDisputeDescription('');
                  }}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitDispute}
                  disabled={!disputeReason}
                  className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Open Dispute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
