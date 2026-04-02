'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSearchParams } from 'next/navigation';

interface Auction {
  id: string;
  title: string;
  image?: string;
  images?: any;
  current_bid: number;
  start_time?: string;
  end_time: string;
  category: string;
  seller_name?: string;
  total_bids?: number;
  status?: string;
}

export default function AuctionsPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Read URL query parameters on mount
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    const urlCategory = searchParams.get('category');
    
    if (urlSearch) {
      setSearch(urlSearch);
    }
    
    if (urlCategory) {
      // Map category names to filter values
      const categoryMap: { [key: string]: string } = {
        'Electronics': 'electronics',
        'Vehicles': 'vehicles',
        'Jewelry': 'jewelry',
        'Home & Garden': 'home'
      };
      setFilter(categoryMap[urlCategory] || urlCategory.toLowerCase());
    }
  }, [searchParams]);

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      const api = (await import('@/lib/api')).default;
      // Fetch all auctions (not just active) to show upcoming auctions too
      const response = await api.getAuctions({ limit: 100 });
      
      if (response.success && response.data) {
        const auctionsData = Array.isArray(response.data) 
          ? response.data 
          : (response.data.auctions || []);
        
        // Filter to show active and pending auctions only (not ended/cancelled)
        const validAuctions = auctionsData.filter((auction: Auction) => 
          auction.status === 'active' || auction.status === 'pending'
        );
        
        setAuctions(validAuctions);
      }
    } catch (error) {
      console.error('Error fetching auctions:', error);
    } finally {
      setLoading(false);
    }
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

  const getAuctionImage = (auction: Auction) => {
    if (auction.image) return auction.image;
    if (auction.images) {
      try {
        const imagesArray = typeof auction.images === 'string' 
          ? JSON.parse(auction.images) 
          : auction.images;
        if (Array.isArray(imagesArray) && imagesArray.length > 0) {
          return imagesArray[0];
        }
      } catch (e) {
        console.error('Error parsing images:', e);
      }
    }
    return '/Image/placeholder.jpg';
  };

  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredAuctions = auctions.filter(auction => {
    const matchesFilter = filter === 'all' || auction.category.toLowerCase() === filter.toLowerCase();
    const matchesSearch = auction.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Live Auctions</h1>
          <p className="text-lg text-gray-600">Browse active auctions and place your bids</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="Search auctions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="electronics">Electronics</option>
                <option value="vehicles">Vehicles</option>
                <option value="jewelry">Jewelry</option>
                <option value="home">Home & Garden</option>
              </select>
            </div>
          </div>
        </div>

        {/* Auctions Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading auctions...</p>
          </div>
        ) : filteredAuctions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <div className="text-6xl mb-4">🏪</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Auctions Yet</h3>
            <p className="text-gray-600 mb-4">
              Be the first! Create an auction to get started.
            </p>
            <Link href={typeof window !== 'undefined' && localStorage.getItem('token') ? '/create-auction' : '/auth/register'}>
              <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition shadow-md">
                Create Auction
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAuctions.map((auction) => (
              <Link key={auction.id} href={`/auction/${auction.id}`}>
                <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-100 group">
                  {/* Image */}
                  <div className="relative h-64 bg-gradient-to-br from-orange-300 to-orange-400">
                    <Image
                      src={getAuctionImage(auction)}
                      alt={auction.title}
                      fill
                      className="object-contain p-4 group-hover:scale-105 transition duration-300"
                    />
                    {/* Status Badge */}
                    {auction.status === 'pending' && (
                      <div className="absolute top-4 left-4 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                        Starting Soon
                      </div>
                    )}
                    {/* Time Badge */}
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                      {auction.status === 'pending' ? 'Starts in: ' : 'Ends in: '}
                      {auction.status === 'pending' 
                        ? calculateTimeLeft(new Date(auction.start_time || '').toISOString())
                        : calculateTimeLeft(auction.end_time)
                      }
                    </div>
                    {/* Decorative element */}
                    <div className="absolute bottom-0 right-0 w-16 h-full bg-orange-500 rounded-l-3xl"></div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{auction.title}</h3>
                    {auction.seller_name && (
                      <p className="text-sm text-gray-500 mb-4">by {auction.seller_name}</p>
                    )}
                    
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Current Bid</p>
                        <p className="text-2xl font-bold text-blue-600">{parseFloat(auction.current_bid.toString()).toLocaleString()} <span className="text-lg">ETB</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 mb-1">Bids</p>
                        <p className="text-lg font-bold text-gray-900">{auction.total_bids || 0}</p>
                      </div>
                    </div>

                    <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition">
                      Place Bid
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && search && filteredAuctions.length === 0 && auctions.length > 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No auctions found matching your criteria</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
