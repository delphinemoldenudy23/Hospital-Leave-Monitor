'use client';

import { useEffect, useState, memo, useCallback, lazy, Suspense } from 'react';
import axios from '@/lib/axios';
import Link from 'next/link';
import { getSocket } from '@/lib/socket';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area
} from 'recharts';
import {
  Users, CalendarOff, Clock, AlertTriangle, CheckCircle, TrendingUp,
  ArrowRight, MoreVertical, Bell, UserCheck, RefreshCw
} from 'lucide-react';
const HolidayCalendar = lazy(() => import('@/components/HolidayCalendar'));
const ResetStatsModal = lazy(() => import('@/components/ResetStatsModal'));

interface DashboardData {
  totalEmployees: number;
  onLeave: number;
  pending: number;
  returningSoon: number;
  dueBackToday: number;
  overdue: number;
  approved: number;
  leaveByType: { _id: string; count: number }[];
  monthlyStats: { _id: string; count: number }[];
  recentLeaves: {
  _id: string;
  employeeId?: { name: string; department: string };
  leaveType: string;
  status: string;
  startDate: string;
  expectedReturnDate: string;
  duration: number;
  createdAt: string;
}[];
recentActivities?: {
  _id: string;
  type: string;
  description: string;
  timestamp: string;
  employeeId?: { name: string };
}[];
}
export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await axios.get('/reports/dashboard-stats');
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();

    const socket = getSocket();

if (!socket) return;

// Ensure admin joins the room
if (socket.connected) {
  socket.emit('join-admin-room');
} else {
  socket.on('connect', () => {
    socket.emit('join-admin-room');
  });
}

    let debounceTimer: NodeJS.Timeout;
    
    const handleNewLeave = (data: any) => {
      console.log('New leave request received:', data);
      // Debounce to prevent rapid successive calls
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchDashboard(), 300);
    };
    
    const handleUpdate = (data: any) => {
      console.log('Leave request updated:', data);
      // Debounce to prevent rapid successive calls
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchDashboard(), 300);
    };

    socket.on('new-leave-request', handleNewLeave);
    socket.on('leave-request-updated', handleUpdate);

    return () => {
      clearTimeout(debounceTimer);
      socket.off('new-leave-request', handleNewLeave);
      socket.off('leave-request-updated', handleUpdate);
    };
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="h-9 w-48 bg-slate-200 rounded-lg animate-pulse mb-2"></div>
            <div className="h-5 w-64 bg-slate-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="h-10 w-36 bg-slate-200 rounded-xl animate-pulse"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200/80">
              <div className="w-12 h-12 bg-slate-200 rounded-xl animate-pulse mb-4"></div>
              <div className="h-8 w-16 bg-slate-200 rounded-lg animate-pulse mb-2"></div>
              <div className="h-4 w-24 bg-slate-200 rounded-lg animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80">
            <div className="h-6 w-40 bg-slate-200 rounded-lg animate-pulse mb-4"></div>
            <div className="h-64 bg-slate-200 rounded-xl animate-pulse"></div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80">
            <div className="h-6 w-40 bg-slate-200 rounded-lg animate-pulse mb-4"></div>
            <div className="h-64 bg-slate-200 rounded-xl animate-pulse"></div>
          </div>
        </div>

        {/* Recent Leaves Skeleton */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80">
          <div className="h-6 w-40 bg-slate-200 rounded-lg animate-pulse mb-6"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl max-w-md">
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const kpiCards = [
    { label: 'Total Employees', value: data.totalEmployees, icon: Users, color: 'blue', trend: '+2.5%', trendUp: true },
    { label: 'Currently on Leave', value: data.onLeave, icon: CalendarOff, color: 'amber', trend: '+1', trendUp: false },
    { label: 'Pending Requests', value: data.pending, icon: Clock, color: 'purple', trend: '+3', trendUp: false },
    { label: 'Approved Leaves', value: data.approved || 0, icon: CheckCircle, color: 'emerald', trend: '+12', trendUp: true },
    { label: 'Due Back Today', value: data.dueBackToday, icon: UserCheck, color: 'cyan', trend: null, trendUp: true },
    { label: 'Overdue Returns', value: data.overdue, icon: AlertTriangle, color: 'red', trend: '-2', trendUp: true },
  ];

  const colorMap: Record<string, { bg: string; iconBg: string; iconColor: string; trendColor: string }> = {
    blue: { bg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', trendColor: 'text-blue-600' },
    amber: { bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', trendColor: 'text-amber-600' },
    purple: { bg: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', trendColor: 'text-purple-600' },
    emerald: { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', trendColor: 'text-emerald-600' },
    cyan: { bg: 'bg-cyan-50', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600', trendColor: 'text-cyan-600' },
    red: { bg: 'bg-red-50', iconBg: 'bg-red-100', iconColor: 'text-red-600', trendColor: 'text-red-600' },
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'leave_request': return CalendarOff;
      case 'approval': return CheckCircle;
      case 'return': return UserCheck;
      case 'overdue': return AlertTriangle;
      default: return Bell;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'leave_request': return 'bg-blue-100 text-blue-600';
      case 'approval': return 'bg-emerald-100 text-emerald-600';
      case 'return': return 'bg-cyan-100 text-cyan-600';
      case 'overdue': return 'bg-red-100 text-red-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-600 mt-1">Overview of leave management statistics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <button
            onClick={() => setShowResetModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reset Stats
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          const colors = colorMap[kpi.color];
          return (
            <div key={kpi.label} className="stat-card">
              <div className="flex items-start justify-between mb-4">
                <div className={`${colors.iconBg} w-12 h-12 rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${colors.iconColor}`} />
                </div>
                {kpi.trend && (
                  <div className={`flex items-center gap-1 text-xs font-medium ${kpi.trendUp ? colors.trendColor : 'text-red-600'}`}>
                    <TrendingUp className={`w-3 h-3 ${!kpi.trendUp && 'rotate-180'}`} />
                    {kpi.trend}
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">{kpi.value}</div>
              <div className="text-sm text-slate-600 font-medium">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* Overdue Returns Alert */}
      {data.overdue > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-red-500 rounded-xl p-3">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900">Overdue Returns Alert</h3>
                <p className="text-red-700 text-sm">
                  {data.overdue} employee{data.overdue > 1 ? 's have' : ' has'} not returned from leave as scheduled
                </p>
              </div>
            </div>
            <Link href="/admin/leaves?status=overdue" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2">
              View Details <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Leave Trends */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Monthly Leave Trends</h2>
              <p className="text-sm text-slate-500 mt-1">Leave requests over the last 6 months</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-slate-600">Leave Requests</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthlyStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="_id" 
                stroke="#64748b" 
                fontSize={12} 
                fontWeight={500}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={12} 
                fontWeight={500}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px', 
                  color: '#1e293b',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  padding: '12px'
                }}
                formatter={(value: number) => [value, 'Requests']}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorGradient)"
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ 
                  fill: '#3b82f6', 
                  strokeWidth: 2, 
                  r: 4,
                  stroke: '#ffffff'
                }} 
                activeDot={{ 
                  r: 6, 
                  fill: '#3b82f6',
                  stroke: '#ffffff',
                  strokeWidth: 2
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Holiday Calendar */}
        <div>
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          }>
            <HolidayCalendar isAdmin={true} />
          </Suspense>
        </div>
      </div>

      {/* Recent Activity & Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Timeline */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
            <Link href="/admin/notifications" className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</Link>
          </div>
          <div className="space-y-4">
            {[
              { type: 'leave_request', description: 'John Smith requested sick leave', time: '2 hours ago' },
              { type: 'approval', description: 'Sarah Johnson leave approved', time: '4 hours ago' },
              { type: 'return', description: 'Mike Brown returned to work', time: '1 day ago' },
              { type: 'overdue', description: 'Emily Davis overdue return', time: '2 days ago' },
            ].map((activity, index) => {
              const ActivityIcon = getActivityIcon(activity.type);
              return (
                <div key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className={`${getActivityColor(activity.type)} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <ActivityIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{activity.description}</p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Leave Requests Table */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent Leave Requests</h2>
              <p className="text-sm text-slate-500 mt-1">Latest employee leave applications</p>
            </div>
            <Link href="/admin/leaves" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider py-3 px-4">Employee</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider py-3 px-4">Department</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider py-3 px-4">Type</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider py-3 px-4">Duration</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentLeaves.slice(0, 5).map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{req.employeeId?.name || 'N/A'}</div>
                      <div className="text-xs text-slate-500">{new Date(req.startDate).toLocaleDateString()}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{req.employeeId?.department || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{req.leaveType}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {req.duration} day{req.duration > 1 ? 's' : ''}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reset Stats Modal */}
      <Suspense fallback={null}>
        <ResetStatsModal
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          onSuccess={() => {
          fetchDashboard();
        }}
      />
      </Suspense>
    </div>
  );
}