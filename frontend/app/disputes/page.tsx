'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';

export default function DisputesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    fetchDisputes();
  }, [isAuthenticated, router]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const api = (await import('@/lib/api')).default;
      const response = await api.getUserDisputes();

      if (response.success) {
        setDisputes(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching disputes:', error);
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'under_review':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleViewDispute = (dispute: any) => {
    setSelectedDispute(dispute);
    setShowDisputeModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dispute Resolution</h1>
          <p className="text-gray-600 mt-2">
            {disputes.filter(d => d.status === 'pending').length} pending disputes
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading disputes...</p>
          </div>
        ) : disputes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">⚖️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Disputes</h3>
            <p className="text-gray-600">You don't have any disputes at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <div
                key={dispute.id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition cursor-pointer"
                onClick={() => handleViewDispute(dispute)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {dispute.auction_title || 'Auction Dispute'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(dispute.status)}`}>
                        {dispute.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">Reason:</span> {dispute.reason}
                    </p>
                    
                    {dispute.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {dispute.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Seller: {dispute.seller_name}</span>
                      <span>•</span>
                      <span>Opened: {new Date(dispute.created_at).toLocaleDateString()}</span>
                      {dispute.resolved_at && (
                        <>
                          <span>•</span>
                          <span>Resolved: {new Date(dispute.resolved_at).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <button className="ml-4 text-blue-600 hover:text-blue-700 font-medium text-sm">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dispute Detail Modal */}
      {showDisputeModal && selectedDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Dispute Details</h2>
              <button
                onClick={() => {
                  setShowDisputeModal(false);
                  setSelectedDispute(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Auction</label>
                <p className="text-gray-900">{selectedDispute.auction_title}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedDispute.status)}`}>
                  {selectedDispute.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seller</label>
                <p className="text-gray-900">{selectedDispute.seller_name}</p>
                <p className="text-sm text-gray-600">{selectedDispute.seller_email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <p className="text-gray-900">{selectedDispute.reason}</p>
              </div>

              {selectedDispute.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedDispute.description}</p>
                </div>
              )}

              {selectedDispute.resolution && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-green-900 mb-1">Admin Resolution</label>
                  <p className="text-green-800">{selectedDispute.resolution}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opened</label>
                  <p className="text-gray-900">{new Date(selectedDispute.created_at).toLocaleString()}</p>
                </div>
                {selectedDispute.resolved_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resolved</label>
                    <p className="text-gray-900">{new Date(selectedDispute.resolved_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowDisputeModal(false);
                  setSelectedDispute(null);
                }}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
