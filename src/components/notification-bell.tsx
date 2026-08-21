'use client';

import { useEffect, useState, useRef } from 'react';
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
  role: 'VENDOR' | 'ADMIN' | 'CUSTOMER';
}

// Heavy digital alarm (Detuned sawtooth/square wave)
function playHeavyAlarm(ctx: AudioContext, time: number, duration: number) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'sawtooth';
  osc2.type = 'square';

  osc1.frequency.setValueAtTime(440, time);
  osc2.frequency.setValueAtTime(446, time); // Detuned for chorus effect

  // Rapid pitch sweep
  osc1.frequency.linearRampToValueAtTime(880, time + duration * 0.5);
  osc1.frequency.linearRampToValueAtTime(440, time + duration);
  
  osc2.frequency.linearRampToValueAtTime(886, time + duration * 0.5);
  osc2.frequency.linearRampToValueAtTime(446, time + duration);

  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.4, time + 0.05);
  gain.gain.linearRampToValueAtTime(0.4, time + duration - 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(time);
  osc2.start(time);

  osc1.stop(time + duration);
  osc2.stop(time + duration);
}

export default function NotificationBell({ userId, role }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const isFirstFetch = useRef(true);

  // Play active notification sound (Heavy Alert)
  const playActiveSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Play heavy pager alarm 5 times
      for (let i = 0; i < 5; i++) {
        playHeavyAlarm(ctx, ctx.currentTime + i * 0.7, 0.45);
      }
    } catch (e) {
      console.warn('Web Audio API error:', e);
    }
  };

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;

    const fetchNotifications = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`/api/notifications?userId=${userId}&limit=10`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const newNotifications: Notification[] = data.notifications || [];
          
          setNotifications((prev) => {
            if (!isFirstFetch.current && newNotifications.length > 0) {
              const latestNotif = newNotifications[0];
              // If the latest notification is unread and was not in our previous list, play the chime
              if (!latestNotif.isRead) {
                const isNew = !prev.some((n) => n.id === latestNotif.id);
                if (isNew) {
                  playActiveSound();
                }
              }
            }
            isFirstFetch.current = false;
            return newNotifications;
          });

          setUnreadCount(data.unreadCount || 0);
          retryCount = 0;
        } else if (response.status === 400 || response.status === 401) {
          setIsLoading(false);
        } else if (response.status >= 500 && retryCount < maxRetries) {
          retryCount++;
          setTimeout(fetchNotifications, 2000 * retryCount);
        }
      } catch (error) {
        // Silent error
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
      });

      if (response.ok) {
        setNotifications(
          notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.warn('Failed to mark notification as read:', error);
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking':
        return 'border-blue-500 bg-blue-950/20 hover:bg-blue-950/40';
      case 'payment':
        return 'border-green-500 bg-green-950/20 hover:bg-green-950/40';
      case 'return':
        return 'border-amber-500 bg-amber-950/20 hover:bg-amber-950/40';
      case 'damage':
        return 'border-red-500 bg-red-950/20 hover:bg-red-950/40';
      default:
        return 'border-white/10 bg-white/5 hover:bg-white/10';
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
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white/75 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
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
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1 -translate-y-1 bg-red-500 rounded-full animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[var(--brand-ink)] rounded-2xl shadow-2xl border border-white/10 z-50 max-h-[500px] overflow-y-auto text-white">
          {/* Header */}
          <div className="sticky top-0 bg-[var(--brand-ink)] text-white p-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold tracking-wider uppercase text-white/95">
                {role === 'VENDOR' ? 'Operations Alerts' : role === 'CUSTOMER' ? 'Customer Alerts' : 'Admin Terminal'}
              </h3>
              {unreadCount > 0 && (
                <p className="text-[11px] text-emerald-400 font-bold mt-0.5">{unreadCount} new alerts</p>
              )}
            </div>
            <button 
              onClick={playActiveSound}
              className="px-2.5 py-1 text-[10px] font-bold bg-white/10 hover:bg-white/20 rounded-full border border-white/20 transition cursor-pointer flex items-center gap-1"
              title="Test notification ringtone"
            >
              <span>🔊</span> Test Alarm
            </button>
          </div>

          {/* Notifications List */}
          {isLoading ? (
            <div className="p-8 text-center text-xs text-white/50">Loading alerts...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-white/50">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-white/20"
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
            <div className="divide-y divide-white/5">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 ${getNotificationColor(
                    notification.type
                  )} cursor-pointer hover:bg-white/5 transition ${
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
                        <h4 className="font-semibold text-white">
                          {notification.title}
                        </h4>
                      </div>

                      {/* Vehicle Info */}
                      {notification.booking && (
                        <div className="mt-2 text-sm text-white/90">
                          <p className="font-medium">
                            {notification.booking.vehicle.make}{' '}
                            {notification.booking.vehicle.model}
                          </p>
                          <p className="text-xs text-white/50 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-white/50 mt-1">
                            📍 {notification.booking.cityName} | ₹
                            {notification.booking.totalAmountINR?.toLocaleString('en-IN')}
                          </p>
                        </div>
                      )}

                      {/* Timestamp */}
                      <p className="text-xs text-white/50 mt-2">
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
                          : role === 'CUSTOMER'
                          ? `/dashboard/customer?bookingId=${notification.booking.id}`
                          : `/dashboard/admin?section=bookings&search=${notification.booking.id}`
                      }
                      className="mt-2 inline-block text-sm text-[var(--brand-red)] hover:text-red-400 font-medium"
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
            <div className="border-t border-white/10 p-3 bg-white/[0.02] text-center">
              <Link
                href={
                  role === 'VENDOR'
                    ? '/dashboard/vendor?tab=notifications'
                    : role === 'CUSTOMER'
                    ? '/dashboard/customer?tab=notifications'
                    : '/dashboard/admin?tab=notifications'
                }
                className="text-sm text-[var(--brand-red)] hover:text-red-400 font-medium"
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
