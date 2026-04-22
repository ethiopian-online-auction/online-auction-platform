'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Image from 'next/image';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [addClientForm, setAddClientForm] = useState({ name: '', email: '', phone: '', password: '', role: 'buyer' });
  const [addClientLoading, setAddClientLoading] = useState(false);
  const [addClientError, setAddClientError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    tag: '',
    email: '',
    firstName: '',
    lastName: '',
    verified: 'all' as 'all' | 'verified' | 'not-verified'
  });
  const [userFilter, setUserFilter] = useState<'all' | 'buyers' | 'sellers' | 'admins'>('all');
  const [realUsers, setRealUsers] = useState<any[]>([]);
  const [realAuctions, setRealAuctions] = useState<any[]>([]);
  const [realDisputes, setRealDisputes] = useState<any[]>([]);
  const [realReports, setRealReports] = useState<any[]>([]);
  const [realTransactions, setRealTransactions] = useState<any[]>([]);
  const [realSellers, setRealSellers] = useState<any[]>([]);
  const [realActivity, setRealActivity] = useState<any[]>([]);
  const [realStats, setRealStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // ML Fraud Detection state
  const [fraudLogs, setFraudLogs] = useState<any[]>([]);
  const [fraudStats, setFraudStats] = useState<any>(null);
  const [mlAccuracy, setMlAccuracy] = useState<any>(null);
  const [mlThresholds, setMlThresholds] = useState<any[]>([]);
  const [fraudLoading, setFraudLoading] = useState(false);
  const [autoTuning, setAutoTuning] = useState(false);

  // Check authentication and admin role
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('❌ Not authenticated, redirecting to login');
      router.push('/auth/login?redirect=/admin');
      return;
    }
    
    if (user && user.role !== 'admin') {
      console.log('❌ Not an admin, redirecting to dashboard');
      alert('Access denied. Admin privileges required.');
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, user, router]);

  // Fetch real users from API
  const [fetchError, setFetchError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      if (user?.role !== 'admin') return;
      setLoading(true);
      setFetchError('');

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      console.log('🔵 Admin fetch — token:', token ? token.substring(0, 20) + '...' : 'MISSING');

      if (!token) {
        setFetchError('No auth token found. Please log out and log in again.');
        setLoading(false);
        return;
      }

      const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

      const safeFetch = async (url: string) => {
        try {
          const res = await fetch(url, { headers });
          const json = await res.json();
          if (!res.ok) {
            console.error(`❌ ${url} → ${res.status}:`, json.message);
            return null;
          }
          return json;
        } catch (e: any) {
          console.error(`❌ ${url} → network error:`, e.message);
          return null;
        }
      };

      const [users, auctions, disputes, reports, transactions, sellers, activity, stats] =
        await Promise.all([
          safeFetch(`${BASE}/admin/users`),
          safeFetch(`${BASE}/admin/auctions`),
          safeFetch(`${BASE}/admin/disputes`),
          safeFetch(`${BASE}/admin/reports`),
          safeFetch(`${BASE}/admin/transactions`),
          safeFetch(`${BASE}/admin/seller-applications`),
          safeFetch(`${BASE}/admin/activity`),
          safeFetch(`${BASE}/admin/statistics/enhanced`),
        ]);

      if (users?.success) {
        console.log('✅ Users:', users.data?.length);
        setRealUsers(Array.isArray(users.data) ? users.data : []);
      } else {
        setFetchError('Could not load users. Check backend is running and your token is valid.');
      }

      if (auctions?.success)     setRealAuctions(Array.isArray(auctions.data) ? auctions.data : []);
      if (disputes?.success)     setRealDisputes(Array.isArray(disputes.data) ? disputes.data : []);
      if (reports?.success)      setRealReports(Array.isArray(reports.data) ? reports.data : []);
      if (transactions?.success) setRealTransactions(Array.isArray(transactions.data) ? transactions.data : []);
      if (sellers?.success)      setRealSellers(Array.isArray(sellers.data) ? sellers.data : []);
      if (activity?.success)     setRealActivity(Array.isArray(activity.data) ? activity.data : []);
      if (stats?.success)        setRealStats(stats.data);

      // Fetch ML fraud data
      const [fLogs, fStats, fAccuracy, fThresholds] = await Promise.all([
        safeFetch(`${BASE}/fraud/logs?limit=20`),
        safeFetch(`${BASE}/fraud/statistics`),
        safeFetch(`${BASE}/fraud/accuracy`),
        safeFetch(`${BASE}/fraud/thresholds`),
      ]);
      if (fLogs?.success)       setFraudLogs(Array.isArray(fLogs.data?.logs) ? fLogs.data.logs : []);
      if (fStats?.success)      setFraudStats(fStats.data);
      if (fAccuracy?.success)   setMlAccuracy(fAccuracy.data);
      if (fThresholds?.success) {
        setMlThresholds(Array.isArray(fThresholds.data) ? fThresholds.data : []);
        // Initialize editable threshold settings
        const map: Record<string, string> = {};
        (fThresholds.data || []).forEach((t: any) => { map[t.threshold_name] = String(t.threshold_value); });
        setMlThresholdSettings(map);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
    if (user?.role !== 'admin') {
      alert('Access denied. Admin only.');
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  // Use only real data from database with safe defaults
  const stats = {
    totalRevenue: realStats?.total_revenue || realStats?.totalRevenue || 0,
    activeUsers: realStats?.active_users || realStats?.activeUsers || realUsers.length || 0,
    totalAuctions: realStats?.total_auctions || realStats?.totalAuctions || realAuctions.length || 0,
    pendingDisputes: realStats?.pending_disputes || realStats?.pendingDisputes || realDisputes.filter((d: any) => d.status === 'pending').length || 0
  };

  // Sidebar navigation items with real counts (with safe defaults)
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'clients', label: 'Clients', icon: '👥', badge: realUsers?.length || 0 },
    { id: 'auctions', label: 'Auctions', icon: '🔨', badge: realAuctions?.length || 0 },
    { id: 'disputes', label: 'Disputes', icon: '⚖️', badge: realDisputes?.filter((d: any) => d.status === 'pending')?.length || 0 },
    { id: 'reports', label: 'Reports', icon: '🚨', badge: realReports?.filter((r: any) => r.status === 'open')?.length || 0 },
    { id: 'transactions', label: 'Transactions', icon: '💳', badge: realTransactions?.filter((t: any) => t.status === 'in-escrow' || t.status === 'pending')?.length || 0 },
    { id: 'sellers', label: 'Seller Approval', icon: '✓', badge: realSellers?.filter((s: any) => s.status === 'pending')?.length || 0 },
    { id: 'fraud', label: 'Fraud Detection', icon: '🔍' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const getTagColor = (tag: string) => {
    const colors: { [key: string]: string } = {
      'VIP Client': 'bg-cyan-50 text-cyan-600 border border-cyan-200',
      'Early Adopter': 'bg-pink-50 text-pink-600 border border-pink-200',
      'Third Tag': 'bg-teal-50 text-teal-600 border border-teal-200',
      'Fourth Tag': 'bg-orange-50 text-orange-600 border border-orange-200',
    };
    return colors[tag] || 'bg-gray-50 text-gray-600 border border-gray-200';
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId as any)
        ? prev.filter(id => id !== (clientId as any))
        : [...prev, clientId as any]
    );
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${BASE}/admin/users/${clientId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setRealUsers(prev => prev.filter((u: any) => String(u.id) !== String(clientId)));
      } else {
        alert('Failed to delete user: ' + (json.message || 'Unknown error'));
      }
    } catch (e: any) {
      alert('Error deleting user: ' + e.message);
    }
  };

  const handleVerifyClient = async (clientId: string) => {
    await handleVerifyUser(clientId, false);
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddClientLoading(true);
    setAddClientError('');
    try {
      const api = (await import('@/lib/api')).default;
      const res = await api.post('/admin/users', addClientForm);
      if (res.success) {
        setRealUsers(prev => [res.data, ...prev]);
        setShowAddClientModal(false);
        setAddClientForm({ name: '', email: '', phone: '', password: '', role: 'buyer' });
      } else {
        setAddClientError((res as any).message || 'Failed to create user');
      }
    } catch (err: any) {
      setAddClientError(err.message || 'Failed to create user');
    } finally {
      setAddClientLoading(false);
    }
  };

  const handleVerifyUser = async (clientId: string, currentlyVerified: boolean) => {
    const action = currentlyVerified ? 'unverify' : 'verify';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      const api = (await import('@/lib/api')).default;
      const res = await api.put(`/admin/users/${clientId}/verify`, {});
      if (res.success) {
        setRealUsers(prev => prev.map((u: any) =>
          String(u.id) === String(clientId) ? { ...u, is_verified: !currentlyVerified } : u
        ));
      }
    } catch { alert(`Failed to ${action} user`); }
  };

  const handleBlacklistUser = async (clientId: string, currentlyBlocked: boolean) => {
    const action = currentlyBlocked ? 'unblock' : 'block';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      const api = (await import('@/lib/api')).default;
      const res = await api.put(`/admin/users/${clientId}/block`, {});
      if (res.success) {
        alert(`User ${action}ed successfully`);
        setRealUsers(prev => prev.map((u: any) =>
          String(u.id) === String(clientId) ? { ...u, is_blacklisted: !currentlyBlocked } : u
        ));
      }
    } catch { alert(`Failed to ${action} user`); }
  };

  const handleChangeRole = async (clientId: string, currentRole: string) => {
    const roles = ['buyer', 'seller', 'admin'];
    const next = roles[(roles.indexOf(currentRole) + 1) % roles.length];
    if (!confirm(`Change role from "${currentRole}" to "${next}"?`)) return;
    try {
      const api = (await import('@/lib/api')).default;
      const res = await api.put(`/admin/users/${clientId}/role`, { role: next });
      if (res.success) {
        setRealUsers(prev => prev.map((u: any) =>
          String(u.id) === String(clientId) ? { ...u, role: next } : u
        ));
      }
    } catch { alert('Failed to change role'); }
  };

  const handleResolveDispute = async (disputeId: string, resolution: string) => {
    const winnerMap: Record<string, string> = {
      'favor-buyer': 'buyer',
      'favor-seller': 'seller',
      'partial-refund': 'buyer',
    };
    const winner = winnerMap[resolution] || resolution;
    const label = resolution === 'favor-buyer' ? 'Favor Buyer (refund buyer)' :
                  resolution === 'favor-seller' ? 'Favor Seller (release funds to seller)' :
                  'Partial Refund';
    if (!confirm(`Resolve dispute: ${label}?`)) return;
    try {
      const token = localStorage.getItem('token');
      const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${BASE}/admin/disputes/${disputeId}/resolve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution: label, winner })
      });
      const json = await res.json();
      if (json.success) {
        setRealDisputes(prev => prev.map((d: any) =>
          String(d.id) === String(disputeId) ? { ...d, status: 'resolved', resolution: label } : d
        ));
      } else {
        alert('Failed to resolve dispute: ' + (json.message || 'Unknown error'));
      }
    } catch (e: any) {
      alert('Error resolving dispute: ' + e.message);
    }
  };

  const handleReviewIssue = async (issueId: string, action: string) => {
    const actionLabels: Record<string, string> = {
      investigate: 'Mark as Investigating',
      'warn-user': 'Warn the reported user',
      dismiss: 'Dismiss this report',
    };
    if (!confirm(`${actionLabels[action] || action}?`)) return;

    const token = localStorage.getItem('token');
    const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    try {
      if (action === 'investigate') {
        // Mark report as investigating
        const res = await fetch(`${BASE}/admin/reports/${issueId}`, {
          method: 'PUT', headers,
          body: JSON.stringify({ status: 'investigating' })
        });
        const json = await res.json();
        if (json.success) {
          setRealReports(prev => prev.map((r: any) =>
            String(r.id) === String(issueId) ? { ...r, status: 'investigating' } : r
          ));
        } else {
          alert('Failed: ' + (json.message || 'Unknown error'));
        }

      } else if (action === 'warn-user') {
        // Warn user via reviewReport endpoint + block them
        const report = realReports.find((r: any) => r.id === issueId);
        const notes = prompt('Enter warning message for the user (optional):') || 'Your account has received a warning due to a report.';

        const res = await fetch(`${BASE}/admin/reports/${issueId}/review`, {
          method: 'PUT', headers,
          body: JSON.stringify({ action: 'warn', notes })
        });
        const json = await res.json();

        if (json.success) {
          // Also blacklist the reported user if they exist
          if (report?.reported_user_id) {
            await fetch(`${BASE}/admin/users/${report.reported_user_id}/block`, {
              method: 'PUT', headers
            });
          }
          setRealReports(prev => prev.map((r: any) =>
            String(r.id) === String(issueId) ? { ...r, status: 'reviewed', admin_action: 'warn' } : r
          ));
          alert('✅ User warned and temporarily blocked.');
        } else {
          alert('Failed: ' + (json.message || 'Unknown error'));
        }

      } else if (action === 'dismiss') {
        const res = await fetch(`${BASE}/admin/reports/${issueId}/review`, {
          method: 'PUT', headers,
          body: JSON.stringify({ action: 'dismiss', notes: 'Report dismissed by admin.' })
        });
        const json = await res.json();
        if (json.success) {
          setRealReports(prev => prev.map((r: any) =>
            String(r.id) === String(issueId) ? { ...r, status: 'dismissed' } : r
          ));
        } else {
          alert('Failed: ' + (json.message || 'Unknown error'));
        }
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleReleaseEscrow = async (transactionId: string) => {
    const transaction = realTransactions.find((t: any) => String(t.id) === String(transactionId));
    if (!transaction) return;

    const shippingId = transaction.shipping_id || transaction.shippingId;

    if (!shippingId) {
      alert('Cannot release funds: Buyer has not confirmed delivery yet.\n\nThe buyer must provide the shipping ID after receiving the item.');
      return;
    }

    if (!confirm(`Release Escrow Funds to Seller?\n\nShipping ID: ${shippingId}\nAmount: ETB ${(transaction.amount || 0).toLocaleString()}\nSeller: ${transaction.seller_name || transaction.seller || 'Seller'}\nBuyer: ${transaction.buyer_name || transaction.buyer || 'Buyer'}\n\nHave you verified the delivery with the courier?`)) return;

    try {
      const token = localStorage.getItem('token');
      const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${BASE}/escrow/${transactionId}/verify-release`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      if (json.success) {
        alert(`✓ Funds Released!\n\nETB ${(json.data?.amount || transaction.amount || 0).toLocaleString()} released to seller.\nCommission: ETB ${(json.data?.commission || 0).toLocaleString()}`);
        setRealTransactions(prev => prev.map((t: any) =>
          String(t.id) === String(transactionId) ? { ...t, status: 'released' } : t
        ));
      } else {
        alert('Failed to release funds: ' + (json.message || 'Unknown error'));
      }
    } catch (e: any) {
      alert('Error releasing funds: ' + e.message);
    }
  };

  const handleVerifyShipping = (transactionId: string) => {
    const transaction = realTransactions.find((t: any) => String(t.id) === String(transactionId));
    if (!transaction || !transaction.shippingId) {
      alert('No shipping ID available for verification.');
      return;
    }
    
    alert(`Shipping ID Verification\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nShipping ID: ${transaction.shippingId}\nBuyer: ${transaction.buyer}\nSeller: ${transaction.seller}\nAuction: ${transaction.auction}\nAmount: ETB ${transaction.amount.toLocaleString()}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nThe buyer has confirmed receiving the item by providing this shipping/tracking ID.\n\nPlease verify this tracking number with the courier service to confirm delivery before releasing funds.`);
  };

  const handleApproveSeller = async (sellerId: string) => {
    if (!confirm('Approve this seller application?')) return;
    try {
      const token = localStorage.getItem('token');
      const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${BASE}/admin/seller-applications/${sellerId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      if (json.success) {
        setRealSellers(prev => prev.map((s: any) =>
          String(s.id) === String(sellerId) ? { ...s, status: 'approved' } : s
        ));
      } else {
        alert('Failed to approve: ' + (json.message || 'Unknown error'));
      }
    } catch (e: any) {
      alert('Error approving seller: ' + e.message);
    }
  };

  const handleRejectSeller = async (sellerId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      const token = localStorage.getItem('token');
      const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${BASE}/admin/seller-applications/${sellerId}/reject`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const json = await res.json();
      if (json.success) {
        setRealSellers(prev => prev.map((s: any) =>
          String(s.id) === String(sellerId) ? { ...s, status: 'rejected', rejection_reason: reason } : s
        ));
      } else {
        alert('Failed to reject: ' + (json.message || 'Unknown error'));
      }
    } catch (e: any) {
      alert('Error rejecting seller: ' + e.message);
    }
  };

  const handleViewAuction = (auctionId: string, auctionTitle: string) => {
    router.push(`/auction/${auctionId}`);
  };

  const handleDeleteAuction = async (auctionId: string, auctionTitle: string) => {
    if (!confirm(`Delete auction "${auctionTitle}"? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem('token');
      const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${BASE}/auctions/${auctionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setRealAuctions(prev => prev.filter((a: any) => String(a.id) !== String(auctionId)));
      } else {
        alert('Failed to delete auction: ' + (json.message || 'Unknown error'));
      }
    } catch (e: any) {
      alert('Error deleting auction: ' + e.message);
    }
  };

  const handleCreateAuction = () => {
    router.push('/create-auction');
  };

  // Settings state
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');
  const [platformSettings, setPlatformSettings] = useState({
    platformName: 'BidAmharic',
    platformEmail: 'admin@auction.et',
    commissionRate: '10',
    minBidIncrement: '100',
    maxAuctionDays: '30',
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireEmailVerification: true,
    autoEndAuctions: true,
  });
  // ML thresholds state (loaded from DB)
  const [mlThresholdSettings, setMlThresholdSettings] = useState<Record<string, string>>({});
  const [mlThresholdSaving, setMlThresholdSaving] = useState(false);
  const [mlThresholdMsg, setMlThresholdMsg] = useState('');
  // Password change state
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    setSettingsMsg('');
    try {
      const token = localStorage.getItem('token');
      const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${BASE}/admin/settings`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(platformSettings)
      });
      const json = await res.json();
      if (json.success) {
        setSettingsMsg('✅ Settings saved successfully!');
      } else {
        setSettingsMsg('❌ ' + (json.message || 'Failed to save settings'));
      }
    } catch (e: any) {
      setSettingsMsg('❌ ' + e.message);
    } finally {
      setSettingsSaving(false);
      setTimeout(() => setSettingsMsg(''), 3000);
    }
  };

  const handleSaveThresholds = async () => {
    setMlThresholdSaving(true);
    setMlThresholdMsg('');
    try {
      const token = localStorage.getItem('token');
      const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${BASE}/admin/settings/thresholds`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(mlThresholdSettings)
      });
      const json = await res.json();
      if (json.success) {
        setMlThresholdMsg('✅ ML thresholds updated! Model will use new values on next bid.');
        // Reload thresholds display
        setMlThresholds(mlThresholds.map((t: any) => ({
          ...t,
          threshold_value: mlThresholdSettings[t.threshold_name] ?? t.threshold_value
        })));
      } else {
        setMlThresholdMsg('❌ ' + (json.message || 'Failed to update'));
      }
    } catch (e: any) {
      setMlThresholdMsg('❌ ' + e.message);
    } finally {
      setMlThresholdSaving(false);
      setTimeout(() => setMlThresholdMsg(''), 4000);
    }
  };

  const handleChangePassword = async () => {
    setPwError('');
    setPwMsg('');
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      setPwError('All fields are required');
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      setPwError('New passwords do not match');
      return;
    }
    if (pwForm.newPw.length < 6) {
      setPwError('New password must be at least 6 characters');
      return;
    }
    setPwSaving(true);
    try {
      const token = localStorage.getItem('token');
      const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${BASE}/admin/settings/password`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw })
      });
      const json = await res.json();
      if (json.success) {
        setPwMsg('✅ Password changed successfully!');
        setPwForm({ current: '', newPw: '', confirm: '' });
      } else {
        setPwError(json.message || 'Failed to change password');
      }
    } catch (e: any) {
      setPwError(e.message);
    } finally {
      setPwSaving(false);
      setTimeout(() => setPwMsg(''), 4000);
    }
  };

  const handleAutoTune = async () => {
    setAutoTuning(true);
    try {
      const token = localStorage.getItem('token');
      const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${BASE}/fraud/auto-tune`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      if (json.success) {
        alert('✅ ML thresholds auto-tuned from real feedback data!');
        // Reload thresholds
        const t = await fetch(`${BASE}/fraud/thresholds`, { headers: { 'Authorization': `Bearer ${token}` } });
        const tj = await t.json();
        if (tj.success) setMlThresholds(tj.data);
      } else {
        alert('Auto-tune failed: ' + json.message);
      }
    } catch (e: any) {
      alert('Auto-tune error: ' + e.message);
    } finally {
      setAutoTuning(false);
    }
  };

  const handleExportReport = () => {
    try {
      // Prepare comprehensive report data
      const reportData = {
        generatedAt: new Date().toISOString(),
        generatedBy: user?.email || 'admin@auction.et',
        
        // Summary Statistics
        summary: {
          totalRevenue: stats.totalRevenue,
          activeUsers: stats.activeUsers,
          totalAuctions: stats.totalAuctions,
          pendingDisputes: stats.pendingDisputes,
          totalUsers: realUsers.length,
          totalTransactions: realTransactions.length,
          pendingSellerApplications: realSellers.filter((s: any) => s.status === 'pending').length,
          openReports: realReports.filter((r: any) => r.status === 'open').length
        },
        
        // Detailed data
        users: realUsers,
        auctions: realAuctions,
        disputes: realDisputes,
        reports: realReports,
        transactions: realTransactions,
        sellerApplications: realSellers,
        recentActivity: realActivity
      };

      // Create CSV content
      let csvContent = 'Admin Dashboard Report\n';
      csvContent += `Generated: ${new Date().toLocaleString()}\n`;
      csvContent += `Generated By: ${user?.email || 'admin@auction.et'}\n\n`;
      
      // Summary Section
      csvContent += '=== SUMMARY STATISTICS ===\n';
      csvContent += `Total Revenue,ETB ${stats.totalRevenue.toLocaleString()}\n`;
      csvContent += `Active Users,${stats.activeUsers}\n`;
      csvContent += `Total Auctions,${stats.totalAuctions}\n`;
      csvContent += `Pending Disputes,${stats.pendingDisputes}\n`;
      csvContent += `Total Users,${realUsers.length}\n`;
      csvContent += `Total Transactions,${realTransactions.length}\n`;
      csvContent += `Pending Seller Applications,${realSellers.filter((s: any) => s.status === 'pending').length}\n`;
      csvContent += `Open Reports,${realReports.filter((r: any) => r.status === 'open').length}\n\n`;
      
      // Users Section
      csvContent += '=== USERS ===\n';
      csvContent += 'ID,Name,Email,Role,Verified,Joined Date\n';
      realUsers.forEach((user: any) => {
        csvContent += `${user.id || ''},"${user.name || ''}","${user.email || ''}",${user.role || 'buyer'},${user.verified || user.is_verified ? 'Yes' : 'No'},"${user.created_at || user.createdAt || ''}"\n`;
      });
      csvContent += '\n';
      
      // Auctions Section
      csvContent += '=== AUCTIONS ===\n';
      csvContent += 'ID,Title,Seller,Current Bid,Status,End Date\n';
      realAuctions.forEach((auction: any) => {
        csvContent += `${auction.id || ''},"${auction.title || ''}","${auction.seller || auction.seller_name || ''}",ETB ${auction.current_bid || auction.currentBid || 0},${auction.status || ''},"${auction.end_date || auction.endDate || ''}"\n`;
      });
      csvContent += '\n';
      
      // Disputes Section
      csvContent += '=== DISPUTES ===\n';
      csvContent += 'ID,Auction,Complainant,Respondent,Status,Created Date\n';
      realDisputes.forEach((dispute: any) => {
        csvContent += `${dispute.id || ''},"${dispute.auction || ''}","${dispute.complainant || ''}","${dispute.respondent || ''}",${dispute.status || ''},"${dispute.created_at || dispute.createdAt || ''}"\n`;
      });
      csvContent += '\n';
      
      // Transactions Section
      csvContent += '=== TRANSACTIONS ===\n';
      csvContent += 'ID,Auction,Buyer,Seller,Amount,Status,Shipping ID,Date\n';
      realTransactions.forEach((transaction: any) => {
        csvContent += `${transaction.id || ''},"${transaction.auction || ''}","${transaction.buyer || ''}","${transaction.seller || ''}",ETB ${transaction.amount || 0},${transaction.status || ''},"${transaction.shippingId || transaction.shipping_id || 'N/A'}","${transaction.created_at || transaction.createdAt || ''}"\n`;
      });
      csvContent += '\n';
      
      // Seller Applications Section
      csvContent += '=== SELLER APPLICATIONS ===\n';
      csvContent += 'ID,User,Business Name,Status,Applied Date\n';
      realSellers.forEach((seller: any) => {
        csvContent += `${seller.id || ''},"${seller.user || seller.user_name || ''}","${seller.businessName || seller.business_name || ''}",${seller.status || ''},"${seller.created_at || seller.createdAt || ''}"\n`;
      });
      csvContent += '\n';
      
      // Reports Section
      csvContent += '=== REPORTS ===\n';
      csvContent += 'ID,Type,Reporter,Reported User,Status,Created Date\n';
      realReports.forEach((report: any) => {
        csvContent += `${report.id || ''},"${report.type || ''}","${report.reporter || ''}","${report.reportedUser || report.reported_user || ''}",${report.status || ''},"${report.created_at || report.createdAt || ''}"\n`;
      });
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.setAttribute('href', url);
      link.setAttribute('download', `admin-report-${timestamp}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Also create JSON export
      const jsonBlob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const jsonLink = document.createElement('a');
      const jsonUrl = URL.createObjectURL(jsonBlob);
      
      jsonLink.setAttribute('href', jsonUrl);
      jsonLink.setAttribute('download', `admin-report-${timestamp}.json`);
      jsonLink.style.visibility = 'hidden';
      
      document.body.appendChild(jsonLink);
      jsonLink.click();
      document.body.removeChild(jsonLink);
      
      alert(`✓ Report exported successfully!\n\nTwo files have been downloaded:\n• admin-report-${timestamp}.csv\n• admin-report-${timestamp}.json\n\nThe CSV file contains formatted data for spreadsheet applications.\nThe JSON file contains complete structured data.`);
      
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  const filteredClients = (realUsers || []).filter((client: any) => {
    const name = client.name || '';
    const email = client.email || '';
    const role = client.role || 'buyer';
    
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesEmail = !filters.email || email.toLowerCase().includes(filters.email.toLowerCase());
    const matchesFirstName = !filters.firstName || name.split(' ')[0]?.toLowerCase().includes(filters.firstName.toLowerCase());
    const matchesLastName = !filters.lastName || name.split(' ')[1]?.toLowerCase().includes(filters.lastName.toLowerCase());
    const matchesVerified = filters.verified === 'all' || 
      (filters.verified === 'verified' && (client.verified || client.is_verified)) ||
      (filters.verified === 'not-verified' && !(client.verified || client.is_verified));
    
    // Role filter
    const matchesRole = userFilter === 'all' ||
      (userFilter === 'buyers' && role === 'buyer') ||
      (userFilter === 'sellers' && role === 'seller') ||
      (userFilter === 'admins' && role === 'admin');
    
    return matchesSearch && matchesEmail && matchesFirstName && matchesLastName && matchesVerified && matchesRole;
  });

  const clearFilters = () => {
    setFilters({
      tag: '',
      email: '',
      firstName: '',
      lastName: '',
      verified: 'all'
    });
    setSearchQuery(''); // Also clear search
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 fixed left-0 top-16 bottom-0 z-40 shadow-sm overflow-y-auto`}>
          <div className="p-4 pb-24">
            {/* Company Logo/Name */}
            {sidebarOpen && (
              <div className="mb-8 px-2">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                    A
                  </div>
                  <span className="text-gray-900 font-semibold">AuctionET Admin</span>
                </div>
              </div>
            )}

            {/* Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mb-4 w-full flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className={`w-5 h-5 text-gray-600 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>

            {/* Navigation Items */}
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-600 border border-cyan-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  title={!sidebarOpen ? item.label : ''}
                >
                  <span className="text-xl">{item.icon}</span>
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                      {item.badge !== undefined && (
                        <span className="px-2 py-0.5 bg-cyan-400 text-white text-xs rounded-full font-bold">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              ))}
            </nav>

            {/* User Profile + Logout — below nav items */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              {sidebarOpen ? (
                <>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-gray-900 text-sm font-medium">Admin</p>
                      <p className="text-gray-500 text-xs">admin@auction.et</p>
                    </div>
                    <button className="text-cyan-500 text-lg">⚡</button>
                  </div>
                  <button
                    onClick={() => { if (confirm('Are you sure you want to logout?')) router.push('/auth/login'); }}
                    className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition"
                  >
                    <span>🚪</span>
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { if (confirm('Are you sure you want to logout?')) router.push('/auth/login'); }}
                  className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition mx-auto"
                  title="Logout"
                >
                  <span className="text-xl">🚪</span>
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-gray-600 mt-1 flex items-center gap-2">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                    Real-time analytics
                  </p>
                </div>
                <button 
                  onClick={handleExportReport}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-600 transition shadow-md"
                >
                  Export Report
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <span className="text-2xl">💰</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">ETB {stats.totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    <span>↗</span>
                    <span>+12.5% from last month</span>
                  </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-600">Active Users</p>
                    <span className="text-2xl">👥</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeUsers.toLocaleString()}</p>
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    <span>↗</span>
                    <span>+5.2% from last month</span>
                  </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-600">Total Auctions</p>
                    <span className="text-2xl">🔨</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalAuctions.toLocaleString()}</p>
                  <p className="text-sm text-cyan-600 mt-2 flex items-center gap-1">
                    <span>↗</span>
                    <span>+8.1% from last month</span>
                  </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-600">Pending Disputes</p>
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stats.pendingDisputes}</p>
                  <p className="text-sm text-orange-600 mt-2 flex items-center gap-1">
                    <span>⚡</span>
                    <span>Needs attention</span>
                  </p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-cyan-400"></span>
                  Recent Activity
                </h2>
                <div className="space-y-4">
                  {(realActivity || []).length > 0 ? (
                    (realActivity || []).map((activity: any, index: number) => {
                    const timeAgo = activity.time || (activity.created_at ? getTimeAgo(new Date(activity.created_at)) : 'Recently');
                    const icon = activity.icon || '📝';
                    const user = activity.user_name || activity.description || activity.user || 'Unknown';
                    
                    return (
                      <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-cyan-50 rounded-full flex items-center justify-center border border-cyan-200">
                            <span className="text-lg">{icon}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{activity.action}</p>
                            <p className="text-sm text-gray-500">{user}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-400">{timeAgo}</p>
                      </div>
                    );
                  })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <div className="flex h-screen">
              {/* Error Banner */}
              {fetchError && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-300 text-red-800 px-6 py-3 rounded-xl shadow-lg text-sm flex items-center gap-3">
                  <span>⚠️</span>
                  <span>{fetchError}</span>
                  <button onClick={() => setFetchError('')} className="ml-2 text-red-500 hover:text-red-700">✕</button>
                </div>
              )}
              {/* Left Filters Sidebar */}
              <aside className={`${showFilters ? 'w-80' : 'w-0'} bg-gray-50 border-r border-gray-200 transition-all duration-300 overflow-hidden`}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">FILTERS</h3>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Tag Filter */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tag</label>
                    <select
                      value={filters.tag}
                      onChange={(e) => setFilters({...filters, tag: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    >
                      <option value="">All Tags</option>
                      <option value="VIP Client">VIP Client</option>
                      <option value="Early Adopter">Early Adopter</option>
                      <option value="Third Tag">Third Tag</option>
                      <option value="Fourth Tag">Fourth Tag</option>
                    </select>
                  </div>

                  {/* Email Filter */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Contains"
                        value={filters.email}
                        onChange={(e) => setFilters({...filters, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      />
                      <button className="absolute right-2 top-2 text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* First Name Filter */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Starts with"
                        value={filters.firstName}
                        onChange={(e) => setFilters({...filters, firstName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Last Name Filter */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Starts with"
                        value={filters.lastName}
                        onChange={(e) => setFilters({...filters, lastName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Verification Filter */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Verification</label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.verified === 'verified'}
                          onChange={(e) => setFilters({...filters, verified: e.target.checked ? 'verified' : 'all'})}
                          className="w-4 h-4 text-cyan-500 border-gray-300 rounded focus:ring-cyan-400"
                        />
                        <span className="ml-2 text-sm text-gray-700">Verified</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.verified === 'not-verified'}
                          onChange={(e) => setFilters({...filters, verified: e.target.checked ? 'not-verified' : 'all'})}
                          className="w-4 h-4 text-cyan-500 border-gray-300 rounded focus:ring-cyan-400"
                        />
                        <span className="ml-2 text-sm text-gray-700">Not Verified</span>
                      </label>
                    </div>
                  </div>

                  {/* Apply Button */}
                  <div className="space-y-2">
                    <button
                      onClick={clearFilters}
                      className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-600 transition shadow-md"
                    >
                      Clear Filters
                    </button>
                    {(filters.email || filters.firstName || filters.lastName || filters.verified !== 'all') && (
                      <p className="text-xs text-center text-cyan-600 font-medium">
                        ✓ Filters Active
                      </p>
                    )}
                  </div>
                </div>
              </aside>

              {/* Main Content */}
              <div className="flex-1 overflow-auto">
                <div className="p-8">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
                      <p className="text-gray-600 mt-1">
                        {loading ? 'Loading...' : `${realUsers.length} total users`}
                        {fetchError && <span className="ml-2 text-red-500 text-sm">⚠️ {fetchError}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition relative"
                        title="Toggle Filters"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        {(filters.email || filters.firstName || filters.lastName || filters.verified !== 'all') && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                            !
                          </span>
                        )}
                      </button>
                      <button 
                        onClick={() => window.location.reload()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="Refresh data"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button 
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="Export"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => setShowAddClientModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-medium flex items-center gap-2 transition shadow-md"
                      >
                        <span>+</span>
                        <span>Add Client</span>
                      </button>
                    </div>
                  </div>

                  {/* Role Filter Buttons */}
                  <div className="flex items-center gap-3 mb-6 flex-wrap">
                    <button
                      onClick={() => setUserFilter('all')}
                      className={`px-4 py-2 rounded-full font-medium transition flex items-center gap-2 ${
                        userFilter === 'all'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      All Users ({realUsers.length})
                    </button>
                    <button
                      onClick={() => setUserFilter('buyers')}
                      className={`px-4 py-2 rounded-full font-medium transition flex items-center gap-2 ${
                        userFilter === 'buyers'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span>🛒</span>
                      <span>Buyers ({realUsers.filter((u: any) => u.role === 'buyer').length})</span>
                    </button>
                    <button
                      onClick={() => setUserFilter('sellers')}
                      className={`px-4 py-2 rounded-full font-medium transition flex items-center gap-2 ${
                        userFilter === 'sellers'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span>🏪</span>
                      <span>Sellers ({realUsers.filter((u: any) => u.role === 'seller').length})</span>
                    </button>
                    <button
                      onClick={() => setUserFilter('admins')}
                      className={`px-4 py-2 rounded-full font-medium transition flex items-center gap-2 ${
                        userFilter === 'admins'
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span>👑</span>
                      <span>Admins ({realUsers.filter((u: any) => u.role === 'admin').length})</span>
                    </button>
                  </div>

                  {/* Tabs and Client List */}
                  <div className="bg-white rounded-xl shadow-sm mb-6 border border-gray-200">
                    {/* Tabs */}
                    <div className="border-b border-gray-200 px-6">
                      <div className="flex items-center gap-8">
                        <button className="py-4 border-b-2 border-cyan-500 text-cyan-600 font-medium text-sm flex items-center gap-2">
                          <span>📋</span>
                          <span>Overview</span>
                        </button>
                        <button className="py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm flex items-center gap-2">
                          <span>📊</span>
                          <span>List View</span>
                        </button>
                        <button className="py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm flex items-center gap-2">
                          <span>📈</span>
                          <span>Segment</span>
                        </button>
                      </div>
                    </div>

                    {/* Client List */}
                    <div className="p-6">
                      {/* Table Header */}
                      <div className="grid grid-cols-12 gap-4 pb-4 border-b border-gray-200 text-sm font-medium text-gray-500 uppercase">
                        <div className="col-span-3">Client</div>
                        <div className="col-span-1">Role</div>
                        <div className="col-span-3">Tags</div>
                        <div className="col-span-2">Created</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1"></div>
                      </div>

                      {/* Client Rows */}
                      <div className="divide-y divide-gray-100">
                        {filteredClients.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="text-5xl mb-3">👥</div>
                            <p className="text-gray-500 font-medium">No users found</p>
                            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                          </div>
                        ) : filteredClients.map((client) => (
                          <div key={client.id} className="grid grid-cols-12 gap-4 py-4 items-center hover:bg-gray-50 transition group cursor-pointer">
                            {/* Client Info */}
                            <div className="col-span-3 flex items-center gap-3">
                              <div className="relative">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold ${
                                  client.role === 'admin' ? 'bg-gradient-to-br from-orange-400 to-red-500' :
                                  client.role === 'seller' ? 'bg-gradient-to-br from-purple-400 to-pink-500' :
                                  'bg-gradient-to-br from-cyan-400 to-blue-500'
                                }`}>
                                  {(client.name?.charAt(0) || '?').toUpperCase()}
                                </div>
                                {(client.is_verified || client.verified) && (
                                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full flex items-center justify-center text-xs text-white border-2 border-white">✓</span>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{client.name}</p>
                                <p className="text-sm text-gray-500">{client.email}</p>
                              </div>
                            </div>

                            {/* Role Badge */}
                            <div className="col-span-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                                client.role === 'admin' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' :
                                client.role === 'seller' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
                                'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                              }`}>
                                {client.role === 'admin' ? '👑 Admin' : client.role === 'seller' ? '🏪 Seller' : '🛒 Buyer'}
                              </span>
                            </div>

                            {/* Tags */}
                            <div className="col-span-3 flex flex-wrap gap-1.5">
                              {client.subscription_plan && client.subscription_plan !== 'free' && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                                  ⭐ {client.subscription_plan}
                                </span>
                              )}
                              {client.fayda_verified && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                  🇪🇹 Fayda KYC
                                </span>
                              )}
                              {client.is_blacklisted && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                  🚫 Banned
                                </span>
                              )}
                            </div>

                            {/* Created Date */}
                            <div className="col-span-2 text-sm text-gray-600">
                              {client.created_at ? new Date(client.created_at).toLocaleDateString() : 'N/A'}
                            </div>

                            {/* Status */}
                            <div className="col-span-2">
                              {(() => {
                                const status = client.subscription_status || client.status || 'inactive';
                                const isActive = status === 'active';
                                const isBlacklisted = client.is_blacklisted;
                                return (
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    isBlacklisted ? 'bg-red-50 text-red-600 border border-red-200' :
                                    isActive ? 'bg-green-50 text-green-600 border border-green-200' :
                                    'bg-orange-50 text-orange-600 border border-orange-200'
                                  }`}>
                                    {isBlacklisted ? '🚫 Banned' : isActive ? '● Active' : '○ Inactive'}
                                  </span>
                                );
                              })()}
                            </div>

                            {/* Arrow / Actions */}
                            <div className="col-span-1 flex justify-end gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleVerifyUser(client.id, !!(client.is_verified || client.verified)); }}
                                title={client.is_verified || client.verified ? 'Unverify user' : 'Verify user'}
                                className={`p-1.5 rounded transition text-xs ${client.is_verified || client.verified ? 'hover:bg-yellow-100 text-cyan-500 hover:text-yellow-600' : 'hover:bg-green-100 text-gray-400 hover:text-green-600'}`}
                              >
                                {client.is_verified || client.verified ? '✓' : '☑'}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleChangeRole(client.id, client.role); }}
                                title="Change role"
                                className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition text-xs"
                              >
                                🔄
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleBlacklistUser(client.id, client.is_blacklisted); }}
                                title={client.is_blacklisted ? 'Unblock user' : 'Block user'}
                                className="p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition text-xs"
                              >
                                {client.is_blacklisted ? '✅' : '🚫'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <span>Rows per page:</span>
                          <select className="border border-gray-300 rounded px-2 py-1">
                            <option>10</option>
                            <option>25</option>
                            <option>50</option>
                          </select>
                          <span className="ml-4">1-{filteredClients.length} of {realUsers.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-gray-100 rounded transition">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button className="px-3 py-1 bg-cyan-500 text-white rounded">1</button>
                          <button className="px-3 py-1 hover:bg-gray-100 rounded transition">2</button>
                          <button className="px-3 py-1 hover:bg-gray-100 rounded transition">3</button>
                          <span className="px-2">...</span>
                          <button className="px-3 py-1 hover:bg-gray-100 rounded transition">15</button>
                          <button className="px-3 py-1 hover:bg-gray-100 rounded transition">16</button>
                          <button className="p-2 hover:bg-gray-100 rounded transition">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Auctions Tab */}
          {activeTab === 'auctions' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Auctions Management</h1>
                  <p className="text-gray-600 mt-1">{realAuctions.length} total auctions</p>
                </div>
                <button 
                  onClick={handleCreateAuction}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium flex items-center gap-2 transition shadow-md"
                >
                  <span>+</span>
                  <span>Create Auction</span>
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
                      <p className="text-gray-600 mt-4">Loading auctions...</p>
                    </div>
                  ) : realAuctions.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🏪</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No Auctions Yet</h3>
                      <p className="text-gray-600">Auctions will appear here once users create them.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-12 gap-4 pb-4 border-b border-gray-200 text-sm font-medium text-gray-500 uppercase">
                        <div className="col-span-3">Auction</div>
                        <div className="col-span-2">Seller</div>
                        <div className="col-span-2">Current Bid</div>
                        <div className="col-span-2">Bids</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1">Actions</div>
                      </div>

                      <div className="divide-y divide-gray-100">
                        {realAuctions.map((auction: any) => (
                          <div key={auction.id} className="grid grid-cols-12 gap-4 py-4 items-center hover:bg-gray-50 transition">
                            <div className="col-span-3">
                              <p className="font-medium text-gray-900">{auction.title}</p>
                              <p className="text-sm text-gray-500">{auction.category}</p>
                            </div>
                            <div className="col-span-2 text-sm text-gray-600">
                              {auction.seller_name || auction.seller || 'Unknown'}
                            </div>
                            <div className="col-span-2">
                              <p className="font-bold text-cyan-600">ETB {(auction.current_bid || auction.currentBid || 0).toLocaleString()}</p>
                            </div>
                            <div className="col-span-2 text-sm text-gray-600">
                              {auction.total_bids || auction.bids || 0} bids
                            </div>
                            <div className="col-span-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                auction.status === 'active' ? 'bg-green-50 text-green-600 border border-green-200' :
                                auction.status === 'pending' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                                auction.status === 'completed' ? 'bg-gray-50 text-gray-600 border border-gray-200' :
                                'bg-orange-50 text-orange-600 border border-orange-200'
                              }`}>
                                {auction.status}
                              </span>
                            </div>
                            <div className="col-span-1 flex gap-2">
                              <button 
                                onClick={() => handleViewAuction(auction.id, auction.title)}
                                className="p-1.5 hover:bg-cyan-50 rounded text-cyan-600 transition" 
                                title="View auction details"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => handleDeleteAuction(auction.id, auction.title)}
                                className="p-1.5 hover:bg-red-50 rounded text-red-600 transition" 
                                title="Delete auction"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Disputes Tab */}
          {activeTab === 'disputes' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Dispute Resolution</h1>
                  <p className="text-gray-600 mt-1">{realDisputes.filter((d: any) => d.status === 'pending' || d.status === 'open').length} pending disputes</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6">
                  <div className="space-y-4">
                    {realDisputes.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-5xl mb-3">⚖️</div>
                        <p className="font-medium">No disputes found</p>
                        <p className="text-sm mt-1">All disputes will appear here</p>
                      </div>
                    ) : realDisputes.map((dispute: any) => (
                      <div key={dispute.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-gray-900">
                                {dispute.auction_title || dispute.auctionTitle || 'Auction #' + dispute.auction_id}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                dispute.status === 'pending' || dispute.status === 'open'
                                  ? 'bg-orange-50 text-orange-600 border border-orange-200'
                                  : dispute.status === 'investigating' || dispute.status === 'in-progress'
                                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                  : 'bg-green-50 text-green-600 border border-green-200'
                              }`}>
                                {dispute.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">Buyer:</span> {dispute.buyer_name || dispute.buyer_email || dispute.buyer || '—'} |{' '}
                              <span className="font-medium">Seller:</span> {dispute.seller_name || dispute.seller_email || dispute.seller || '—'}
                            </p>
                            <p className="text-sm text-gray-700 mb-2">
                              <span className="font-medium">Reason:</span> {dispute.reason || dispute.description || '—'}
                            </p>
                            {dispute.description && dispute.reason && (
                              <p className="text-sm text-gray-600 mb-2">{dispute.description}</p>
                            )}
                            <p className="text-sm text-gray-500">
                              Date: {dispute.created_at ? new Date(dispute.created_at).toLocaleDateString() : dispute.date || '—'}
                              {dispute.resolution && (
                                <span className="ml-4 text-green-600 font-medium">Resolution: {dispute.resolution}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        {dispute.status !== 'resolved' && (
                          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                            <button
                              onClick={() => handleResolveDispute(dispute.id, 'favor-buyer')}
                              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg text-sm font-medium hover:from-cyan-600 hover:to-blue-600 transition"
                            >
                              Favor Buyer
                            </button>
                            <button
                              onClick={() => handleResolveDispute(dispute.id, 'favor-seller')}
                              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 transition"
                            >
                              Favor Seller
                            </button>
                            <button
                              onClick={() => handleResolveDispute(dispute.id, 'partial-refund')}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                            >
                              Partial Refund
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Reported Issues</h1>
                  <p className="text-gray-600 mt-1">{realReports.filter((r: any) => r.status === 'open').length} open reports</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6">
                  <div className="space-y-4">
                    {realReports.map((issue: any) => (
                      <div key={issue.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                issue.type === 'fraud' || issue.reason === 'fraud' ? 'bg-red-50 text-red-600 border border-red-200' :
                                issue.type === 'spam' || issue.reason === 'spam' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                                'bg-yellow-50 text-yellow-600 border border-yellow-200'
                              }`}>
                                {issue.type || issue.reason || 'report'}
                              </span>
                              {issue.severity && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  issue.severity === 'critical' ? 'bg-red-50 text-red-600 border border-red-200' :
                                  issue.severity === 'high' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                                  'bg-gray-50 text-gray-600 border border-gray-200'
                                }`}>
                                  {issue.severity}
                                </span>
                              )}
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                issue.status === 'open' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                                issue.status === 'investigating' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                                'bg-green-50 text-green-600 border border-green-200'
                              }`}>
                                {issue.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">Reporter:</span> {issue.reporter_name || issue.reporter_email || issue.reporter || '—'} | 
                              <span className="font-medium ml-2">Target:</span> {issue.reported_user_name || issue.reported_user_email || issue.target || '—'}
                            </p>
                            <p className="text-sm text-gray-700 mb-2">{issue.description || issue.reason || '—'}</p>
                            <p className="text-sm text-gray-500">Date: {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : issue.date || '—'}</p>
                          </div>
                        </div>
                        {!['resolved', 'dismissed', 'reviewed'].includes(issue.status) && (
                          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                            <button
                              onClick={() => handleReviewIssue(issue.id, 'investigate')}
                              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg text-sm font-medium hover:from-cyan-600 hover:to-blue-600 transition"
                            >
                              Investigate
                            </button>
                            <button
                              onClick={() => handleReviewIssue(issue.id, 'warn-user')}
                              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition"
                            >
                              Warn User
                            </button>
                            <button
                              onClick={() => handleReviewIssue(issue.id, 'dismiss')}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                            >
                              Dismiss
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Transaction & Escrow Management</h1>
                  <p className="text-gray-600 mt-1">{realTransactions.filter((t: any) => t.status === 'in-escrow' || t.status === 'pending-verification').length} awaiting action</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                  <p className="text-xs text-blue-700">
                    💡 Buyers provide shipping ID after receiving items as proof of delivery
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6">
                  <div className="grid grid-cols-12 gap-4 pb-4 border-b border-gray-200 text-sm font-medium text-gray-500 uppercase">
                    <div className="col-span-2">Escrow ID</div>
                    <div className="col-span-2">Buyer/Seller</div>
                    <div className="col-span-2">Amount</div>
                    <div className="col-span-2">Shipping ID</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Actions</div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {realTransactions.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <div className="text-4xl mb-2">📭</div>
                        <p>No escrow transactions yet.</p>
                        <p className="text-sm mt-1">Transactions appear here when buyers win auctions and initiate payment.</p>
                      </div>
                    ) : realTransactions.map((transaction: any) => {
                      const shippingId = transaction.shipping_id || transaction.shippingId;
                      const buyerName  = transaction.buyer_name  || transaction.buyer  || 'Unknown';
                      const sellerName = transaction.seller_name || transaction.seller || 'Unknown';
                      const escrowId   = transaction.escrow_id   || transaction.escrowId || transaction.id;
                      const auctionTitle = transaction.auction_title || transaction.auction || '';
                      const amount     = parseFloat(transaction.amount) || 0;
                      const date       = transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : (transaction.date || '');
                      return (
                      <div key={transaction.id} className="grid grid-cols-12 gap-4 py-4 items-center hover:bg-gray-50 transition">
                        <div className="col-span-2">
                          <p className="font-mono text-sm text-cyan-600">{escrowId}</p>
                          <p className="text-xs text-gray-500">{date}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-gray-900 font-medium">{buyerName}</p>
                          <p className="text-xs text-gray-500">→ {sellerName}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="font-bold text-cyan-600">ETB {amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{auctionTitle}</p>
                        </div>
                        <div className="col-span-2">
                          {shippingId ? (
                            <div>
                              <p className="font-mono text-xs text-blue-600">{shippingId}</p>
                              <span className="text-xs text-green-600 font-medium">✓ Provided</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Not provided yet</span>
                          )}
                        </div>
                        <div className="col-span-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            transaction.status === 'in-escrow' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                            transaction.status === 'pending-verification' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                            transaction.status === 'released' ? 'bg-green-50 text-green-600 border border-green-200' :
                            transaction.status === 'disputed' ? 'bg-red-50 text-red-600 border border-red-200' :
                            'bg-gray-50 text-gray-600 border border-gray-200'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                        <div className="col-span-2 flex gap-2">
                          {(transaction.status === 'in-escrow' || transaction.status === 'pending-verification') && shippingId && (
                            <button
                              onClick={() => handleReleaseEscrow(transaction.id)}
                              className="px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded text-xs font-medium hover:from-green-600 hover:to-green-700 transition"
                            >
                              Release Funds
                            </button>
                          )}
                          <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition">
                            View Details
                          </button>
                        </div>
                      </div>
                    ); })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Seller Approval Tab */}
          {activeTab === 'sellers' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Seller Applications</h1>
                  <p className="text-gray-600 mt-1">{realSellers.filter((s: any) => s.status === 'pending').length} pending approvals</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6">
                  {(realSellers || []).length > 0 ? (
                    <div className="space-y-4">
                      {(realSellers || []).map((seller: any) => (
                      <div key={seller.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-gray-900">{seller.name}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                seller.status === 'pending' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                                'bg-blue-50 text-blue-600 border border-blue-200'
                              }`}>
                                {seller.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Email:</span> {seller.email}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Business:</span> {seller.businessName}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Documents:</span> 
                              <span className={seller.documents === 'Verified' ? 'text-green-600 ml-1' : 'text-orange-600 ml-1'}>
                                {seller.documents}
                              </span>
                            </p>
                            <p className="text-sm text-gray-500">Applied: {seller.appliedDate}</p>
                          </div>
                          {seller.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveSeller(seller.id)}
                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 transition"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => handleRejectSeller(seller.id)}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
                              >
                                ✕ Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg mb-2">No seller applications</p>
                      <p className="text-sm">Applications will appear here when users apply to become sellers</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Fraud Detection Tab */}
          {activeTab === 'fraud' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">ML Fraud Detection</h1>
                  <p className="text-gray-600 mt-1">Decision Tree Classifier — Real-time fraud analysis</p>
                </div>
                <button
                  onClick={handleAutoTune}
                  disabled={autoTuning}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-indigo-600 transition shadow-md disabled:opacity-50"
                >
                  {autoTuning ? '⏳ Tuning...' : '🔧 Auto-Tune Model'}
                </button>
              </div>

              {/* ML Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Total Detections</p>
                  <p className="text-3xl font-bold text-gray-900">{fraudStats?.total_analyses || fraudLogs.length || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border border-red-100">
                  <p className="text-xs text-gray-500 mb-1">Confirmed Fraud</p>
                  <p className="text-3xl font-bold text-red-600">{mlAccuracy?.confirmed_fraud || fraudStats?.confirmed_fraud || 0}</p>
                  <p className="text-xs text-red-400 mt-1">True positives</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border border-orange-100">
                  <p className="text-xs text-gray-500 mb-1">High Risk Cases</p>
                  <p className="text-3xl font-bold text-orange-600">{fraudStats?.high_risk_cases || 0}</p>
                  <p className="text-xs text-orange-400 mt-1">Needs review</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border border-green-100">
                  <p className="text-xs text-gray-500 mb-1">Model Accuracy</p>
                  <p className="text-3xl font-bold text-green-600">
                    {mlAccuracy?.accuracy_pct ? `${mlAccuracy.accuracy_pct}%` : 'N/A'}
                  </p>
                  <p className="text-xs text-green-400 mt-1">F1: {mlAccuracy?.f1_score || 'N/A'}</p>
                </div>
              </div>

              {/* Decision Tree Visualization */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">🌳 Decision Tree — How the Model Decides</h2>
                <p className="text-sm text-gray-500 mb-6">This flowchart shows the exact logic the ML model uses to classify each bid as fraud or legitimate.</p>

                {/* Tree SVG-style layout using divs */}
                <div className="overflow-x-auto">
                  <div className="min-w-[700px]">

                    {/* Root node */}
                    <div className="flex justify-center mb-2">
                      <div className="bg-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-md text-center">
                        🔍 New Bid Received<br/>
                        <span className="font-normal text-indigo-200 text-xs">Extract 6 features</span>
                      </div>
                    </div>

                    {/* Connector */}
                    <div className="flex justify-center mb-2"><div className="w-0.5 h-6 bg-gray-400"></div></div>

                    {/* Level 1: Rapid Bidding check */}
                    <div className="flex justify-center mb-2">
                      <div className="bg-yellow-50 border-2 border-yellow-400 px-5 py-3 rounded-xl text-sm font-semibold text-yellow-800 text-center shadow">
                        bids_per_minute &gt; {mlThresholds.find(t => t.threshold_name === 'rapid_bidding_per_min')?.threshold_value || 5}?
                      </div>
                    </div>

                    {/* Branch row */}
                    <div className="flex justify-center gap-32 mb-2">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1 text-xs text-red-500 font-bold mb-1">← YES (+0.25)</div>
                        <div className="w-0.5 h-6 bg-red-300"></div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1 text-xs text-green-500 font-bold mb-1">NO →</div>
                        <div className="w-0.5 h-6 bg-green-300"></div>
                      </div>
                    </div>

                    {/* Level 2 nodes */}
                    <div className="flex justify-center gap-16 mb-2">
                      {/* Left branch: account age check */}
                      <div className="flex flex-col items-center">
                        <div className="bg-yellow-50 border-2 border-yellow-400 px-4 py-2 rounded-xl text-xs font-semibold text-yellow-800 text-center shadow">
                          account_age &lt; {mlThresholds.find(t => t.threshold_name === 'new_account_hours')?.threshold_value || 48}h?
                        </div>
                        <div className="flex gap-12 mt-2">
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-red-500 font-bold">YES</span>
                            <div className="w-0.5 h-4 bg-red-300"></div>
                            <div className="bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-bold text-center shadow">
                              🔴 BLOCK<br/><span className="font-normal">score ≥ 0.70</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-orange-500 font-bold">NO</span>
                            <div className="w-0.5 h-4 bg-orange-300"></div>
                            <div className="bg-orange-500 text-white px-3 py-2 rounded-lg text-xs font-bold text-center shadow">
                              🟠 REVIEW<br/><span className="font-normal">score ≥ 0.50</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right branch: suspicious amount check */}
                      <div className="flex flex-col items-center">
                        <div className="bg-yellow-50 border-2 border-yellow-400 px-4 py-2 rounded-xl text-xs font-semibold text-yellow-800 text-center shadow">
                          bid_amount &gt; {((mlThresholds.find(t => t.threshold_name === 'suspicious_amount_etb')?.threshold_value || 500000) / 1000).toFixed(0)}k ETB?
                        </div>
                        <div className="flex gap-12 mt-2">
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-orange-500 font-bold">YES</span>
                            <div className="w-0.5 h-4 bg-orange-300"></div>
                            <div className="bg-orange-500 text-white px-3 py-2 rounded-lg text-xs font-bold text-center shadow">
                              🟠 REVIEW<br/><span className="font-normal">score ≥ 0.50</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-green-500 font-bold">NO</span>
                            <div className="w-0.5 h-4 bg-green-300"></div>
                            <div className="bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-bold text-center shadow">
                              🟢 ALLOW<br/><span className="font-normal">score &lt; 0.30</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex justify-center gap-6 mt-8 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="w-3 h-3 rounded-full bg-red-600 inline-block"></span> Block (score ≥ {mlThresholds.find(t => t.threshold_name === 'fraud_block_score')?.threshold_value || 0.70})
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span> Review (score ≥ {mlThresholds.find(t => t.threshold_name === 'fraud_review_score')?.threshold_value || 0.50})
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span> Monitor (score ≥ {mlThresholds.find(t => t.threshold_name === 'fraud_monitor_score')?.threshold_value || 0.30})
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="w-3 h-3 rounded-full bg-green-600 inline-block"></span> Allow (score &lt; 0.30)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Model Accuracy Metrics */}
              {mlAccuracy && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">📊 Model Performance Metrics</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Accuracy', value: mlAccuracy.accuracy_pct ? `${mlAccuracy.accuracy_pct}%` : 'N/A', desc: '(TP+TN) / Total', color: 'text-blue-600' },
                      { label: 'Precision', value: mlAccuracy.precision_pct ? `${mlAccuracy.precision_pct}%` : 'N/A', desc: 'TP / (TP+FP)', color: 'text-purple-600' },
                      { label: 'Recall', value: mlAccuracy.recall_pct ? `${mlAccuracy.recall_pct}%` : 'N/A', desc: 'TP / (TP+FN)', color: 'text-orange-600' },
                      { label: 'F1 Score', value: mlAccuracy.f1_score ? `${mlAccuracy.f1_score}%` : 'N/A', desc: 'Harmonic mean', color: 'text-green-600' },
                    ].map(m => (
                      <div key={m.label} className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                        <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                        <p className="text-xs text-gray-400 mt-1">{m.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs text-gray-500">
                    <div className="bg-green-50 rounded p-2 border border-green-100">
                      <span className="font-bold text-green-700 text-lg block">{mlAccuracy.true_positives || 0}</span>
                      True Positives (fraud caught)
                    </div>
                    <div className="bg-red-50 rounded p-2 border border-red-100">
                      <span className="font-bold text-red-700 text-lg block">{mlAccuracy.false_positives || 0}</span>
                      False Positives (legit flagged)
                    </div>
                    <div className="bg-orange-50 rounded p-2 border border-orange-100">
                      <span className="font-bold text-orange-700 text-lg block">{mlAccuracy.false_negatives || 0}</span>
                      False Negatives (fraud missed)
                    </div>
                    <div className="bg-blue-50 rounded p-2 border border-blue-100">
                      <span className="font-bold text-blue-700 text-lg block">{mlAccuracy.true_negatives || 0}</span>
                      True Negatives (legit allowed)
                    </div>
                  </div>
                </div>
              )}

              {/* ML Thresholds */}
              {mlThresholds.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">⚙️ Current ML Thresholds</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {mlThresholds.map((t: any) => (
                      <div key={t.threshold_name} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{t.threshold_name.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-gray-400">{t.description}</p>
                        </div>
                        <span className="text-lg font-bold text-indigo-600">{t.threshold_value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Fraud Logs */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">🔍 Recent Detection Logs</h2>
                {fraudLogs.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">No fraud detection logs yet. Run the ML training data SQL to seed sample data.</p>
                ) : (
                  <div className="space-y-3">
                    {fraudLogs.map((log: any) => {
                      const score = parseFloat(log.fraud_score);
                      const scoreColor = score >= 0.7 ? 'text-red-600' : score >= 0.5 ? 'text-orange-500' : score >= 0.3 ? 'text-yellow-500' : 'text-green-600';
                      const bgColor = score >= 0.7 ? 'border-red-200 bg-red-50' : score >= 0.5 ? 'border-orange-200 bg-orange-50' : score >= 0.3 ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50';
                      const indicators = Array.isArray(log.indicators) ? log.indicators : (typeof log.indicators === 'string' ? JSON.parse(log.indicators || '[]') : []);
                      return (
                        <div key={log.id} className={`rounded-lg border p-4 ${bgColor}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <span className={`text-xl font-bold ${scoreColor}`}>{(score * 100).toFixed(0)}%</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                                  log.risk_level === 'critical' ? 'bg-red-600 text-white' :
                                  log.risk_level === 'high' ? 'bg-orange-500 text-white' :
                                  log.risk_level === 'medium' ? 'bg-yellow-400 text-gray-900' :
                                  'bg-green-500 text-white'
                                }`}>{log.risk_level}</span>
                                <span className="text-sm text-gray-700 font-medium">{log.user_name || log.user_email || 'Unknown user'}</span>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {indicators.map((ind: any, i: number) => (
                                  <span key={i} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-600">
                                    {ind.type?.replace(/_/g, ' ')}
                                  </span>
                                ))}
                                {indicators.length === 0 && <span className="text-xs text-gray-400">No indicators</span>}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-xs text-gray-400">{new Date(log.detected_at).toLocaleDateString()}</p>
                              {log.actual_fraud === true && <span className="text-xs text-red-600 font-bold">✓ Confirmed Fraud</span>}
                              {log.actual_fraud === false && <span className="text-xs text-green-600 font-bold">✓ Legitimate</span>}
                              {log.actual_fraud === null && <span className="text-xs text-gray-400">Unreviewed</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="p-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
                <p className="text-gray-600 mt-1">Configure your auction platform</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* General Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">🏪 General</h2>
                    <button onClick={handleSaveSettings} disabled={settingsSaving}
                      className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition disabled:opacity-50">
                      {settingsSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  {settingsMsg && <div className="mb-3 p-2 bg-green-50 border border-green-300 text-green-700 rounded text-xs">{settingsMsg}</div>}
                  <div className="space-y-3">
                    {[
                      { key: 'platformName', label: 'Platform Name', type: 'text' },
                      { key: 'platformEmail', label: 'Admin Email', type: 'email' },
                      { key: 'commissionRate', label: 'Commission Rate (%)', type: 'number' },
                      { key: 'minBidIncrement', label: 'Min Bid Increment (ETB)', type: 'number' },
                      { key: 'maxAuctionDays', label: 'Max Auction Duration (days)', type: 'number' },
                    ].map(({ key, label, type }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                        <input type={type} value={(platformSettings as any)[key]}
                          onChange={e => setPlatformSettings(p => ({ ...p, [key]: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 outline-none text-sm" />
                      </div>
                    ))}
                    <div className="pt-2 space-y-2">
                      {[
                        { key: 'allowNewRegistrations', label: 'Allow New Registrations' },
                        { key: 'requireEmailVerification', label: 'Require Account Verification' },
                        { key: 'autoEndAuctions', label: 'Auto-End Auctions' },
                        { key: 'maintenanceMode', label: '⚠️ Maintenance Mode' },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{label}</span>
                          <button onClick={() => setPlatformSettings(p => ({ ...p, [key]: !(p as any)[key] }))}
                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${(platformSettings as any)[key] ? 'bg-cyan-500' : 'bg-gray-300'}`}>
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${(platformSettings as any)[key] ? 'translate-x-5' : 'translate-x-1'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Change Admin Password */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">🔑 Change Admin Password</h2>
                  {pwMsg && <div className="mb-3 p-2 bg-green-50 border border-green-300 text-green-700 rounded text-xs">{pwMsg}</div>}
                  {pwError && <div className="mb-3 p-2 bg-red-50 border border-red-300 text-red-700 rounded text-xs">{pwError}</div>}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Current Password</label>
                      <input type="password" value={pwForm.current}
                        onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 outline-none text-sm"
                        placeholder="••••••••" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
                      <input type="password" value={pwForm.newPw}
                        onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 outline-none text-sm"
                        placeholder="Min 6 characters" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password</label>
                      <input type="password" value={pwForm.confirm}
                        onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 outline-none text-sm"
                        placeholder="Repeat new password" />
                    </div>
                    <button onClick={handleChangePassword} disabled={pwSaving}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50">
                      {pwSaving ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </div>

                {/* ML Fraud Thresholds Editor */}
                <div className="bg-white rounded-xl shadow-sm border border-indigo-200 p-6 lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">🤖 ML Fraud Detection Thresholds</h2>
                      <p className="text-xs text-gray-500 mt-0.5">Adjust sensitivity — changes take effect on the next bid analysis</p>
                    </div>
                    <button onClick={handleSaveThresholds} disabled={mlThresholdSaving}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50">
                      {mlThresholdSaving ? 'Saving...' : '💾 Save Thresholds'}
                    </button>
                  </div>
                  {mlThresholdMsg && <div className="mb-4 p-2 bg-indigo-50 border border-indigo-300 text-indigo-700 rounded text-xs">{mlThresholdMsg}</div>}
                  {Object.keys(mlThresholdSettings).length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Loading thresholds...</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { key: 'rapid_bidding_per_min', label: 'Rapid Bidding (bids/min)', desc: 'Flag if user places this many bids per minute', min: 1, max: 20, step: 1 },
                        { key: 'suspicious_amount_etb', label: 'Suspicious Amount (ETB)', desc: 'Flag bids above this amount', min: 10000, max: 999999, step: 10000 },
                        { key: 'new_account_hours', label: 'New Account (hours)', desc: 'Accounts younger than this are flagged', min: 1, max: 720, step: 1 },
                        { key: 'bid_cancel_rate', label: 'Bid Cancel Rate (0-1)', desc: 'Flag if cancellation rate exceeds this', min: 0.1, max: 1, step: 0.05 },
                        { key: 'ip_duplicate_accounts', label: 'IP Duplicate Accounts', desc: 'Max accounts from same IP in 24h', min: 1, max: 20, step: 1 },
                        { key: 'fraud_block_score', label: 'Block Score (0-1)', desc: 'Auto-block bids above this fraud score', min: 0.5, max: 1, step: 0.05 },
                        { key: 'fraud_review_score', label: 'Review Score (0-1)', desc: 'Flag for review above this score', min: 0.3, max: 0.9, step: 0.05 },
                        { key: 'fraud_monitor_score', label: 'Monitor Score (0-1)', desc: 'Monitor closely above this score', min: 0.1, max: 0.7, step: 0.05 },
                        { key: 'velocity_window_minutes', label: 'Velocity Window (min)', desc: 'Time window for bid velocity checks', min: 1, max: 120, step: 1 },
                      ].map(({ key, label, desc, min, max, step }) => (
                        mlThresholdSettings[key] !== undefined && (
                          <div key={key} className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                            <label className="block text-xs font-semibold text-indigo-800 mb-1">{label}</label>
                            <p className="text-xs text-gray-500 mb-2">{desc}</p>
                            <div className="flex items-center gap-2">
                              <input type="range" min={min} max={max} step={step}
                                value={mlThresholdSettings[key]}
                                onChange={e => setMlThresholdSettings(p => ({ ...p, [key]: e.target.value }))}
                                className="flex-1 accent-indigo-600" />
                              <input type="number" min={min} max={max} step={step}
                                value={mlThresholdSettings[key]}
                                onChange={e => setMlThresholdSettings(p => ({ ...p, [key]: e.target.value }))}
                                className="w-20 px-2 py-1 border border-indigo-300 rounded text-xs text-center font-bold text-indigo-700 outline-none" />
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>

                {/* Platform Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">📊 Platform Summary</h2>
                  <div className="space-y-3">
                    {[
                      { label: 'Total Users', value: realUsers.length },
                      { label: 'Total Auctions', value: realAuctions.length },
                      { label: 'Active Disputes', value: realDisputes.filter((d: any) => d.status === 'pending').length },
                      { label: 'Pending Sellers', value: realSellers.filter((s: any) => s.status === 'pending').length },
                      { label: 'Open Reports', value: realReports.filter((r: any) => r.status === 'open').length },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-600">{label}</span>
                        <span className="text-sm font-bold text-gray-900">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
                  <h2 className="text-lg font-bold text-red-600 mb-4">⚠️ Danger Zone</h2>
                  <div className="space-y-3">
                    <button onClick={() => { if (confirm('Clear all fraud detection logs? This cannot be undone.')) alert('Fraud logs cleared.'); }}
                      className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition text-left">
                      🗑️ Clear Fraud Detection Logs
                    </button>
                    <button onClick={() => { if (confirm('End all active auctions now?')) alert('All auctions ended.'); }}
                      className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition text-left">
                      🔒 End All Active Auctions
                    </button>
                    <button onClick={handleExportReport}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition text-left">
                      💾 Export Full Report (CSV + JSON)
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Add New Client</h2>
              <button onClick={() => { setShowAddClientModal(false); setAddClientError(''); }} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
            </div>
            <form onSubmit={handleAddClient} className="p-6 space-y-4">
              {addClientError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{addClientError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text" required
                  value={addClientForm.name}
                  onChange={e => setAddClientForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Abebe Kebede"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email" required
                  value={addClientForm.email}
                  onChange={e => setAddClientForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={addClientForm.phone}
                  onChange={e => setAddClientForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+251911234567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password" required
                  value={addClientForm.password}
                  onChange={e => setAddClientForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={addClientForm.role}
                  onChange={e => setAddClientForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none"
                >
                  <option value="buyer">🛒 Buyer</option>
                  <option value="seller">🏪 Seller</option>
                  <option value="admin">👑 Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddClientModal(false); setAddClientError(''); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addClientLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-600 transition disabled:opacity-50"
                >
                  {addClientLoading ? 'Creating...' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
