'use client';

import { useEffect, useState, memo, useCallback } from 'react';
import axios from '@/lib/axios';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getSocket } from '@/lib/socket';
import {
  Calendar, Clock, CheckCircle, XCircle, AlertTriangle, TrendingUp,
  ArrowRight, FileText, UserCheck, Activity, RefreshCw
} from 'lucide-react';
import HolidayCalendar from '@/components/HolidayCalendar';
import EmployeeResetModal from '@/components/EmployeeResetModal';

interface LeaveSummary {
  _id: string;
  leaveType: string;
  status: string;
  startDate: string;
  expectedReturnDate: string;
  duration: number;
}

interface EmployeeDashboardData {
  currentLeave: LeaveSummary | null;
  upcomingLeaves: LeaveSummary[];
  leaveHistory: LeaveSummary[];
}

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  'Approved': { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  'Pending': { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  'Rejected': { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50 border-red-200', dot: 'bg-red-500' },
  'On Leave': { label: 'On Leave', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  'Returned': { label: 'Returned', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-200', dot: 'bg-slate-500' },
  'Overdue': { label: 'Overdue', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', dot: 'bg-rose-500' },
};

const StatusBadge = memo(({ status }: { status: string }) => {
  const config = statusConfig[status] || { label: status, color: 'text-slate-700', bg: 'bg-slate-100 border-slate-200', dot: 'bg-slate-500' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${config.bg} ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
});

const StatCard = memo(({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent: string }) => {
  const accentColors: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600 bg-blue-50 text-blue-600',
    emerald: 'from-emerald-500 to-emerald-600 bg-emerald-50 text-emerald-600',
    amber: 'from-amber-500 to-amber-600 bg-amber-50 text-amber-600',
    purple: 'from-purple-500 to-purple-600 bg-purple-50 text-purple-600',
    rose: 'from-rose-500 to-rose-600 bg-rose-50 text-rose-600',
  };
  const c = accentColors[accent] || accentColors.blue;
  const [gradient, , iconBg, iconColor] = c.split(' ');

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`${iconBg} w-12 h-12 rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-sm text-slate-500 font-medium">{label}</div>
    </div>
  );
});

export default function EmployeeDashboard() {
  const [data, setData] = useState<EmployeeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);

  const fetchEmployeeDashboard = useCallback(async () => {
    try {
      const leavesResponse = await axios.get('/leaves/employee/my-leaves');
      const leaves = leavesResponse.data;

      const currentLeave = leaves.find((l: any) => l.status === 'On Leave' || l.status === 'Approved');
      const upcomingLeaves = leaves.filter((l: any) => l.status === 'Approved' && new Date(l.startDate) > new Date());
      const leaveHistory = leaves.filter((l: any) => ['Returned', 'Rejected'].includes(l.status));

      setData({
        currentLeave,
        upcomingLeaves,
        leaveHistory
      });
    } catch (error) {
      console.error('Failed to fetch employee dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployeeDashboard();

    const socket = getSocket();
    if (!socket) return;
    
    let debounceTimer: NodeJS.Timeout;
    
    const handleStatusUpdate = () => {
      // Debounce to prevent rapid successive calls
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchEmployeeDashboard(), 300);
    };
    socket.on('leave-status-updated', handleStatusUpdate);

    return () => {
      clearTimeout(debounceTimer);
      socket.off('leave-status-updated', handleStatusUpdate);
    };
  }, [fetchEmployeeDashboard]);

  const handleMarkReturned = async (id: string) => {
    try {
      await axios.put(`/leaves/${id}/return`);
      toast.success('You have been marked as returned to duty');
      fetchEmployeeDashboard();
    } catch (error) {
      toast.error('Failed to mark as returned');
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
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

        {/* Calendar Skeleton */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80">
          <div className="h-6 w-40 bg-slate-200 rounded-lg animate-pulse mb-4"></div>
          <div className="h-64 bg-slate-200 rounded-xl animate-pulse"></div>
        </div>

        {/* Upcoming Leaves Skeleton */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80">
          <div className="h-6 w-40 bg-slate-200 rounded-lg animate-pulse mb-6"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 rounded-xl animate-pulse mb-3"></div>
          ))}
        </div>

        {/* Leave History Skeleton */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80">
          <div className="h-6 w-40 bg-slate-200 rounded-lg animate-pulse mb-6"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalLeaves = (data?.leaveHistory?.length || 0) + (data?.upcomingLeaves?.length || 0) + (data?.currentLeave ? 1 : 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Here's your leave overview</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowResetModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reset History
          </button>
          <Link
            href="/employee/leave-request"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500
                     text-white font-semibold rounded-xl transition-all duration-300
                     shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30
                     hover:from-blue-700 hover:to-blue-600 active:scale-[0.98]"
          >
            <FileText className="w-5 h-5" />
            <span>Request Leave</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Total Leaves" value={totalLeaves} accent="blue" />
        <StatCard icon={Clock} label="Upcoming" value={data?.upcomingLeaves?.length || 0} accent="amber" />
        <StatCard icon={CheckCircle} label="Completed" value={data?.leaveHistory?.filter(l => l.status === 'Returned')?.length || 0} accent="emerald" />
        <StatCard icon={Activity} label="Active Status" value={data?.currentLeave ? 'On Leave' : 'Present'} accent={data?.currentLeave ? 'rose' : 'emerald'} />
      </div>

      {/* Holiday Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HolidayCalendar isAdmin={false} />
      </div>

      {/* Current Leave Alert */}
      {data?.currentLeave && (() => {
        const currentLeave = data.currentLeave;
        return (
          <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-1">Current Leave</h2>
                <p className="text-white/90">
                  You are on <strong>{currentLeave.leaveType}</strong> leave
                </p>
                <p className="text-white/70 text-sm mt-1">
                  Expected return: <strong>{new Date(currentLeave.expectedReturnDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</strong>
                </p>
                <button
                  onClick={() => handleMarkReturned(currentLeave._id)}
                  className="mt-4 px-5 py-2 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-200 inline-flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Confirm Return to Duty
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Upcoming Leaves */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Upcoming Leaves</h2>
          </div>
          <Link href="/employee/my-leaves" className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {data?.upcomingLeaves && data.upcomingLeaves.length > 0 ? (
          <div className="space-y-3">
            {data.upcomingLeaves.map((leave) => (
              <div key={leave._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{leave.leaveType}</p>
                    <p className="text-sm text-slate-500">{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.expectedReturnDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400">{leave.duration} days</span>
                  <StatusBadge status={leave.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">No upcoming leaves</p>
            <Link href="/employee/leave-request" className="text-blue-600 text-sm font-medium hover:text-blue-700 mt-2 inline-block">
              Request a leave
            </Link>
          </div>
        )}
      </div>

      {/* Leave History */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-slate-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Recent History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider py-3 px-4">Leave Type</th>
                <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider py-3 px-4">Start Date</th>
                <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider py-3 px-4">Duration</th>
                <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider py-3 px-4">Expected Return</th>
                <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.leaveHistory?.slice(0, 5).map((leave) => (
                <tr key={leave._id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900">{leave.leaveType}</td>
                  <td className="py-3 px-4 text-slate-500">{new Date(leave.startDate).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-slate-500">{leave.duration} days</td>
                  <td className="py-3 px-4 text-slate-500">{new Date(leave.expectedReturnDate).toLocaleDateString()}</td>
                  <td className="py-3 px-4"><StatusBadge status={leave.status} /></td>
                </tr>
              ))}
              {(!data?.leaveHistory || data.leaveHistory.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">No leave history yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Reset Modal */}
      <EmployeeResetModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onSuccess={() => {
          fetchEmployeeDashboard();
        }}
      />
    </div>
  );
}