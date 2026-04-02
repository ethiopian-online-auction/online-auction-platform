'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'bid' | 'win' | 'outbid' | 'message' | 'payment' | 'auction' | 'system';
  title: string;
  message: string;
  time: string;
  date: string;
  read: boolean;
  link?: string;
}

export default function NotificationsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const api = (await import('@/lib/api')).default;
        const response = await api.getNotifications();
        
        if (response.success && response.data) {
          const notifs = Array.isArray(response.data) ? response.data : ((response.data as any).notifications || []);
          
          // Transform to match the Notification interface
          const transformed = notifs.map((n: any) => ({
            id: n.id,
            type: n.type || 'system',
            title: n.title,
            message: n.message,
            time: getTimeAgo(new Date(n.created_at)),
            date: new Date(n.created_at).toISOString().split('T')[0],
            read: n.is_read || false,
            link: n.link || '#'
          }));
          
          setNotifications(transformed);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return `${Math.floor(seconds / 604800)} weeks ago`;
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      const api = (await import('@/lib/api')).default;
      await api.markNotificationAsRead(id);
      
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const api = (await import('@/lib/api')).default;
      await api.markAllNotificationsAsRead();
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      // Note: You'll need to add a delete endpoint in the backend
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'bid': return '🔨';
      case 'win': return '🏆';
      case 'outbid': return '⚠️';
      case 'message': return '💬';
      case 'payment': return '💳';
      case 'auction': return '📢';
      case 'system': return 'ℹ️';
      default: return '🔔';
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'win': return 'bg-green-100 text-green-700';
      case 'outbid': return 'bg-red-100 text-red-700';
      case 'message': return 'bg-blue-100 text-blue-700';
      case 'payment': return 'bg-purple-100 text-purple-700';
      case 'auction': return 'bg-orange-100 text-orange-700';
      case 'bid': return 'bg-yellow-100 text-yellow-700';
      case 'system': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'unread'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">🔔</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">
                {filter === 'unread' ? "You're all caught up!" : "You don't have any notifications yet."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-xl shadow-sm overflow-hidden transition hover:shadow-md ${
                  !notification.read ? 'border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ${getTypeColor(notification.type)}`}>
                      {getIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-1">{notification.title}</h3>
                          <p className="text-gray-600 text-sm">{notification.message}</p>
                        </div>
                        {!notification.read && (
                          <span className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0 mt-1"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-3">{notification.time}</p>

                      {/* Actions */}
                      <div className="flex gap-3">
                        {notification.link && (
                          <Link
                            href={notification.link}
                            onClick={() => markAsRead(notification.id)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View Details →
                          </Link>
                        )}
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
