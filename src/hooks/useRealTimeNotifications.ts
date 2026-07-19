'use client';

import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';
import toast from 'react-hot-toast';

interface LeaveRequestNotification {
  leaveRequest: any;
  employee?: any;
  action?: string;
}

interface HolidayNotification {
  type: string;
  message: string;
  holiday: any;
}

export const useRealTimeNotifications = () => {
  const [notifications, setNotifications] = useState<(LeaveRequestNotification | HolidayNotification)[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to socket server');
      socket.emit('join-admin-room');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from socket server');
    });

    socket.on('new-leave-request', (data) => {
      setNotifications((prev) => [data, ...prev].slice(0, 10));
      
      // Show browser notification if permission granted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('New Leave Request', {
          body: `${data.employee?.name || 'An employee'} submitted a new leave request`,
          icon: '/icons/icon-192x192.png',
        });
      }
    });

    socket.on('leave-request-updated', (data) => {
      setNotifications((prev) => [data, ...prev].slice(0, 10));
      
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Leave Request Updated', {
          body: `Leave request was ${data.action}`,
          icon: '/icons/icon-192x192.png',
        });
      }
    });

    socket.on('new-notification', (data: HolidayNotification) => {
      if (data.type === 'holiday_alert') {
        setNotifications((prev) => [data, ...prev].slice(0, 10));
        
        // Show toast notification for holiday alerts
        toast.success(data.message, {
          duration: 8000,
          icon: '🎉'
        });
        
        // Show browser notification if permission granted
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('🎉 Upcoming Ghana Holiday', {
            body: data.message,
            icon: '/icons/icon-192x192.png',
          });
        }
      }
    });

    // Request notification permission
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('new-leave-request');
      socket.off('leave-request-updated');
      socket.off('new-notification');
    };
  }, []);

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    isConnected,
    clearNotifications,
  };
};