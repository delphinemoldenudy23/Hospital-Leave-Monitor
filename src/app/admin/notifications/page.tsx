'use client';

import { useState } from 'react';
import axios from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  Bell, Mail, Clock, CheckCircle, AlertTriangle, Calendar,
  Settings, Check, Filter, Trash2, MoreVertical, BellRing
} from 'lucide-react';

export default function NotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'leave' | 'system'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'leave_request',
      title: 'New Leave Request',
      message: 'John Smith has requested sick leave from Dec 15-20, 2024',
      timestamp: '2 hours ago',
      unread: true,
      category: 'leave',
    },
    {
      id: 2,
      type: 'reminder',
      title: 'Return Reminder',
      message: 'Sarah Johnson is due to return from leave tomorrow',
      timestamp: '4 hours ago',
      unread: true,
      category: 'leave',
    },
    {
      id: 3,
      type: 'overdue',
      title: 'Overdue Alert',
      message: 'Mike Brown has not returned from leave as scheduled',
      timestamp: '1 day ago',
      unread: true,
      category: 'leave',
    },
    {
      id: 4,
      type: 'approval',
      title: 'Leave Approved',
      message: 'Emily Davis\'s vacation leave has been approved',
      timestamp: '2 days ago',
      unread: false,
      category: 'leave',
    },
    {
      id: 5,
      type: 'system',
      title: 'System Update',
      message: 'Leave management system has been updated to v2.0',
      timestamp: '3 days ago',
      unread: false,
      category: 'system',
    },
    {
      id: 6,
      type: 'reminder',
      title: 'Weekly Report',
      message: 'Weekly leave statistics report is now available',
      timestamp: '5 days ago',
      unread: false,
      category: 'system',
    },
  ]);

  const sendReminders = async () => {
    setLoading(true);
    try {
      await axios.post('/notifications/send-reminders');
      toast.success('Leave reminders sent successfully');
    } catch (error) {
      toast.error('Failed to send reminders');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, unread: false } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
    toast.success('All notifications marked as read');
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
    toast.success('Notification deleted');
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return n.unread;
    if (filter === 'leave') return n.category === 'leave';
    if (filter === 'system') return n.category === 'system';
    return true;
  });

  const unreadCount = notifications.filter(n => n.unread).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'leave_request':
        return Calendar;
      case 'reminder':
        return Clock;
      case 'overdue':
        return AlertTriangle;
      case 'approval':
        return CheckCircle;
      case 'system':
        return Settings;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'leave_request':
        return 'bg-blue-100 text-blue-600';
      case 'reminder':
        return 'bg-amber-100 text-amber-600';
      case 'overdue':
        return 'bg-red-100 text-red-600';
      case 'approval':
        return 'bg-emerald-100 text-emerald-600';
      case 'system':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-slate-600 mt-1">Manage notifications and system alerts</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
              <Check className="w-4 h-4" />
              <span className="text-sm">Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Reminders */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Send Leave Reminders</h2>
              <p className="text-sm text-slate-600">Automated email reminders</p>
            </div>
          </div>
          <p className="text-slate-600 mb-4 text-sm">
            Send email reminders to employees whose leave is ending in 7 days, 3 days, or today.
          </p>
          <button
            onClick={sendReminders}
            disabled={loading}
            className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <BellRing className="w-4 h-4" />
            {loading ? 'Sending...' : 'Send Reminders'}
          </button>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Notification Settings</h2>
              <p className="text-sm text-slate-600">Configure reminder timing</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: '7 Days Before Return', desc: 'Send reminder 7 days before expected return' },
              { label: '3 Days Before Return', desc: 'Send reminder 3 days before expected return' },
              { label: 'On Return Date', desc: 'Send reminder on the expected return date' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900 text-sm">{item.label}</p>
                  <p className="text-xs text-slate-600">{item.desc}</p>
                </div>
                <div className="relative">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-300 peer-checked:bg-purple-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-300 transition-colors cursor-pointer"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform cursor-pointer"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">All Notifications</h2>
              <p className="text-sm text-slate-600">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>{filter === 'all' ? 'All' : filter}</span>
              </button>

              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-200 z-10">
                  <div className="p-2">
                    {['all', 'unread', 'leave', 'system'].map((f) => (
                      <button
                        key={f}
                        onClick={() => { setFilter(f as any); setShowFilterDropdown(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filter === f ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {f === 'all' ? 'All Notifications' : f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">No notifications found</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              return (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-slate-50 transition-colors ${notification.unread ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900">{notification.title}</h3>
                            {notification.unread && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">{notification.message}</p>
                          <p className="text-xs text-slate-500 mt-2">{notification.timestamp}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {notification.unread && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4 text-slate-600" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-slate-600 hover:text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}