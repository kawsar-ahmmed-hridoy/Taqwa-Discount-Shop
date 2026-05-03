import { useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Bell, X, CheckCircle, AlertTriangle, Info, Package } from 'lucide-react';
import { useLocaleStore } from '../store/localeStore';

interface Notification {
  id: number;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedEntity?: {
    type: 'PRODUCT' | 'SALE' | 'CUSTOMER' | 'SUPPLIER';
    id: number;
    name: string;
  };
}

const NotificationCenter = () => {
  const { language } = useLocaleStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getAll();
      const notificationList = response.data.data;
      setNotifications(notificationList);
      setUnreadCount(notificationList.filter((n: Notification) => !n.isRead).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'WARNING':
        return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'ERROR':
        return <AlertTriangle className="text-red-500" size={20} />;
      case 'INFO':
      default:
        return <Info className="text-blue-500" size={20} />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return 'bg-green-50 border-green-200';
      case 'WARNING':
        return 'bg-yellow-50 border-yellow-200';
      case 'ERROR':
        return 'bg-red-50 border-red-200';
      case 'INFO':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return date.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-2 rounded-lg hover:bg-gray-100 relative transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={() => setShowDropdown(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-80">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="spinner w-8 h-8 mx-auto mb-2"></div>
                <p className="text-sm">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={48} className="mx-auto mb-2 text-gray-300" />
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {getIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm font-medium ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
                        {notification.relatedEntity && (
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getBgColor(notification.type)}`}>
                            {notification.relatedEntity.type === 'PRODUCT' && <Package size={12} />}
                            <span className="font-medium">{notification.relatedEntity.name}</span>
                          </div>
                        )}
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-200">
            <button
              onClick={() => {
                // Navigate to full notifications page
                setShowDropdown(false);
              }}
              className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;