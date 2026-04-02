'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

interface AuctionCardProps {
  id: string;
  title: string;
  image: string;
  currentBid: number;
  timeLeft: string;
  bids: number;
  status?: string;
}

export default function AuctionCard({ id, title, image, currentBid, timeLeft, bids, status }: AuctionCardProps) {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleBidClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      router.push(`/auction/${id}`);
    }
  };

  const handleRegister = () => {
    router.push('/auth/register');
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  return (
    <>
      <Link href={`/auction/${id}`}>
        <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden group border border-gray-100">
          <div className="relative h-64 bg-gradient-to-br from-orange-300 to-orange-400 overflow-hidden">
            <Image
              src={image}
              alt={title}
              fill
              className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            />
            {/* Status Badge for Pending Auctions */}
            {status === 'pending' && (
              <div className="absolute top-4 left-4 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                <span>🔜</span>
                <span>Starting Soon</span>
              </div>
            )}
            {/* Time Badge */}
            <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
              <span>⏰</span>
              <span>{timeLeft}</span>
            </div>
            {/* Decorative element */}
            <div className="absolute bottom-0 right-0 w-16 h-full bg-orange-500 rounded-l-3xl"></div>
          </div>
          
          <div className="p-6">
            <h3 className="font-bold text-xl mb-4 text-gray-900 line-clamp-1">
              {title}
            </h3>
            
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">{t('currentBid')}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {currentBid.toLocaleString()} <span className="text-lg">ETB</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">{t('timeLeft')}</p>
                <p className="font-bold text-gray-900">{timeLeft}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-600 font-medium">
                {bids} bids
              </span>
              <button 
                onClick={handleBidClick}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Place Bid
              </button>
            </div>
          </div>
        </div>
      </Link>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">🔒 Authentication Required</h2>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🎯</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Place Your Bid?</h3>
                <p className="text-gray-600">
                  You need to be registered to participate in auctions. Join thousands of bidders today!
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleRegister}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Create Account
                </button>
                <button
                  onClick={handleLogin}
                  className="w-full px-6 py-3 bg-white border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 rounded-lg font-semibold transition"
                >
                  Already have an account? Login
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                By registering, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
