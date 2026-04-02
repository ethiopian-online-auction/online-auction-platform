'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ActivateSubscriptionPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'seller' | 'premium'>('seller');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    // If already a seller, redirect to create auction
    if (user?.subscription.plan === 'seller' || user?.subscription.plan === 'premium') {
      router.push('/create-auction');
    }
  }, [isAuthenticated, user, router]);

  const handleUpgrade = async () => {
    setLoading(true);
    
    try {
      // TODO: Implement actual upgrade API call
      // For now, show success message
      alert(`Upgrading to ${selectedPlan} plan...\n\nIn production, this would:\n1. Process payment\n2. Update your account\n3. Enable seller features\n\nFor now, please contact admin to upgrade your account.`);
      
      // Redirect to pricing page for now
      router.push('/pricing');
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to upgrade. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Upgrade to Seller</h1>
          <p className="text-lg text-gray-600">
            Choose a plan to start selling on our platform
          </p>
        </div>

        {/* Current Account Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-blue-900 mb-2">Current Account</h3>
          <div className="space-y-1">
            <p className="text-blue-800">Name: {user.name}</p>
            <p className="text-blue-800">Email: {user.email}</p>
            <p className="text-blue-800">Current Plan: <span className="font-bold capitalize">{user.subscription.plan}</span></p>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Seller Plan */}
          <div 
            onClick={() => setSelectedPlan('seller')}
            className={`bg-white rounded-2xl p-8 cursor-pointer transition-all border-2 ${
              selectedPlan === 'seller' 
                ? 'border-blue-600 shadow-xl' 
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            {selectedPlan === 'seller' && (
              <div className="absolute top-4 right-4 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Seller Plan</h3>
            <p className="text-gray-600 mb-6">For active sellers</p>
            
            <div className="mb-8">
              <span className="text-5xl font-bold text-gray-900">10%</span>
              <p className="text-gray-600 mt-2">Commission on sold items only</p>
            </div>

            <ul className="space-y-3">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Create unlimited listings</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Seller analytics dashboard</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Priority support</span>
              </li>
            </ul>
          </div>

          {/* Premium Plan */}
          <div 
            onClick={() => setSelectedPlan('premium')}
            className={`bg-white rounded-2xl p-8 cursor-pointer transition-all border-2 relative ${
              selectedPlan === 'premium' 
                ? 'border-purple-600 shadow-xl' 
                : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            {selectedPlan === 'premium' && (
              <div className="absolute top-4 right-4 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Best Value
              </span>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium Plan</h3>
            <p className="text-gray-600 mb-6">For power sellers</p>
            
            <div className="mb-8">
              <span className="text-5xl font-bold text-gray-900">999</span>
              <span className="text-gray-600">/month</span>
              <p className="text-gray-600 mt-2">+ 3% commission</p>
            </div>

            <ul className="space-y-3">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Everything in Seller</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Reduced commission (3%)</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Featured homepage placement</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Dedicated account manager</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : `Upgrade to ${selectedPlan === 'seller' ? 'Seller' : 'Premium'}`}
          </button>
        </div>

        {/* Note */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This is a demo. In production, this would process payment and upgrade your account automatically. 
            For now, please contact an administrator to upgrade your account to a seller plan.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
