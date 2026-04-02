'use client';

import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface KYCStatus {
  kycVerified: boolean;
  faydaLinked: boolean;
  verifiedAt: string | null;
  mockMode: boolean;
}

interface Props {
  onVerified?: () => void;
  compact?: boolean; // smaller inline version
}

export default function FaydaVerify({ onVerified, compact = false }: Props) {
  const [status, setStatus] = useState<KYCStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);

  useEffect(() => {
    fetchStatus();

    // Handle return from Fayda callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('fayda') === 'verified') {
      fetchStatus();
      onVerified?.();
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { setLoading(false); return; }

      const res = await fetch(`${API}/auth/fayda/kyc/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setStatus(data.data);
    } catch (e) {
      console.error('Failed to fetch KYC status', e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setInitiating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/auth/fayda/kyc`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        alert('Failed to initiate Fayda verification');
      }
    } catch (e) {
      alert('Error connecting to Fayda service');
    } finally {
      setInitiating(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-12 bg-gray-100 rounded-lg" />;
  }

  if (status?.kycVerified) {
    if (compact) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          <span>🇪🇹</span> Fayda Verified
        </span>
      );
    }
    return (
      <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
        <div className="text-3xl">🇪🇹</div>
        <div className="flex-1">
          <p className="font-semibold text-green-800">Fayda Identity Verified</p>
          <p className="text-sm text-green-600">
            Your national ID has been verified via Fayda eSignet
            {status.verifiedAt && ` on ${new Date(status.verifiedAt).toLocaleDateString()}`}
          </p>
        </div>
        <span className="text-2xl">✅</span>
      </div>
    );
  }

  if (compact) {
    return (
      <button
        onClick={handleVerify}
        disabled={initiating}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        <span>🇪🇹</span>
        {initiating ? 'Redirecting...' : 'Verify with Fayda'}
      </button>
    );
  }

  return (
    <div className="p-5 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50">
      <div className="flex items-start gap-4">
        <div className="text-4xl">🇪🇹</div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-lg">Verify with Fayda National ID</h3>
          <p className="text-sm text-gray-600 mt-1 mb-3">
            Use your Ethiopian National ID (Fayda) to verify your identity. This increases trust
            and unlocks seller features.
          </p>
          {status?.mockMode && (
            <p className="text-xs text-amber-700 bg-amber-100 border border-amber-200 rounded-lg px-3 py-2 mb-3">
              ⚠️ Running in mock/demo mode — no real Fayda credentials needed
            </p>
          )}
          <button
            onClick={handleVerify}
            disabled={initiating}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            <span>🇪🇹</span>
            {initiating ? 'Redirecting to Fayda...' : 'Verify with Fayda eSignet'}
          </button>
        </div>
      </div>
    </div>
  );
}
