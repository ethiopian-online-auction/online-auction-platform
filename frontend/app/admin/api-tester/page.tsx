'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';

export default function ApiTesterPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [backendInfo, setBackendInfo] = useState<any>(null);
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  
  // Results
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Fraud check
  const [userIdToCheck, setUserIdToCheck] = useState('');
  
  // Review fraud
  const [alertId, setAlertId] = useState('');
  const [reviewAction, setReviewAction] = useState('dismiss');
  const [reviewNote, setReviewNote] = useState('');

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/admin/api-tester');
      return;
    }
    
    if (user && user.role !== 'admin') {
      alert('Access denied. Admin privileges required.');
      router.push('/dashboard');
      return;
    }
    
    // Get token from localStorage
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, [isAuthenticated, user, router]);

  // Check backend connection
  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:5000/health');
      const data = await response.json();
      setBackendStatus('connected');
      setBackendInfo(data);
    } catch (error) {
      setBackendStatus('disconnected');
      setBackendInfo({ error: 'Failed to fetch' });
    }
  };

  const apiCall = async (endpoint: string, method: string = 'GET', body?: any) => {
    setLoading(true);
    setError('');
    setResults(null);
    
    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const options: RequestInit = {
        method,
        headers,
      };
      
      if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
      }
      
      const response = await fetch(`http://localhost:5000/api${endpoint}`, options);
      const data = await response.json();
      
      setResults({
        status: response.status,
        statusText: response.statusText,
        data
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    await apiCall('/auth/login', 'POST', { email, password });
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
    setResults(null);
  };

  const exportData = (format: 'json' | 'csv') => {
    if (!results?.data) return;
    
    const dataStr = format === 'json' 
      ? JSON.stringify(results.data, null, 2)
      : convertToCSV(results.data);
    
    const blob = new Blob([dataStr], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${Date.now()}.${format}`;
    a.click();
  };

  const convertToCSV = (data: any) => {
    if (!Array.isArray(data)) data = [data];
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map((row: any) => 
      headers.map(header => JSON.stringify(row[header] || '')).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🧪 Phase 3-4 API Tester</h1>
          <p className="text-gray-600 mt-2">Test Activity Logging & Fraud Detection Features</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Connection Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">🔌 Connection Status</h2>
              <button
                onClick={checkBackendConnection}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-3"
              >
                Check Backend Connection
              </button>
              <div className={`p-3 rounded ${backendStatus === 'connected' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {backendStatus === 'checking' && '⏳ Checking...'}
                {backendStatus === 'connected' && '✅ Connected'}
                {backendStatus === 'disconnected' && '❌ Disconnected'}
              </div>
              {backendInfo && (
                <pre className="mt-3 p-3 bg-gray-50 rounded text-xs overflow-auto">
                  {JSON.stringify(backendInfo, null, 2)}
                </pre>
              )}
            </div>

            {/* Authentication */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">🔐 Authentication</h2>
              {!token ? (
                <>
                  <input
                    type="email"
                    placeholder="Email:"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded mb-2"
                  />
                  <input
                    type="password"
                    placeholder="Password:"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded mb-3"
                  />
                  <button
                    onClick={handleLogin}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Login
                  </button>
                </>
              ) : (
                <>
                  <div className="p-3 bg-green-50 text-green-800 rounded mb-3">
                    ✅ Authenticated
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>

            {/* Activity Logging */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">📊 Activity Logging</h2>
              <div className="space-y-2">
                <button
                  onClick={() => apiCall('/activity/my-logs')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Get My Activity Logs
                </button>
                <button
                  onClick={() => apiCall('/activity/logs')}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                >
                  Get All Activity Logs (Admin)
                </button>
                <button
                  onClick={() => apiCall('/activity/statistics')}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                >
                  Get Activity Statistics
                </button>
              </div>
            </div>

            {/* Fraud Detection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">🚨 Fraud Detection</h2>
              <div className="space-y-2">
                <button
                  onClick={() => apiCall('/fraud/alerts')}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Get Fraud Alerts
                </button>
                <button
                  onClick={() => apiCall('/fraud/statistics')}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                >
                  Get Fraud Statistics
                </button>
                <button
                  onClick={() => apiCall('/fraud/logs?riskLevel=high')}
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                >
                  Get High-Risk Users
                </button>
                <button
                  onClick={() => apiCall('/fraud/logs?riskLevel=critical')}
                  className="w-full px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 text-sm"
                >
                  Get Suspicious Activities
                </button>
              </div>
            </div>

            {/* Manual Fraud Check */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">🔍 Manual Fraud Check</h2>
              <input
                type="text"
                placeholder="User ID to Check:"
                value={userIdToCheck}
                onChange={(e) => setUserIdToCheck(e.target.value)}
                className="w-full px-3 py-2 border rounded mb-3"
              />
              <button
                onClick={() => apiCall('/fraud/analyze', 'POST', {
                  userId: userIdToCheck,
                  auctionId: 1,
                  bidAmount: 5000
                })}
                className="w-full px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
              >
                Run Fraud Check
              </button>
            </div>

            {/* Review Fraud Alert */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">⚖️ Review Fraud Alert</h2>
              <input
                type="text"
                placeholder="Alert ID:"
                value={alertId}
                onChange={(e) => setAlertId(e.target.value)}
                className="w-full px-3 py-2 border rounded mb-2"
              />
              <select
                value={reviewAction}
                onChange={(e) => setReviewAction(e.target.value)}
                className="w-full px-3 py-2 border rounded mb-2"
              >
                <option value="dismiss">Dismiss</option>
                <option value="warn">Warn</option>
                <option value="suspend">Suspend (7 days)</option>
                <option value="ban">Ban (Permanent)</option>
              </select>
              <textarea
                placeholder="Resolution Note:"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="w-full px-3 py-2 border rounded mb-3"
                rows={3}
              />
              <button
                onClick={() => apiCall(`/fraud/feedback/${alertId}`, 'POST', {
                  wasActualFraud: reviewAction !== 'dismiss'
                })}
                className="w-full px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
              >
                Submit Review
              </button>
            </div>

            {/* Export Data */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">📥 Export Data</h2>
              <div className="space-y-2">
                <button
                  onClick={() => exportData('json')}
                  disabled={!results}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 text-sm"
                >
                  Export Activity Logs (JSON)
                </button>
                <button
                  onClick={() => exportData('csv')}
                  disabled={!results}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 text-sm"
                >
                  Export Activity Logs (CSV)
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">📋 Results</h2>
              
              {loading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading...</p>
                </div>
              )}
              
              {error && (
                <div className="p-4 bg-red-50 text-red-800 rounded">
                  <p className="font-semibold">Error:</p>
                  <p>{error}</p>
                </div>
              )}
              
              {results && (
                <div>
                  <div className="mb-4 p-3 bg-gray-100 rounded">
                    <p className="text-sm">
                      <span className="font-semibold">Status:</span>{' '}
                      <span className={results.status === 200 ? 'text-green-600' : 'text-red-600'}>
                        {results.status} {results.statusText}
                      </span>
                    </p>
                  </div>
                  
                  <pre className="p-4 bg-gray-900 text-green-400 rounded overflow-auto max-h-[600px] text-sm">
                    {JSON.stringify(results.data, null, 2)}
                  </pre>
                </div>
              )}
              
              {!loading && !error && !results && (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-4xl mb-2">🎯</p>
                  <p>Select an action to test the API</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
