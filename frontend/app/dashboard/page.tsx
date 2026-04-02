'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import NotificationBell from '@/components/NotificationBell';
import Link from 'next/link';
import Image from 'next/image';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('telebirr');
  const [followingStatus, setFollowingStatus] = useState<{[key: number]: boolean}>({
    1: false,
    2: false,
    3: true
  });
  const [topSellers, setTopSellers] = useState<any[]>([]);
  const [loadingSellers, setLoadingSellers] = useState(true);
  const [walletData, setWalletData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [activeAuctions, setActiveAuctions] = useState<any[]>([]);
  const [biddingHistory, setBiddingHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [recentAuctions, setRecentAuctions] = useState<any[]>([]);
  const [portfolioStats, setPortfolioStats] = useState({
    activeBids: 0,
    wonAuctions: 0,
    watching: 0,
    totalSpent: 0
  });
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  // Fetch top sellers from database
  useEffect(() => {
    const fetchTopSellers = async () => {
      try {
        const api = (await import('@/lib/api')).default;
        const response = await api.getAuctions({ limit: 100 });
        
        if (response.success && response.data) {
          const responseData: any = response.data;
          const auctions = Array.isArray(responseData) 
            ? responseData 
            : (responseData.auctions || []);
          
          // Group auctions by seller and count
          const sellerStats: any = {};
          
          if (Array.isArray(auctions)) {
            auctions.forEach((auction: any) => {
              const sellerId = auction.seller_id;
              if (!sellerStats[sellerId]) {
                sellerStats[sellerId] = {
                  id: sellerId,
                  name: auction.seller_name || 'Unknown Seller',
                  activeAuctions: 0,
                  totalSales: 0,
                  isFollowing: false,
                  avatar: (auction.seller_name?.charAt(0) || '?').toUpperCase(),
                  coverImage: `linear-gradient(135deg, ${getRandomGradient()})`
                };
              }
              
              if (auction.status === 'active') {
                sellerStats[sellerId].activeAuctions++;
              }
              if (auction.status === 'completed' || auction.status === 'ended') {
                sellerStats[sellerId].totalSales++;
              }
            });
          }
          
          // Convert to array and sort by active auctions
          const sellers = Object.values(sellerStats)
            .sort((a: any, b: any) => b.activeAuctions - a.activeAuctions)
            .slice(0, 3);
          
          // Only show real sellers, no defaults
          setTopSellers(sellers);
        } else {
          // No data, show empty
          setTopSellers([]);
        }
      } catch (error) {
        console.error('Error fetching sellers:', error);
        // Don't show default sellers on error, show empty
        setTopSellers([]);
      } finally {
        setLoadingSellers(false);
      }
    };
    
    if (isAuthenticated) {
      fetchTopSellers();
    }
  }, [isAuthenticated]);

  // Fetch wallet data and transactions
  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const api = (await import('@/lib/api')).default;
        
        // Fetch user profile to get wallet balance
        const profileResponse = await api.getProfile();
        if (profileResponse.success && profileResponse.data) {
          const userData = (profileResponse.data as any)?.user || profileResponse.data;
          
          // Calculate in escrow (sum of active bids)
          const bidsResponse = await api.getUserBids();
          let inEscrow = 0;
          let activeBidsCount = 0;
          
          if (bidsResponse.success && bidsResponse.data) {
            const bids = (bidsResponse.data as any)?.bids || [];
            bids.forEach((bid: any) => {
              if (bid.status === 'active') {
                inEscrow += parseFloat(bid.amount);
                activeBidsCount++;
              }
            });
          }
          
          const totalBalance = parseFloat(userData.wallet_balance) || 0;
          const available = totalBalance - inEscrow;
          
          setWalletData({
            totalBalance,
            inEscrow,
            available,
            activeBidsCount
          });
        }
        
        // Fetch wallet transactions
        const transactionsQuery = await api.get('/wallet/transactions?limit=10');
        if (transactionsQuery.success && transactionsQuery.data) {
          setTransactions((transactionsQuery.data as any)?.transactions || []);
        }
      } catch (error) {
        console.error('Error fetching wallet data:', error);
      } finally {
        setLoadingWallet(false);
      }
    };
    
    if (isAuthenticated && activeTab === 'wallet') {
      fetchWalletData();
    }
  }, [isAuthenticated, activeTab]);

  // Helper function to generate random gradients
  const getRandomGradient = () => {
    const gradients = [
      '#667eea 0%, #764ba2 100%',
      '#f093fb 0%, #f5576c 100%',
      '#4facfe 0%, #00f2fe 100%',
      '#43e97b 0%, #38f9d7 100%',
      '#fa709a 0%, #fee140 100%',
      '#30cfd0 0%, #330867 100%'
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  };

  // Fetch active auctions from database
  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const api = (await import('@/lib/api')).default;
        // Fetch all auctions (active and pending) - backend defaults to showing both
        const response = await api.getAuctions({ limit: 6 });
        
        if (response.success && response.data) {
          const responseData: any = response.data;
          const auctions = Array.isArray(responseData) 
            ? responseData 
            : (responseData.auctions || []);
          
          // Transform auctions to match the expected format
          const transformedAuctions = auctions.map((auction: any) => {
            // Parse images (stored as JSON in database)
            let imageUrl = '/Image/Iphone promax-15.webp'; // fallback image
            try {
              const images = typeof auction.images === 'string' 
                ? JSON.parse(auction.images) 
                : auction.images;
              if (Array.isArray(images) && images.length > 0) {
                imageUrl = images[0];
              }
            } catch (e) {
              console.error('Error parsing images:', e);
            }
            
            // Calculate time left
            const endTime = new Date(auction.end_time);
            const now = new Date();
            const timeLeftMs = endTime.getTime() - now.getTime();
            
            let timeLeft = { hours: 0, minutes: 0, seconds: 0 };
            if (timeLeftMs > 0) {
              const hours = Math.floor(timeLeftMs / (1000 * 60 * 60));
              const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
              const seconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000);
              timeLeft = { hours, minutes, seconds };
            }
            
            return {
              id: auction.id,
              title: auction.title,
              category: auction.category,
              image: imageUrl,
              timeLeft: timeLeft,
              currentBid: parseFloat(auction.current_bid) || parseFloat(auction.starting_bid) || 0,
              bids: parseInt(auction.total_bids) || 0,
              status: auction.status
            };
          });
          
          setActiveAuctions(transformedAuctions);
        } else {
          setActiveAuctions([]);
        }
      } catch (error) {
        console.error('Error fetching auctions:', error);
        setActiveAuctions([]);
      }
    };
    
    if (isAuthenticated) {
      fetchAuctions();
    }
  }, [isAuthenticated]);

  // Fetch bidding history
  useEffect(() => {
    const fetchBiddingHistory = async () => {
      try {
        const api = (await import('@/lib/api')).default;
        const response = await api.getUserBids();
        
        if (response.success && response.data) {
          const bids = (response.data as any)?.bids || [];
          
          // Transform bids to match the expected format
          const transformedBids = bids.map((bid: any) => {
            // Determine status based on bid and auction status
            let status = 'Active';
            let color = 'blue';
            
            if (bid.auction_status === 'ended' || bid.auction_status === 'completed') {
              // Check if this user won
              if (bid.is_winning) {
                status = 'Won';
                color = 'green';
              } else {
                status = 'Lost';
                color = 'gray';
              }
            } else if (bid.auction_status === 'active') {
              // Check if user is currently winning
              if (bid.is_winning) {
                status = 'Winning';
                color = 'green';
              } else {
                status = 'Outbid';
                color = 'red';
              }
            }
            
            return {
              item: bid.auction_title || 'Unknown Item',
              bid: parseFloat(bid.amount) || 0,
              date: new Date(bid.bid_time).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              }),
              status: status,
              color: color,
              auctionId: bid.auction_id
            };
          });
          
          setBiddingHistory(transformedBids);
        } else {
          setBiddingHistory([]);
        }
      } catch (error) {
        console.error('Error fetching bidding history:', error);
        setBiddingHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    };
    
    if (isAuthenticated && activeTab === 'history') {
      fetchBiddingHistory();
    }
  }, [isAuthenticated, activeTab]);

  // Fetch recent auctions for sidebar
  useEffect(() => {
    const fetchRecentAuctions = async () => {
      try {
        const api = (await import('@/lib/api')).default;
        const response = await api.getAuctions({ limit: 8 });
        
        if (response.success && response.data) {
          const responseData: any = response.data;
          const auctions = Array.isArray(responseData) 
            ? responseData 
            : (responseData.auctions || []);
          
          const transformed = auctions.map((auction: any) => {
            let imageUrl = '/Image/Iphone promax-15.webp';
            try {
              const images = typeof auction.images === 'string' 
                ? JSON.parse(auction.images) 
                : auction.images;
              if (Array.isArray(images) && images.length > 0) {
                imageUrl = images[0];
              }
            } catch (e) {
              console.error('Error parsing images:', e);
            }
            
            const status = auction.status === 'ended' || auction.status === 'completed' ? 'SOLD' : null;
            const price = status ? null : (parseFloat(auction.current_bid) || parseFloat(auction.starting_bid) || 0);
            
            return {
              id: auction.id,
              title: auction.title,
              price: price,
              date: new Date(auction.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              }),
              status: status,
              image: imageUrl
            };
          });
          
          setRecentAuctions(transformed);
        } else {
          setRecentAuctions([]);
        }
      } catch (error) {
        console.error('Error fetching recent auctions:', error);
        setRecentAuctions([]);
      }
    };
    
    if (isAuthenticated) {
      fetchRecentAuctions();
    }
  }, [isAuthenticated]);

  // Fetch portfolio statistics
  useEffect(() => {
    const fetchPortfolioStats = async () => {
      try {
        const api = (await import('@/lib/api')).default;
        const response = await api.getUserBids();
        
        if (response.success && response.data) {
          const bids = (response.data as any)?.bids || [];
          
          let activeBidsCount = 0;
          let wonAuctionsCount = 0;
          let totalSpent = 0;
          
          bids.forEach((bid: any) => {
            // Count active bids (auctions still running)
            if (bid.auction_status === 'active') {
              activeBidsCount++;
            }
            
            // Count won auctions (ended/completed and user is winning)
            if ((bid.auction_status === 'ended' || bid.auction_status === 'completed') && bid.is_winning) {
              wonAuctionsCount++;
              totalSpent += parseFloat(bid.amount) || 0;
            }
          });
          
          setPortfolioStats({
            activeBids: activeBidsCount,
            wonAuctions: wonAuctionsCount,
            watching: 0, // TODO: Implement watchlist feature
            totalSpent: totalSpent
          });
        }
      } catch (error) {
        console.error('Error fetching portfolio stats:', error);
      } finally {
        setLoadingPortfolio(false);
      }
    };
    
    if (isAuthenticated && activeTab === 'portfolio') {
      fetchPortfolioStats();
    }
  }, [isAuthenticated, activeTab]);

  // Calculate isSeller before early return
  const isSeller = user?.subscription.plan === 'seller' || user?.subscription.plan === 'premium';

  if (!isAuthenticated) {
    return null;
  }


  // Handle follow/unfollow seller
  const handleFollowSeller = (sellerId: number) => {
    setFollowingStatus(prev => ({
      ...prev,
      [sellerId]: !prev[sellerId]
    }));
  };

  // Handle quick amount selection
  const handleQuickAmount = (amount: number) => {
    setFundAmount(amount.toString());
  };

  // Handle place bid
  const handlePlaceBid = (auctionId: number, auctionTitle: string, currentBid: number) => {
    const bidAmount = prompt(`Enter your bid amount for ${auctionTitle} (Current bid: ETB ${currentBid.toLocaleString()})`);
    if (bidAmount && parseFloat(bidAmount) > currentBid) {
      alert(`Bid placed successfully! Your bid: ETB ${parseFloat(bidAmount).toLocaleString()}`);
    } else if (bidAmount) {
      alert('Your bid must be higher than the current bid!');
    }
  };

  // Handle add funds
  const handleAddFunds = async () => {
    if (fundAmount && parseFloat(fundAmount) > 0) {
      try {
        const amount = parseFloat(fundAmount);
        const token = localStorage.getItem('token');
        
        console.log('🔵 Starting add funds request, amount:', amount);
        console.log('🔵 Token exists:', !!token);
        
        // Direct fetch call to bypass API client
        const response = await fetch(
          `http://localhost:5000/api/wallet/add-funds-test?amount=${amount}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('🟢 Response status:', response.status);
        console.log('🟢 Response ok:', response.ok);
        
        const data = await response.json();
        
        console.log('🟢 Response data:', data);
        console.log('🟢 data.success:', data?.success);
        console.log('🟢 data.message:', data?.message);
        
        // Check if successful
        if (response.ok && data.success === true) {
          console.log('✅ Success! Closing modal and reloading');
          setShowAddFundsModal(false);
          setFundAmount('');
          alert(`Successfully added ETB ${amount.toLocaleString()} to your wallet!`);
          window.location.reload();
        } else {
          console.error('❌ Response indicates failure');
          console.error('❌ Status:', response.status);
          console.error('❌ Message:', data?.message);
          alert(`Failed to add funds: ${data?.message || 'Unknown error'}`);
        }
      } catch (error: any) {
        console.error('🔴 Exception caught:', error);
        console.error('🔴 Error message:', error.message);
        alert(`Error: ${error.message || 'Failed to add funds'}`);
      }
    } else {
      alert('Please enter a valid amount');
    }
  };

  // Sidebar navigation
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', action: () => setActiveTab('dashboard') },
    { id: 'marketplace', label: 'Marketplace', icon: '🏪', action: () => router.push('/auctions') },
    { id: 'wallet', label: 'My Wallet', icon: '💼', action: () => setActiveTab('wallet') },
    { id: 'portfolio', label: 'My Portfolio', icon: '📁', action: () => setActiveTab('portfolio') },
    { id: 'history', label: 'History', icon: '📜', action: () => setActiveTab('history') },
    { id: 'preferences', label: 'Buyer Preferences', icon: '🛍️', action: () => setActiveTab('preferences') },
    ...(isSeller ? [{ id: 'seller-settings', label: 'Seller Settings', icon: '🏪', action: () => setActiveTab('seller-settings') }] : []),
    { id: 'settings', label: 'Settings', icon: '⚙️', action: () => router.push('/settings') },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex">
        {/* Left Sidebar */}
        <aside className="w-20 bg-white min-h-screen fixed left-0 top-16 z-40 border-r border-gray-200 shadow-sm">
          <div className="flex flex-col items-center py-6 space-y-6">
            {/* Logo */}
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-cyan-500/30">
              A
            </div>

            {/* Navigation Icons */}
            <nav className="flex flex-col items-center space-y-4 flex-1">
              {sidebarItems.map((item) => (
                <div key={item.id} className="relative group">
                  <button
                    onClick={item.action}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${
                      activeTab === item.id
                        ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                        : 'text-gray-400 hover:bg-gray-100 hover:text-cyan-500'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                  </button>
                  {/* Tooltip */}
                  <div className="absolute left-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                    <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
                      {item.label}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-900"></div>
                    </div>
                  </div>
                </div>
              ))}
            </nav>

            {/* Logout at Bottom */}
            <div className="relative group">
              <button
                onClick={() => router.push('/auth/login')}
                className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
              >
                <span className="text-2xl">🚪</span>
              </button>
              {/* Tooltip */}
              <div className="absolute left-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
                  Logout
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-900"></div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-20 mr-80 p-8">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
                    <p className="text-gray-600 mt-1 flex items-center gap-2">
                      <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                      Welcome back, {user?.name || 'User'}!
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search auctions..."
                        className="pl-10 pr-4 py-2 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent w-64 shadow-sm"
                      />
                      <svg className="w-5 h-5 text-cyan-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <NotificationBell />
                    <button 
                      onClick={() => router.push('/settings')}
                      className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold hover:shadow-lg hover:shadow-cyan-500/30 transition overflow-hidden relative"
                      title={user?.name || 'User Profile'}
                    >
                      {user?.profile_photo ? (
                        <img
                          src={user.profile_photo}
                          alt={user?.name || 'Profile'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Create Auction Button */}
                <button
                  onClick={() => router.push('/create-auction')}
                  className="group relative overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="text-left">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-4xl">➕</span>
                        <h3 className="text-2xl font-bold">Create Auction</h3>
                      </div>
                      <p className="text-white/90 text-sm">List your items and start selling</p>
                    </div>
                    <svg className="w-8 h-8 transform group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>

                {/* Browse Auctions Button */}
                <button
                  onClick={() => router.push('/auctions')}
                  className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="text-left">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-4xl">🔨</span>
                        <h3 className="text-2xl font-bold">Browse Auctions</h3>
                      </div>
                      <p className="text-white/90 text-sm">Discover and bid on items</p>
                    </div>
                    <svg className="w-8 h-8 transform group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
              </div>

              {/* Categories Section */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-cyan-400"></span>
                  Categories
                </h2>
                <div className="grid grid-cols-5 gap-4">
                  {[
                    { name: 'Electronics', icon: '💻', color: 'from-blue-500 to-cyan-400' },
                    { name: 'Vehicles', icon: '🚗', color: 'from-gray-700 to-gray-600' },
                    { name: 'Jewelry & Watches', icon: '💎', color: 'from-yellow-500 to-orange-500' },
                    { name: 'Home & Garden', icon: '🏡', color: 'from-green-500 to-emerald-400' },
                    { name: 'Art & Collectibles', icon: '🎨', color: 'from-red-500 to-rose-400' }
                  ].map((category) => (
                    <button
                      key={category.name}
                      onClick={() => router.push(`/auctions?category=${encodeURIComponent(category.name)}`)}
                      className={`bg-gradient-to-br ${category.color} rounded-2xl p-6 text-white hover:shadow-xl transition transform hover:scale-105`}
                    >
                      <div className="text-4xl mb-2">{category.icon}</div>
                      <p className="font-semibold text-sm">{category.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Top Sellers Section */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-cyan-400"></span>
                  Top Sellers
                  <span className="text-xs bg-cyan-50 text-cyan-600 px-2 py-1 rounded-full border border-cyan-200">Verified</span>
                </h2>
                
                {loadingSellers ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Loading sellers...</p>
                  </div>
                ) : topSellers.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
                    <div className="text-6xl mb-4">🏪</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Sellers Yet</h3>
                    <p className="text-gray-600 mb-4">
                      Be the first! Create an auction to appear here.
                    </p>
                    <button 
                      onClick={() => router.push('/create-auction')}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition shadow-md"
                    >
                      Create Your First Auction
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-6">
                    {topSellers.map((seller) => (
                      <div key={seller.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition border border-gray-200">
                        {/* Cover Image */}
                        <div className="h-24 relative" style={{ background: seller.coverImage }}></div>
                        
                        {/* Avatar */}
                        <div className="px-6 pb-6">
                          <div className="flex justify-center -mt-8 mb-3">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl border-4 border-cyan-400 shadow-lg relative">
                              {seller.avatar}
                              <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-400 rounded-full flex items-center justify-center text-xs text-white">✓</span>
                            </div>
                          </div>
                          
                          {/* Name */}
                          <h3 className="text-center font-bold text-gray-900 mb-3">{seller.name}</h3>
                          
                          {/* Stats */}
                          <div className="flex justify-center gap-8 mb-4">
                            <div className="text-center">
                              <p className="text-lg font-bold text-cyan-500">{seller.activeAuctions}</p>
                              <p className="text-xs text-gray-500">Active</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-cyan-500">{seller.totalSales}</p>
                              <p className="text-xs text-gray-500">Sold</p>
                            </div>
                          </div>
                          
                          {/* Follow Button */}
                          <button 
                            onClick={() => handleFollowSeller(seller.id)}
                            className={`w-full py-2.5 rounded-lg font-semibold transition ${
                              followingStatus[seller.id]
                                ? 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                                : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 shadow-md'
                            }`}>
                            {followingStatus[seller.id] ? 'Following' : 'Follow Seller'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Auctions Section */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-cyan-400"></span>
                  Recommended Auctions
                </h2>
                
                {activeAuctions.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
                    <div className="text-6xl mb-4">🔨</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Auctions</h3>
                    <p className="text-gray-600 mb-4">
                      There are no active auctions at the moment. Check back later or create your own!
                    </p>
                    <button 
                      onClick={() => router.push('/create-auction')}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition shadow-md"
                    >
                      Create First Auction
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-6">
                    {activeAuctions.map((auction) => (
                      <div key={auction.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition border border-gray-200">
                        {/* Image */}
                        <div className="h-48 relative bg-gray-100">
                          <Image
                            src={auction.image}
                            alt={auction.title}
                            fill
                            className="object-cover"
                          />
                          <span className="absolute top-3 right-3 px-3 py-1 bg-cyan-400 backdrop-blur-sm rounded-full text-xs font-semibold text-white shadow-md">
                            {auction.category}
                          </span>
                        </div>
                      
                      {/* Content */}
                      <div className="p-5">
                        <h3 className="font-bold text-gray-900 mb-1">{auction.title}</h3>
                        <p className="text-sm text-cyan-600 mb-3">Current Bid: ETB {auction.currentBid.toLocaleString()}</p>
                        
                        {/* Countdown Timer */}
                        <div className="flex items-center justify-center gap-2 mb-4 bg-gray-50 rounded-lg py-2 border border-gray-200">
                          <span className="text-2xl font-bold text-gray-900">
                            {String(auction.timeLeft.hours).padStart(2, '0')}
                          </span>
                          <span className="text-gray-400">:</span>
                          <span className="text-2xl font-bold text-gray-900">
                            {String(auction.timeLeft.minutes).padStart(2, '0')}
                          </span>
                          <span className="text-gray-400">:</span>
                          <span className="text-2xl font-bold text-gray-900">
                            {String(auction.timeLeft.seconds).padStart(2, '0')}
                          </span>
                        </div>
                        
                        {/* Place Bid Button */}
                        <button 
                          onClick={() => handlePlaceBid(auction.id, auction.title, auction.currentBid)}
                          className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition shadow-md"
                        >
                          Place a Bid
                        </button>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Wallet Tab */}
          {activeTab === 'wallet' && (
            <div>
              <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-2">
                <span className="w-1 h-8 bg-cyan-400"></span>
                My Wallet
              </h1>
              
              {loadingWallet ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4"></div>
                    <p className="text-gray-400">Loading wallet...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-cyan-500/30 border border-cyan-400/30">
                      <p className="text-sm opacity-90 mb-2">Total Balance</p>
                      <p className="text-4xl font-bold mb-4">
                        ETB {walletData?.totalBalance?.toLocaleString() || '0'}
                      </p>
                      <button 
                        onClick={() => setShowAddFundsModal(true)}
                        className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold transition backdrop-blur-sm border border-white/30"
                      >
                        Add Funds
                      </button>
                    </div>
                    <div className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-cyan-500/20">
                      <p className="text-sm text-gray-400 mb-2">In Escrow</p>
                      <p className="text-3xl font-bold text-cyan-400 mb-4">
                        ETB {walletData?.inEscrow?.toLocaleString() || '0'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {walletData?.activeBidsCount || 0} active bids
                      </p>
                    </div>
                    <div className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-cyan-500/20">
                      <p className="text-sm text-gray-400 mb-2">Available</p>
                      <p className="text-3xl font-bold text-green-400 mb-4">
                        ETB {walletData?.available?.toLocaleString() || '0'}
                      </p>
                      <p className="text-sm text-gray-500">Ready to bid</p>
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-cyan-500/20">
                    <h2 className="text-xl font-bold text-white mb-4">Recent Transactions</h2>
                    {transactions.length > 0 ? (
                      <div className="space-y-4">
                        {transactions.map((transaction: any) => (
                          <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/30">
                                <span className="text-lg">
                                  {transaction.type === 'deposit' ? '💰' : 
                                   transaction.type === 'bid_placed' ? '🔨' :
                                   transaction.type === 'bid_refund' ? '↩️' :
                                   transaction.type === 'escrow_release' ? '✅' :
                                   transaction.type === 'escrow_lock' ? '🔒' : '💸'}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-white capitalize">
                                  {transaction.description || transaction.type.replace(/_/g, ' ')}
                                </p>
                                <p className="text-sm text-gray-400">
                                  {new Date(transaction.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                            <p className={`font-bold ${
                              ['deposit', 'bid_refund', 'escrow_release'].includes(transaction.type)
                                ? 'text-green-400'
                                : 'text-orange-400'
                            }`}>
                              {['deposit', 'bid_refund', 'escrow_release'].includes(transaction.type) ? '+' : '-'}
                              ETB {parseFloat(transaction.amount).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No transactions yet</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Add Funds Modal */}
          {showAddFundsModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                  <h2 className="text-2xl font-bold text-gray-900">Add Funds</h2>
                  <button 
                    onClick={() => setShowAddFundsModal(false)}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                  {/* Amount Input */}
                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Amount (ETB)
                    </label>
                    <input
                      type="number"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                    />
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="mb-5">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Quick Select</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[1000, 5000, 10000, 20000, 50000, 100000].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => handleQuickAmount(amount)}
                          className={`px-4 py-3 border-2 rounded-lg transition font-semibold ${
                            fundAmount === amount.toString()
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-gray-200 text-gray-700 hover:border-purple-500 hover:bg-purple-50'
                          }`}
                        >
                          {amount.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="mb-5">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Payment Method</p>
                    <div className="space-y-2">
                      <button 
                        onClick={() => setSelectedPaymentMethod('telebirr')}
                        className={`w-full flex items-center gap-3 p-3 border-2 rounded-lg transition ${
                          selectedPaymentMethod === 'telebirr'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-500 hover:bg-purple-50'
                        }`}
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold">
                          T
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-gray-900">Telebirr</p>
                          <p className="text-xs text-gray-500">Mobile payment</p>
                        </div>
                        {selectedPaymentMethod === 'telebirr' && (
                          <div className="w-5 h-5 rounded-full border-2 border-purple-500 flex items-center justify-center">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          </div>
                        )}
                      </button>
                      <button 
                        onClick={() => setSelectedPaymentMethod('chapa')}
                        className={`w-full flex items-center gap-3 p-3 border-2 rounded-lg transition ${
                          selectedPaymentMethod === 'chapa'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-500 hover:bg-purple-50'
                        }`}
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                          C
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-gray-900">Chapa</p>
                          <p className="text-xs text-gray-500">Card payment</p>
                        </div>
                        {selectedPaymentMethod === 'chapa' && (
                          <div className="w-5 h-5 rounded-full border-2 border-purple-500 flex items-center justify-center">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          </div>
                        )}
                      </button>
                      <button 
                        onClick={() => setSelectedPaymentMethod('cbe')}
                        className={`w-full flex items-center gap-3 p-3 border-2 rounded-lg transition ${
                          selectedPaymentMethod === 'cbe'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-500 hover:bg-purple-50'
                        }`}
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-white font-bold">
                          CB
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-gray-900">CBE Birr</p>
                          <p className="text-xs text-gray-500">Bank transfer</p>
                        </div>
                        {selectedPaymentMethod === 'cbe' && (
                          <div className="w-5 h-5 rounded-full border-2 border-purple-500 flex items-center justify-center">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowAddFundsModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddFunds}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition shadow-lg"
                    >
                      Add Funds
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Portfolio Tab */}
          {activeTab === 'portfolio' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">My Portfolio</h1>
              
              {loadingPortfolio ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4"></div>
                    <p className="text-gray-600">Loading portfolio...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <p className="text-sm text-gray-600 mb-2">Active Bids</p>
                      <p className="text-3xl font-bold text-blue-600">{portfolioStats.activeBids}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <p className="text-sm text-gray-600 mb-2">Won Auctions</p>
                      <p className="text-3xl font-bold text-green-600">{portfolioStats.wonAuctions}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <p className="text-sm text-gray-600 mb-2">Watching</p>
                      <p className="text-3xl font-bold text-purple-600">{portfolioStats.watching}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <p className="text-sm text-gray-600 mb-2">Total Spent</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ETB {portfolioStats.totalSpent.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </>
              )}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">My Active Bids</h2>
                <div className="grid grid-cols-3 gap-6">
                  {activeAuctions.slice(0, 3).map((auction) => (
                    <div key={auction.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition">
                      <div className="h-32 relative bg-gray-100">
                        <Image
                          src={auction.image}
                          alt={auction.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 mb-2">{auction.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">Your Bid: ETB {auction.currentBid.toLocaleString()}</p>
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          Winning
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Bidding History</h1>
              
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4"></div>
                    <p className="text-gray-600">Loading bidding history...</p>
                  </div>
                </div>
              ) : biddingHistory.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
                  <div className="text-6xl mb-4">📜</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Bidding History</h3>
                  <p className="text-gray-600 mb-4">
                    You haven't placed any bids yet. Start bidding on auctions to see your history here!
                  </p>
                  <button 
                    onClick={() => router.push('/auctions')}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition shadow-md"
                  >
                    Browse Auctions
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Item</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Bid Amount</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {biddingHistory.map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                              <p className="font-semibold text-gray-900">{item.item}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-gray-900">ETB {item.bid.toLocaleString()}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-gray-600">{item.date}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                                item.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                                item.color === 'green' ? 'bg-green-100 text-green-700' :
                                item.color === 'red' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Buyer Preferences Tab */}
          {activeTab === 'preferences' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Buyer Preferences</h1>
              
              <div className="grid grid-cols-1 gap-6">
                {/* Favorite Categories */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Favorite Categories</h2>
                  <p className="text-gray-600 mb-4">Select categories you're interested in to see relevant auctions first</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { name: 'Electronics', icon: '💻' },
                      { name: 'Vehicles', icon: '🚗' },
                      { name: 'Jewelry & Watches', icon: '💎' },
                      { name: 'Home & Garden', icon: '🏡' },
                      { name: 'Art & Collectibles', icon: '🎨' },
                      { name: 'Fashion', icon: '👔' }
                    ].map((category) => (
                      <button
                        key={category.name}
                        className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                      >
                        <span className="text-2xl">{category.icon}</span>
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range Preferences */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Price Range Preferences</h2>
                  <p className="text-gray-600 mb-4">Set your preferred price range for auctions</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Price (ETB)</label>
                      <input
                        type="number"
                        placeholder="1,000"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Price (ETB)</label>
                      <input
                        type="number"
                        placeholder="100,000"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <button className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                    Save Price Range
                  </button>
                </div>

                {/* Notification Preferences */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Notification Preferences</h2>
                  <p className="text-gray-600 mb-4">Choose what notifications you want to receive</p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Auction Ending Soon</p>
                        <p className="text-sm text-gray-600">Get notified when auctions you're watching are ending</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Outbid Alerts</p>
                        <p className="text-sm text-gray-600">Get notified when someone outbids you</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">New Auctions in Favorites</p>
                        <p className="text-sm text-gray-600">Get notified about new auctions in your favorite categories</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Winning Bid Confirmation</p>
                        <p className="text-sm text-gray-600">Get notified when you win an auction</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  <button className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                    Save Notification Preferences
                  </button>
                </div>

                {/* Auto-Bid Settings */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Auto-Bid Settings</h2>
                  <p className="text-gray-600 mb-4">Configure your automatic bidding preferences</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Default Auto-Bid Increment (ETB)</label>
                      <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="100">100 ETB</option>
                        <option value="500">500 ETB</option>
                        <option value="1000">1,000 ETB</option>
                        <option value="5000">5,000 ETB</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Auto-Bid Limit (ETB)</label>
                      <input
                        type="number"
                        placeholder="50,000"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-sm text-gray-500 mt-1">Maximum amount for automatic bidding per auction</p>
                    </div>
                  </div>
                  
                  <button className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                    Save Auto-Bid Settings
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg p-6 text-white">
                  <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => router.push('/auctions')}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 text-left transition"
                    >
                      <div className="text-3xl mb-2">🔍</div>
                      <p className="font-semibold">Browse Auctions</p>
                      <p className="text-sm text-white/80">Find items you love</p>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('wallet')}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 text-left transition"
                    >
                      <div className="text-3xl mb-2">💰</div>
                      <p className="font-semibold">Add Funds</p>
                      <p className="text-sm text-white/80">Top up your wallet</p>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('history')}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 text-left transition"
                    >
                      <div className="text-3xl mb-2">📜</div>
                      <p className="font-semibold">View History</p>
                      <p className="text-sm text-white/80">Check your bids</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar - Recently Added Auctions */}
        <aside className="w-80 bg-white min-h-screen fixed right-0 top-16 z-40 border-l border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-cyan-400"></span>
            Recently Added
          </h2>
          <div className="space-y-4">
            {recentAuctions.map((auction) => (
              <div 
                key={auction.id} 
                onClick={() => {
                  if (!auction.status) {
                    router.push(`/auction/${auction.id}`);
                  }
                }}
                className={`flex items-center gap-3 p-2 rounded-lg transition ${
                  auction.status ? 'opacity-60 cursor-default' : 'hover:bg-gray-50 cursor-pointer'
                }`}
              >
                {/* Image */}
                <div className="w-12 h-12 rounded-lg flex-shrink-0 relative bg-gray-100 overflow-hidden">
                  <Image
                    src={auction.image}
                    alt={auction.title}
                    fill
                    className="object-cover"
                  />
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm">{auction.title}</h3>
                  <p className="text-xs text-gray-500">{auction.date}</p>
                </div>
                
                {/* Price or Status */}
                <div className="text-right">
                  {auction.status ? (
                    <span className="text-xs font-bold text-gray-400">{auction.status}</span>
                  ) : (
                    <span className="text-sm font-bold text-blue-600">ETB {auction.price?.toLocaleString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
