'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [faydaLoading, setFaydaLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      if (email === 'admin@auction.et') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      setError(error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleFaydaLogin = async () => {
    setFaydaLoading(true);
    try {
      const res = await fetch(`${API}/auth/fayda/login`);
      const data = await res.json();
      if (data.success && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        alert('Failed to connect to Fayda service');
      }
    } catch {
      alert('Error connecting to Fayda service');
    } finally {
      setFaydaLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">{t('signIn')}</h2>
              <p className="mt-2 text-gray-600">
                {t('dontHaveAccount')}{' '}
                <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
                  {t('register')}
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('password')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                  {t('forgotPassword')}
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50"
              >
                {loading ? t('loading') : t('login')}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-5">
              <div className="flex-1 border-t border-gray-200" />
              <span className="px-3 text-sm text-gray-400">or</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            {/* Sign in with Fayda */}
            <button
              onClick={handleFaydaLogin}
              disabled={faydaLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-gray-800 font-medium rounded-lg transition disabled:opacity-50"
            >
              <span className="text-xl">🇪🇹</span>
              <span>{faydaLoading ? 'Connecting to Fayda...' : 'Sign in with Fayda National ID'}</span>
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              Powered by Fayda eSignet — Ethiopia National ID Program
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
