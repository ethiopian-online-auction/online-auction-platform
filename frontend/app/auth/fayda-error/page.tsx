'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: 'Session expired. Please try again.',
  missing_params: 'Invalid response from Fayda. Please try again.',
  account_suspended: 'Your account has been suspended.',
  server_error: 'A server error occurred. Please try again later.',
  access_denied: 'Authentication was cancelled.',
};

export default function FaydaErrorPage() {
  const params = useSearchParams();
  const error = params.get('error') || 'server_error';
  const message = ERROR_MESSAGES[error] || 'Something went wrong with Fayda authentication.';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Fayda Authentication Failed</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <Link
            href="/auth/login"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
