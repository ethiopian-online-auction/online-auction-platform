'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [devCode, setDevCode] = useState('');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Save userId (always returned in dev)
      if (data.userId) setUserId(data.userId);
      // Auto-fill OTP in dev mode
      if (data.devOtp) {
        setOtp(data.devOtp);
        setDevCode(data.devOtp);
      }

      setCodeSent(true);
      setStep('reset');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess('Password reset successfully! You can now log in.');
    } catch (err: any) {
      setError(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🔐</div>
            <h2 className="text-3xl font-bold text-blue-600">Forgot Password?</h2>
            <p className="mt-2 text-gray-600">
              {step === 'email'
                ? "Enter your email and we'll send you a reset code."
                : `A reset code was sent to ${email}`}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Success */}
          {success ? (
            <div className="text-center space-y-4">
              <div className="text-5xl">✅</div>
              <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                {success}
              </div>
              <Link
                href="/auth/login"
                className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition text-center"
              >
                Go to Login
              </Link>
            </div>

          ) : step === 'email' ? (
            /* Step 1: Enter email */
            <form onSubmit={handleRequestReset} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
              <p className="text-center text-sm">
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-700">
                  ← Back to Login
                </Link>
              </p>
            </form>

          ) : (
            /* Step 2: Enter code + new password */
            <form onSubmit={handleResetPassword} className="space-y-5">

              {/* Code sent notice */}
              {devCode ? (
                <div className="p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg text-center">
                  <p className="text-xs text-yellow-700 font-medium mb-1">📋 Your Reset Code</p>
                  <p className="text-3xl font-bold tracking-[0.3em] text-yellow-800">{devCode}</p>
                  <p className="text-xs text-yellow-600 mt-1">Code expires in 15 minutes — already filled below</p>
                </div>
              ) : (
                <div className="p-3 bg-orange-50 border border-orange-300 rounded-lg text-sm text-orange-700 text-center">
                  ⚠️ Email not found in database. Please check the email address and try again.
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setError(''); }}
                    className="block mx-auto mt-2 text-blue-600 underline text-xs"
                  >
                    ← Try a different email
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reset Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none tracking-[0.5em] text-center text-xl font-bold"
                  placeholder="000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Min 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Repeat password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>

              <p className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(''); setOtp(''); }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  ← Back
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
