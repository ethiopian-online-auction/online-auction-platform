'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import AuctionCard from '@/components/AuctionCard';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [featuredAuctions, setFeaturedAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    fetchFeaturedAuctions();
  }, []);

  const fetchFeaturedAuctions = async () => {
    try {
      const api = (await import('@/lib/api')).default;
      const response = await api.getAuctions({ limit: 100 });
      if (response.success && response.data) {
        const auctionsData = Array.isArray(response.data)
          ? response.data
          : ((response.data as any).auctions || []);
        const validAuctions = auctionsData.filter((a: any) =>
          a.status === 'active' || a.status === 'pending'
        );
        const transformed = validAuctions.slice(0, 6).map((auction: any) => ({
          id: auction.id,
          title: auction.title,
          image: getAuctionImage(auction),
          currentBid: parseFloat(auction.current_bid),
          timeLeft: auction.status === 'pending'
            ? calculateTimeUntilStart(auction.start_time)
            : calculateTimeLeft(auction.end_time),
          bids: parseInt(auction.total_bids) || 0,
          status: auction.status
        }));
        setFeaturedAuctions(transformed);
      }
    } catch (error) {
      console.error('Error fetching auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAuctionImage = (auction: any) => {
    if (auction.image) return auction.image;
    if (auction.images) {
      try {
        const arr = typeof auction.images === 'string' ? JSON.parse(auction.images) : auction.images;
        if (Array.isArray(arr) && arr.length > 0) return arr[0];
      } catch (e) {}
    }
    return '/Image/placeholder.jpg';
  };

  const calculateTimeLeft = (endTime: string) => {
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const calculateTimeUntilStart = (startTime: string) => {
    const diff = new Date(startTime).getTime() - Date.now();
    if (diff <= 0) return 'Starting now';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Guard: show modal if guest tries to browse
  const handleBrowseClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setShowAuthModal(true);
    } else {
      router.push('/auctions');
    }
  };

  const handleAuctionCardClick = (e: React.MouseEvent, auctionId: string) => {
    if (!isAuthenticated) {
      e.preventDefault();
      e.stopPropagation();
      setShowAuthModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">🔥 Featured Auctions</h2>
          <button
            onClick={handleBrowseClick}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            {t('browseAuctions')}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading auctions...</p>
          </div>
        ) : featuredAuctions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
            <div className="text-6xl mb-4">🏪</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Auctions Yet</h3>
            <p className="text-gray-600 mb-6">Be the first! Create an auction to get started.</p>
            <button
              onClick={handleBrowseClick}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition shadow-md"
            >
              Create Auction
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredAuctions.map((auction) => (
              <div
                key={auction.id}
                onClick={(e) => handleAuctionCardClick(e, auction.id)}
                className={!isAuthenticated ? 'cursor-pointer' : ''}
              >
                <AuctionCard {...auction} />
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
            <div className="text-5xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Join BidAmharic</h2>
            <p className="text-gray-500 mb-8">
              Sign in or create an account to browse auctions, place bids, and sell items.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/auth/register')}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl transition"
              >
                Create Account
              </button>
              <button
                onClick={() => setShowAuthModal(false)}
                className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium transition"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
