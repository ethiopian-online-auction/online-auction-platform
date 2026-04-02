'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function FaydaSuccessPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const token = params.get('token');
    const refresh = params.get('refresh');
    if (token) {
      loginWithToken(token, refresh || '');
      router.replace('/dashboard');
    } else {
      router.replace('/auth/login');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">🇪🇹</div>
        <p className="text-gray-600">Completing Fayda authentication...</p>
      </div>
    </div>
  );
}
