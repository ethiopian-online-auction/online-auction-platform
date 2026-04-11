'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import SellerAnalyticsCharts from '@/components/SellerAnalyticsCharts';

export default function SellerDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [auctions, setAuctions] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeAuctions: 0,
    totalBids: 0,
    conversionRate: 0
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Check if user is a seller
    const isSeller = user?.subscription?.plan === 'seller' || user?.subscription?.plan === 'premium';
    if (!isSeller) {
      router.push('/become-seller');
      return;
    }

    fetchSellerData();
  }, [isAuthenticated, user, router]);

  const fetchSellerData = async () => {
    try {
      const api = (await import('@/lib/api')).default;

      // Fetch wallet balance
      const profileRes = await api.get('/users/profile');
      if (profileRes.success && profileRes.data) {
        setWalletBalance(parseFloat(profileRes.data.wallet_balance || profileRes.data.walletBalance || 0));
      }

      // Fetch seller's auctions
      const auctionsRes = await api.get('/auctions?seller=me');
      if (auctionsRes.success && auctionsRes.data) {
        const auctionsList = Array.isArray(auctionsRes.data) ? auctionsRes.data : (auctionsRes.data.auctions || []);
        setAuctions(auctionsList);

        // Calculate stats
        const active = auctionsList.filter((a: any) => a.status === 'active').length;
        const ended = auctionsList.filter((a: any) => a.status === 'ended' || a.status === 'completed');
        const totalRevenue = ended.reduce((sum: number, a: any) => sum + parseFloat(a.current_bid || 0), 0);
        const totalBids = auctionsList.reduce((sum: number, a: any) => sum + parseInt(a.total_bids || 0), 0);
        const conversionRate = auctionsList.length > 0 ? (ended.length / auctionsList.length) * 100 : 0;

        setStats({
          totalRevenue,
          activeAuctions: active,
          totalBids,
          conversionRate
        });
      }
    } catch (error) {
      console.error('Error fetching seller data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEndAuction = async (auctionId: string) => {
    if (!confirm('Are you sure you want to end this auction early?')) return;

    try {
      const api = (await import('@/lib/api')).default;
      const response = await api.put(`/auctions/${auctionId}`, { status: 'ended' });

      if (response.success) {
        alert('✅ Auction ended successfully!');
        fetchSellerData();
      } else {
        alert(`❌ Failed to end auction: ${response.message}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const handleDeleteAuction = async (auctionId: string) => {
    if (!confirm('Are you sure you want to delete this auction? This cannot be undone.')) return;

    try {
      const api = (await import('@/lib/api')).default;
      const response = await api.delete(`/auctions/${auctionId}`);

      if (response.success) {
        alert('✅ Auction deleted successfully!');
        fetchSellerData();
      } else {
        alert(`❌ Failed to delete auction: ${response.message}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  if (!isAuthenticated || loading) {
    return null;
  }

  const activeAuctions = auctions.filter(a => a.status === 'active');
  const pendingAuctions = auctions.filter(a => a.status === 'pending');
  const endedAuctions = auctions.filter(a => a.status === 'ended' || a.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your auctions and track performance</p>
            </div>
            <button
              onClick={() => router.push('/create-auction')}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition shadow-lg"
            >
              ➕ Create New Auction
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {/* Wallet Balance — highlighted */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-sm p-6 text-white md:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-100 mb-1">Wallet Balance</p>
                <p className="text-2xl font-bold">ETB {walletBalance.toLocaleString()}</p>
                <p className="text-xs text-green-200 mt-1">Released funds available</p>
              </div>
              <div className="text-4xl">💳</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">ETB {stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Auctions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeAuctions}</p>
              </div>
              <div className="text-4xl">🔨</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Bids</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBids}</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'overview', name: 'Overview', count: auctions.length },
                { id: 'active', name: 'Active', count: activeAuctions.length },
                { id: 'pending', name: 'Pending', count: pendingAuctions.length },
                { id: 'ended', name: 'Ended', count: endedAuctions.length },
                { id: 'analytics', name: '📊 Analytics', count: null }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {tab.name}
                  {tab.count !== null && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Auctions List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">All Auctions</h2>
              {auctions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Auctions Yet</h3>
                  <p className="text-gray-600 mb-4">Create your first auction to start selling</p>
                  <button
                    onClick={() => router.push('/create-auction')}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition"
                  >
                    Create Auction
                  </button>
                </div>
              ) : (
                <AuctionsList auctions={auctions} onEnd={handleEndAuction} onDelete={handleDeleteAuction} router={router} />
              )}
            </div>
          )}

          {activeTab === 'active' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Active Auctions</h2>
              {activeAuctions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No active auctions</p>
                </div>
              ) : (
                <AuctionsList auctions={activeAuctions} onEnd={handleEndAuction} onDelete={handleDeleteAuction} router={router} />
              )}
            </div>
          )}

          {activeTab === 'pending' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Pending Auctions</h2>
              {pendingAuctions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No pending auctions</p>
                </div>
              ) : (
                <AuctionsList auctions={pendingAuctions} onEnd={handleEndAuction} onDelete={handleDeleteAuction} router={router} />
              )}
            </div>
          )}

          {activeTab === 'ended' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Ended Auctions</h2>
              {endedAuctions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No ended auctions</p>
                </div>
              ) : (
                <AuctionsList auctions={endedAuctions} onEnd={handleEndAuction} onDelete={handleDeleteAuction} router={router} />
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
              <SellerAnalyticsCharts auctions={auctions} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AuctionsList({ auctions, onEnd, onDelete, router }: any) {
  return (
    <div className="space-y-4">
      {auctions.map((auction: any) => {
        let images = [];
        try {
          images = typeof auction.images === 'string' ? JSON.parse(auction.images) : auction.images;
        } catch (e) {
          images = [];
        }
        const imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : '/Image/Iphone promax-15.webp';

        return (
          <div key={auction.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <img src={imageUrl} alt={auction.title} className="w-24 h-24 object-cover rounded-lg" />

              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">{auction.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{auction.category}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">
                    Current Bid: <span className="font-semibold text-gray-900">ETB {parseFloat(auction.current_bid || auction.starting_bid).toLocaleString()}</span>
                  </span>
                  <span className="text-gray-600">
                    Bids: <span className="font-semibold text-gray-900">{auction.total_bids || 0}</span>
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${auction.status === 'active' ? 'bg-green-100 text-green-700' :
                    auction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                    {auction.status}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => router.push(`/auction/${auction.id}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  View
                </button>
                {auction.status === 'active' && (
                  <button
                    onClick={() => onEnd(auction.id)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition"
                  >
                    End Early
                  </button>
                )}
                <button
                  onClick={() => onDelete(auction.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
