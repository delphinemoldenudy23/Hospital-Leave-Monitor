'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getSocket } from '@/lib/socket';
import { Calendar, LayoutDashboard, FileText, Bell, User, LogOut, Menu, X, ChevronRight, MessageSquare, Sparkles } from 'lucide-react';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
      router.push('/login');
    } else if (role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      const storedEmployeeId = localStorage.getItem('employeeId');
      setEmployeeId(storedEmployeeId);
      setIsLoading(false);
    }
  }, [router]);

  // Socket connection for real-time updates
  useEffect(() => {
    if (!isLoading && employeeId) {
      const socket = getSocket();

      socket.on('connect', () => {
        socket.emit('join-employee-room', employeeId);
      });

      socket.on('leave-status-updated', (data) => {
        const action = data.action;
        const leaveType = data.leaveRequest?.leaveType || 'Leave';
        
        if (action === 'approved') {
          toast.success(`${leaveType} request has been approved!`, { duration: 5000 });
        } else if (action === 'rejected') {
          toast.error(`${leaveType} request has been rejected.`, { duration: 5000 });
        } else if (action === 'submitted') {
          toast.success('Leave request submitted successfully!', { duration: 5000 });
        }
      });

      socket.on('new-notification', (data) => {
        if (data.type === 'holiday_alert') {
          toast.success(data.message, { 
            duration: 8000,
            icon: '🎉'
          });
        }
      });

      if (socket.connected) {
        socket.emit('join-employee-room', employeeId);
      }

      return () => {
        socket.off('connect');
        socket.off('leave-status-updated');
        socket.off('new-notification');
      };
    }
  }, [isLoading, employeeId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-surface-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('employeeId');
    router.push('/login');
  };

  const navItems = [
    { href: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/employee/leave-request', label: 'Request Leave', icon: FileText },
    { href: '/employee/my-leaves', label: 'My Leaves', icon: Calendar },
    { href: '/employee/holidays', label: 'Holidays', icon: Sparkles },
    { href: '/employee/help', label: 'Help', icon: MessageSquare },
    { href: '/employee/notifications', label: 'Notifications', icon: Bell },
    { href: '/employee/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="flex h-screen bg-surface-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-surface-900 text-white transform transition-all duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-surface-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 flex-shrink-0">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight">Hospital Leave</h1>
              <p className="text-xs text-surface-400">Employee Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 group ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600/20 to-primary-700/10 text-white border-l-2 border-primary-500'
                    : 'text-surface-300 hover:bg-surface-800/50 hover:text-white active:scale-95'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-400' : 'text-surface-400 group-hover:text-surface-200'}`} />
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-primary-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-surface-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-surface-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 text-surface-400 group-hover:text-red-400" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-surface-200/80 px-4 lg:px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-surface-100 transition-colors"
              >
                <Menu className="w-6 h-6 text-surface-600" />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-sm text-surface-400">
                <Calendar className="w-4 h-4" />
                <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-sm">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-surface-700">Employee</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-8 animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}