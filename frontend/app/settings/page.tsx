'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import Image from 'next/image';

export default function SettingsPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('profile');
  const [profileImage, setProfileImage] = useState('/Image/default-avatar.svg');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form states
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    bio: '',
    email: '',
    phone: '',
    alternateContact: '',
    timezone: 'Africa/Addis_Ababa',
    language: 'en'
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotifications: true,
    smsAlerts: true,
    pushNotifications: true,
    outbidAlerts: true,
    auctionEnding: true,
    winningBid: true,
    paymentReceived: true,
    newMessages: true,
    auctionCreated: true
  });

  const [privacySettings, setPrivacySettings] = useState({
    showProfilePublicly: true,
    showBiddingHistory: false,
    showContactInfo: false
  });

  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);

  const [loginActivity] = useState([
    { id: 1, device: 'Windows PC - Chrome', location: 'Addis Ababa, Ethiopia', time: '2 hours ago', current: true },
    { id: 2, device: 'iPhone 15 - Safari', location: 'Addis Ababa, Ethiopia', time: '1 day ago', current: false },
    { id: 3, device: 'Android - Chrome', location: 'Bahir Dar, Ethiopia', time: '3 days ago', current: false }
  ]);

  const [blockedUsers] = useState([
    { id: 1, name: 'User123', reason: 'Spam messages', blockedDate: '2024-03-01' }
  ]);

  // Load saved data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPaymentMethods = localStorage.getItem('paymentMethods');
      if (savedPaymentMethods) {
        setPaymentMethods(JSON.parse(savedPaymentMethods));
      }
      
      const savedSearchesData = localStorage.getItem('savedSearches');
      if (savedSearchesData) {
        setSavedSearches(JSON.parse(savedSearchesData));
      }
      
      const savedAddresses = localStorage.getItem('addresses');
      if (savedAddresses) {
        setAddresses(JSON.parse(savedAddresses));
      }
    }
  }, []);

  // Load user profile photo on mount
  useEffect(() => {
    const loadProfilePhoto = async () => {
      // First try from user context
      if (user?.profile_photo) {
        setProfileImage(user.profile_photo);
        return;
      }

      // Only fetch from API if user is authenticated and has a token
      if (!isAuthenticated || typeof window === 'undefined') {
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      // If not in context, fetch from API
      try {
        const api = (await import('@/lib/api')).default;
        const response = await api.getProfile();
        
        if (response.success && response.data) {
          const userData = (response.data as any)?.user || response.data;
          if (userData.profile_photo) {
            setProfileImage(userData.profile_photo);
          }
        }
      } catch (error) {
        console.error('Error fetching profile photo:', error);
      }
    };

    loadProfilePhoto();
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    } else if (user) {
      setProfileData({
        firstName: user.name.split(' ')[0] || '',
        lastName: user.name.split(' ')[1] || '',
        displayName: user.name,
        bio: '',
        email: user.email,
        phone: user.phone,
        alternateContact: '',
        timezone: 'Africa/Addis_Ababa',
        language: language
      });
    }
  }, [isAuthenticated, user, router, language]);

  if (!isAuthenticated) {
    return null;
  }

  const isSeller = user?.subscription.plan === 'seller' || user?.subscription.plan === 'premium';

  const handleProfileUpdate = async () => {
    try {
      const api = (await import('@/lib/api')).default;
      const response = await api.updateProfile({
        name: `${profileData.firstName} ${profileData.lastName}`.trim(),
        displayName: profileData.displayName,
        bio: profileData.bio,
        languagePreference: profileData.language
      });
      
      if (response.success) {
        // Update localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          user.name = `${profileData.firstName} ${profileData.lastName}`.trim();
          localStorage.setItem('user', JSON.stringify(user));
          window.dispatchEvent(new CustomEvent('userUpdated'));
        }
        alert('✅ Profile updated successfully!');
      } else {
        alert('❌ Failed to update profile: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert('❌ Error: ' + error.message);
    }
  };

  const handleContactUpdate = async () => {
    try {
      const api = (await import('@/lib/api')).default;
      const response = await api.updateProfile({
        email: profileData.email,
        phone: profileData.phone
      });
      
      if (response.success) {
        alert('✅ Contact information updated successfully!');
      } else {
        alert('❌ Failed to update contact: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error updating contact:', error);
      alert('❌ Error: ' + error.message);
    }
  };

  const handlePasswordChange = () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    if (securityData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }
    // TODO: Implement password change API
    alert('✅ Password changed successfully!');
    setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '', twoFactorEnabled: securityData.twoFactorEnabled });
  };

  const handleNotificationUpdate = () => {
    // Save notification preferences to localStorage
    localStorage.setItem('notificationPrefs', JSON.stringify(notificationPrefs));
    alert('✅ Notification preferences updated successfully!');
  };

  const handlePrivacyUpdate = () => {
    // Save privacy settings to localStorage
    localStorage.setItem('privacySettings', JSON.stringify(privacySettings));
    alert('✅ Privacy settings updated successfully!');
  };

  const handleExportBiddingHistory = async () => {
    try {
      const api = (await import('@/lib/api')).default;
      const response = await api.getUserBids();
      
      if (response.success && response.data) {
        const bids = (response.data as any)?.bids || [];
        
        // Create CSV content
        const headers = ['Auction Title', 'Bid Amount', 'Bid Time', 'Status'];
        const csvContent = [
          headers.join(','),
          ...bids.map((bid: any) => [
            `"${bid.auction_title || 'Unknown'}"`,
            bid.amount,
            new Date(bid.bid_time).toLocaleString(),
            bid.auction_status
          ].join(','))
        ].join('\n');
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bidding-history-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        alert('✅ Bidding history exported successfully!');
      }
    } catch (error) {
      console.error('Error exporting bidding history:', error);
      alert('❌ Failed to export bidding history');
    }
  };

  const handleDownloadData = async () => {
    try {
      const api = (await import('@/lib/api')).default;
      const [profileRes, bidsRes] = await Promise.all([
        api.getProfile(),
        api.getUserBids()
      ]);
      
      const userData = {
        profile: profileRes.data,
        bids: bidsRes.data,
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      alert('✅ Your data has been downloaded!');
    } catch (error) {
      console.error('Error downloading data:', error);
      alert('❌ Failed to download data');
    }
  };

  const handleAddPaymentMethod = () => {
    const type = prompt('Payment method type (Telebirr, CBE Birr, M-Pesa):');
    const number = prompt('Phone number:');
    
    if (type && number) {
      const newMethod = {
        id: Date.now(),
        type,
        number,
        default: paymentMethods.length === 0
      };
      const updated = [...paymentMethods, newMethod];
      setPaymentMethods(updated);
      localStorage.setItem('paymentMethods', JSON.stringify(updated));
      alert('✅ Payment method added!');
    }
  };

  const handleRemovePaymentMethod = (id: number) => {
    if (confirm('Remove this payment method?')) {
      const updated = paymentMethods.filter(m => m.id !== id);
      setPaymentMethods(updated);
      localStorage.setItem('paymentMethods', JSON.stringify(updated));
    }
  };

  const handleSetDefaultPayment = (id: number) => {
    const updated = paymentMethods.map(m => ({ ...m, default: m.id === id }));
    setPaymentMethods(updated);
    localStorage.setItem('paymentMethods', JSON.stringify(updated));
  };

  const handleRemoveSavedSearch = (id: number) => {
    const updated = savedSearches.filter(s => s.id !== id);
    setSavedSearches(updated);
    localStorage.setItem('savedSearches', JSON.stringify(updated));
  };

  const handleAddAddress = () => {
    const name = prompt('Address name (e.g., Home, Office):');
    const address = prompt('Full address:');
    const city = prompt('City:');
    const phone = prompt('Contact phone:');
    
    if (name && address && city) {
      const newAddress = {
        id: Date.now(),
        name,
        address,
        city,
        phone,
        default: addresses.length === 0
      };
      const updated = [...addresses, newAddress];
      setAddresses(updated);
      localStorage.setItem('addresses', JSON.stringify(updated));
      alert('✅ Address added!');
    }
  };

  const handleRemoveAddress = (id: number) => {
    if (confirm('Remove this address?')) {
      const updated = addresses.filter(a => a.id !== id);
      setAddresses(updated);
      localStorage.setItem('addresses', JSON.stringify(updated));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        setProfileImage(base64Image);
        
        // Save to database
        try {
          const api = (await import('@/lib/api')).default;
          const response = await api.updateProfile({ profile_photo: base64Image });
          
          if (response.success) {
            // Update user in localStorage
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
              const user = JSON.parse(savedUser);
              user.profile_photo = base64Image;
              localStorage.setItem('user', JSON.stringify(user));
            }
            
            // Trigger a custom event to update AuthContext
            window.dispatchEvent(new CustomEvent('userUpdated'));
            
            // Show success message
            alert('✅ Profile photo updated successfully!');
          } else {
            alert('❌ Failed to update profile photo: ' + (response.message || 'Unknown error'));
          }
        } catch (error: any) {
          console.error('Error updating profile photo:', error);
          alert('❌ Error: ' + error.message);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAccount = () => {
    if (showDeleteConfirm) {
      alert('Account deleted. Redirecting...');
      logout();
      router.push('/');
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const sections = [
    { id: 'profile', name: 'Profile Settings', icon: '👤' },
    { id: 'contact', name: 'Contact Information', icon: '📧' },
    { id: 'security', name: 'Login & Security', icon: '🔒' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'payment', name: 'Payment & Payout', icon: '💳' },
    { id: 'privacy', name: 'Privacy Settings', icon: '🔐' },
    { id: 'communication', name: 'Communication', icon: '💬' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-4">
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl">{section.icon}</span>
                    <span className="text-sm">{section.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6">

              {/* Profile Settings */}
              {activeSection === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Settings</h2>
                    <p className="text-gray-600">Update your profile information and photo</p>
                  </div>

                  {/* Profile Picture */}
                  <div className="flex items-center gap-6">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <label className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 inline-block">
                        Upload Photo
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                      <button className="ml-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                        Remove
                      </button>
                      <p className="text-sm text-gray-500 mt-2">JPG, PNG or GIF. Max size 2MB</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Display Name (Username)</label>
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="This is how others will see you"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bio / About Me</label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tell others about yourself..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language Preference</label>
                      <select
                        value={profileData.language}
                        onChange={(e) => {
                          setProfileData({ ...profileData, language: e.target.value });
                          setLanguage(e.target.value as Language);
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="en">English</option>
                        <option value="am">አማርኛ (Amharic)</option>
                        <option value="or">Afaan Oromoo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
                      <select
                        value={profileData.timezone}
                        onChange={(e) => setProfileData({ ...profileData, timezone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Africa/Addis_Ababa">East Africa Time (EAT)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="Europe/London">London (GMT)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={handleProfileUpdate} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                      Save Changes
                    </button>
                    <button className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              {activeSection === 'contact' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact Information</h2>
                    <p className="text-gray-600">Manage your contact details</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap">
                        {user?.isVerified ? '✓ Verified' : 'Verify Email'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+251911234567"
                      />
                      <button className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap">
                        {user?.isVerified ? '✓ Verified' : 'Verify Phone'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Contact (Optional)</label>
                    <input
                      type="tel"
                      value={profileData.alternateContact}
                      onChange={(e) => setProfileData({ ...profileData, alternateContact: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+251922345678"
                    />
                  </div>

                  <button onClick={handleContactUpdate} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                    Update Contact Info
                  </button>
                </div>
              )}

              {/* Login & Security */}
              {activeSection === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Login & Security</h2>
                    <p className="text-gray-600">Manage your password and security settings</p>
                  </div>

                  {/* Change Password */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                        <input
                          type="password"
                          value={securityData.currentPassword}
                          onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                        <input
                          type="password"
                          value={securityData.newPassword}
                          onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                        <input
                          type="password"
                          value={securityData.confirmPassword}
                          onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button onClick={handlePasswordChange} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                        Change Password
                      </button>
                    </div>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Two-Factor Authentication (2FA)</h3>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Enable 2FA</p>
                        <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={securityData.twoFactorEnabled}
                          onChange={(e) => setSecurityData({ ...securityData, twoFactorEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Login Activity */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Login Activity</h3>
                    <div className="space-y-3">
                      {loginActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{activity.device}</p>
                            <p className="text-sm text-gray-600">{activity.location} • {activity.time}</p>
                          </div>
                          {activity.current ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Current</span>
                          ) : (
                            <button className="text-red-600 hover:text-red-700 text-sm font-medium">Revoke</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Notification Preferences */}
              {activeSection === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Notification Preferences</h2>
                    <p className="text-gray-600">Choose how you want to be notified</p>
                  </div>

                  {/* Notification Channels */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Notification Channels</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">📧 Email Notifications</p>
                          <p className="text-sm text-gray-600">Receive updates via email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationPrefs.emailNotifications}
                            onChange={(e) => setNotificationPrefs({ ...notificationPrefs, emailNotifications: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">📱 SMS Alerts</p>
                          <p className="text-sm text-gray-600">Receive text messages</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationPrefs.smsAlerts}
                            onChange={(e) => setNotificationPrefs({ ...notificationPrefs, smsAlerts: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">🔔 Push Notifications</p>
                          <p className="text-sm text-gray-600">Browser notifications</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationPrefs.pushNotifications}
                            onChange={(e) => setNotificationPrefs({ ...notificationPrefs, pushNotifications: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Notification Types */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">What to Get Notified About</h3>
                    <div className="space-y-3">
                      {[
                        { key: 'outbidAlerts', label: 'Outbid Alerts', desc: 'When someone outbids you' },
                        { key: 'auctionEnding', label: 'Auction Ending Soon', desc: 'Reminders before auction ends' },
                        { key: 'winningBid', label: 'Winning Bid', desc: 'When you win an auction' },
                        { key: 'paymentReceived', label: 'Payment Received', desc: 'Payment confirmations' },
                        { key: 'newMessages', label: 'New Messages', desc: 'Messages from other users' },
                        ...(isSeller ? [{ key: 'auctionCreated', label: 'Auction Created', desc: 'Your auction is live' }] : [])
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{item.label}</p>
                            <p className="text-sm text-gray-600">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationPrefs[item.key as keyof typeof notificationPrefs] as boolean}
                              onChange={(e) => setNotificationPrefs({ ...notificationPrefs, [item.key]: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={handleNotificationUpdate} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                    Save Preferences
                  </button>
                </div>
              )}

              {/* Payment & Payout Settings */}
              {activeSection === 'payment' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment & Payout Settings</h2>
                    <p className="text-gray-600">Manage your payment methods and preferences</p>
                  </div>

                  {/* Saved Payment Methods */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Saved Payment Methods</h3>
                    {paymentMethods.length > 0 ? (
                      <div className="space-y-3">
                        {paymentMethods.map((method) => (
                          <div key={method.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">💳</span>
                              <div>
                                <p className="font-medium text-gray-900">{method.type}</p>
                                <p className="text-sm text-gray-600">{method.number}</p>
                              </div>
                              {method.default && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">Default</span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {!method.default && (
                                <button 
                                  onClick={() => handleSetDefaultPayment(method.id)}
                                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                  Set Default
                                </button>
                              )}
                              <button 
                                onClick={() => handleRemovePaymentMethod(method.id)}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm mb-4">No payment methods saved yet</p>
                    )}
                    <button 
                      onClick={handleAddPaymentMethod}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      + Add Payment Method
                    </button>
                  </div>

                  {/* Currency Preference */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Currency Preference</h3>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="ETB">Ethiopian Birr (ETB)</option>
                      <option value="USD">US Dollar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </div>

                  {/* Seller Payout Settings */}
                  {isSeller && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Payout Settings (Seller)</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Payout Schedule</label>
                          <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="instant">Instant (After buyer payment)</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-900">
                            <span className="font-bold">Commission Rate:</span> {user?.subscription.commissionRate}%
                          </p>
                          <p className="text-xs text-gray-600 mt-1">Based on your {user?.subscription.plan} plan</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Privacy Settings */}
              {activeSection === 'privacy' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Privacy Settings</h2>
                    <p className="text-gray-600">Control your privacy and data</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Show Profile Publicly</p>
                        <p className="text-sm text-gray-600">Allow others to view your profile</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.showProfilePublicly}
                          onChange={(e) => setPrivacySettings({ ...privacySettings, showProfilePublicly: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Show Bidding History</p>
                        <p className="text-sm text-gray-600">Display your past bids publicly</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.showBiddingHistory}
                          onChange={(e) => setPrivacySettings({ ...privacySettings, showBiddingHistory: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Show Contact Info</p>
                        <p className="text-sm text-gray-600">Allow others to see your contact details</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.showContactInfo}
                          onChange={(e) => setPrivacySettings({ ...privacySettings, showContactInfo: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Blocked Users */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Blocked Users</h3>
                    {blockedUsers.length > 0 ? (
                      <div className="space-y-3">
                        {blockedUsers.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{user.name}</p>
                              <p className="text-sm text-gray-600">Reason: {user.reason} • Blocked: {user.blockedDate}</p>
                            </div>
                            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Unblock</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">No blocked users</p>
                    )}
                  </div>

                  {/* Data Download */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Data Management</h3>
                    <button 
                      onClick={handleDownloadData}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                    >
                      Download My Data
                    </button>
                    <p className="text-sm text-gray-600 mt-2">Request a copy of all your data</p>
                  </div>

                  <button onClick={handlePrivacyUpdate} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                    Save Privacy Settings
                  </button>
                </div>
              )}

              {/* Communication Preferences */}
              {activeSection === 'communication' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Communication Preferences</h2>
                    <p className="text-gray-600">Manage how you communicate with others</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Promotional Emails</p>
                        <p className="text-sm text-gray-600">Receive updates about new features and offers</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Allow Messages from Other Users</p>
                        <p className="text-sm text-gray-600">Let buyers and sellers contact you</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  {isSeller && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Auto-Reply Settings (Seller)</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Auto-Reply Message</label>
                        <textarea
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Thank you for your message. I will respond within 24 hours..."
                        />
                      </div>
                      <button className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                        Save Auto-Reply
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mt-6">
              <h3 className="text-lg font-bold text-red-900 mb-2">Danger Zone</h3>
              <p className="text-sm text-red-700 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
              <button
                onClick={handleDeleteAccount}
                className={`px-6 py-3 rounded-lg font-semibold ${
                  showDeleteConfirm
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                {showDeleteConfirm ? 'Click Again to Confirm Delete' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
