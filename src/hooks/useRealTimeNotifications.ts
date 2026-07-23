'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocket, disconnectSocket } from '@/lib/socket';
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

let notificationPermissionRequested = false;

export const useRealTimeNotifications = () => {
  const [notifications, setNotifications] = useState<(LeaveRequestNotification | HolidayNotification)[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced notification update to prevent rapid updates
  const addNotification = useCallback((data: LeaveRequestNotification | HolidayNotification) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    
    notificationTimeoutRef.current = setTimeout(() => {
      setNotifications((prev) => [data, ...prev].slice(0, 10));
    }, 100);
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
      });
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit('join-admin-room');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleNewLeaveRequest = (data: LeaveRequestNotification) => {
      addNotification(data);
      showBrowserNotification(
        'New Leave Request',
        `${data.employee?.name || 'An employee'} submitted a new leave request`
      );
    };

    const handleLeaveRequestUpdated = (data: LeaveRequestNotification) => {
      addNotification(data);
      showBrowserNotification(
        'Leave Request Updated',
        `Leave request was ${data.action}`
      );
    };

    const handleNewNotification = (data: HolidayNotification) => {
      if (data.type === 'holiday_alert') {
        addNotification(data);
        
        toast.success(data.message, {
          duration: 5000,
          icon: '🎉'
        });
        
        showBrowserNotification(
          '🎉 Upcoming Ghana Holiday',
          data.message
        );
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('new-leave-request', handleNewLeaveRequest);
    socket.on('leave-request-updated', handleLeaveRequestUpdated);
    socket.on('new-notification', handleNewNotification);

    // Request notification permission only once
    if (!notificationPermissionRequested && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      notificationPermissionRequested = true;
      Notification.requestPermission();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('new-leave-request', handleNewLeaveRequest);
      socket.off('leave-request-updated', handleLeaveRequestUpdated);
      socket.off('new-notification', handleNewNotification);
      disconnectSocket();
      
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, [addNotification, showBrowserNotification]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    isConnected,
    clearNotifications,
  };
};