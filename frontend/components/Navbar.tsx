'use client';

import { useLanguage, languages, Language } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  const handleAuctionsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isAuthenticated) {
      e.preventDefault();
      router.push('/auth/register');
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              🔨 AuctionET
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">
                {t('home')}
              </Link>
              <Link 
                href="/auctions" 
                onClick={handleAuctionsClick}
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                Auctions
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-blue-600 font-medium">
                {t('aboutUs')}
              </Link>
              <Link href="/faq" className="text-gray-700 hover:text-blue-600 font-medium">
                {t('faq')}
              </Link>
              <Link href="/pricing" className="text-gray-700 hover:text-blue-600 font-medium">
                {t('pricing')}
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(languages).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>

            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {(user?.subscription.plan === 'seller' || user?.subscription.plan === 'premium') && (
                  <Link
                    href="/create-auction"
                    className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium"
                  >
                    + Create Auction
                  </Link>
                )}
                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 rounded-lg font-medium shadow-md"
                  >
                    🔐 Admin
                  </Link>
                )}
                <NotificationBell />
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
                >
                  {t('dashboard')}
                </Link>
                <Link
                  href="/settings"
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                  title="Settings"
                >
                  ⚙️
                </Link>
                <button
                  onClick={() => {
                    logout();
                    router.push('/');
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                >
                  {t('logout')}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
                >
                  {t('signIn')}
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium"
                >
                  {t('register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
