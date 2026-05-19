'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  booking: {
    id: string;
    vehicleId: string;
    cityName: string;
    startDate: string;
    totalAmountINR: number;
    vehicle: {
      make: string;
      model: string;
    };
  };
}

interface NotificationBellProps {
  userId: string;
  role: 'VENDOR' | 'ADMIN';
}

export default function NotificationBell({ userId, role }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;

    const fetchNotifications = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

        const response = await fetch(`/api/notifications?userId=${userId}&limit=10`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
          retryCount = 0; // Reset retry count on success
        } else if (response.status === 400 || response.status === 401) {
          // Client error - don't retry
          console.warn(`Notification API returned ${response.status}`);
          setIsLoading(false);
        } else if (response.status >= 500 && retryCount < maxRetries) {
          // Server error - retry
          retryCount++;
          console.warn(`Notification API error (${response.status}), retry ${retryCount}/${maxRetries}`);
          setTimeout(fetchNotifications, 2000 * retryCount);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('Notification fetch timeout');
        } else {
          console.warn('Failed to fetch notifications:', error);
        }
        // Don't spam logs, just continue
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchNotifications();

      // Poll for new notifications every 10 seconds (only if we have userId)
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Update local state
        setNotifications(
          notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(Math.max(0, unreadCount - 1));
      } else {
        console.warn(`Failed to mark notification as read: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Mark as read request timeout');
      } else {
        console.warn('Failed to mark notification as read:', error);
      }
      // Continue silently - don't block UI
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking':
        return 'bg-blue-50 border-blue-200';
      case 'payment':
        return 'bg-green-50 border-green-200';
      case 'return':
        return 'bg-yellow-50 border-yellow-200';
      case 'damage':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return '📅';
      case 'payment':
        return '💰';
      case 'return':
        return '🔄';
      case 'damage':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
        aria-label="Notifications"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1 -translate-y-1 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 border-b">
            <h3 className="text-lg font-semibold">
              {role === 'VENDOR' ? 'Booking Notifications' : 'Admin Notifications'}
            </h3>
            {unreadCount > 0 && (
              <p className="text-sm text-blue-100 mt-1">{unreadCount} unread</p>
            )}
          </div>

          {/* Notifications List */}
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 ${getNotificationColor(
                    notification.type
                  )} cursor-pointer hover:opacity-80 transition ${
                    !notification.isRead ? 'bg-opacity-100 font-semibold' : 'opacity-75'
                  }`}
                  onClick={() => !notification.isRead && markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <h4 className="font-semibold text-gray-900">
                          {notification.title}
                        </h4>
                      </div>

                      {/* Vehicle Info */}
                      {notification.booking && (
                        <div className="mt-2 text-sm text-gray-700">
                          <p className="font-medium">
                            {notification.booking.vehicle.make}{' '}
                            {notification.booking.vehicle.model}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            📍 {notification.booking.cityName} | ₹
                            {notification.booking.totalAmountINR?.toLocaleString('en-IN')}
                          </p>
                        </div>
                      )}

                      {/* Timestamp */}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.createdAt).toLocaleDateString(
                          'en-IN',
                          {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </p>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.isRead && (
                      <div className="ml-2 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                    )}
                  </div>

                  {/* Action Link */}
                  {notification.booking && (
                    <Link
                      href={
                        role === 'VENDOR'
                          ? `/dashboard/vendor?bookingId=${notification.booking.id}`
                          : `/dashboard/admin?bookingId=${notification.booking.id}`
                      }
                      className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800 font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Booking →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t p-3 bg-gray-50 text-center">
              <Link
                href={
                  role === 'VENDOR'
                    ? '/dashboard/vendor?tab=notifications'
                    : '/dashboard/admin?tab=notifications'
                }
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Notifications
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
