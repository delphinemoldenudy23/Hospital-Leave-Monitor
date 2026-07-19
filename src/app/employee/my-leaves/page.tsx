'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getSocket } from '@/lib/socket';
import { Calendar, FileText, Search, Filter, ArrowRight, UserCheck } from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  'Approved': { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  'Pending': { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  'Rejected': { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50 border-red-200', dot: 'bg-red-500' },
  'On Leave': { label: 'On Leave', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  'Returned': { label: 'Returned', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-200', dot: 'bg-slate-500' },
  'Overdue': { label: 'Overdue', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', dot: 'bg-rose-500' },
};

export default function MyLeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchLeaves();
    const socket = getSocket();
    socket.on('leave-status-updated', fetchLeaves);
    return () => { socket.off('leave-status-updated', fetchLeaves); };
  }, []);

  const fetchLeaves = async () => {
    try {
      const response = await axios.get('/leaves/employee/my-leaves');
      setLeaves(response.data);
    } catch (error) {
      toast.error('Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReturned = async (id: string) => {
    try {
      await axios.put(`/leaves/${id}/return`);
      toast.success('You have been marked as returned to duty');
      fetchLeaves();
    } catch (error) {
      toast.error('Failed to mark as returned');
    }
  };

  const statuses = ['All', 'Pending', 'Approved', 'Rejected', 'On Leave', 'Returned', 'Overdue'];

  const filteredLeaves = leaves
    .filter(l => filter === 'All' || l.status === filter)
    .filter(l => l.leaveType?.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading leaves...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Calendar className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Leaves</h1>
            <p className="text-slate-500 mt-1">View and manage your leave requests</p>
          </div>
        </div>
        <Link
          href="/employee/leave-request"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500
                   text-white font-semibold rounded-xl transition-all duration-300
                   shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
        >
          <FileText className="w-5 h-5" />
          <span>New Request</span>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by leave type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900
                     placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                     transition-all duration-200"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                filter === s
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Leaves Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider py-3 px-4">Leave Type</th>
                <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider py-3 px-4">Start Date</th>
                <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider py-3 px-4">Duration</th>
                <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider py-3 px-4">Expected Return</th>
                <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider py-3 px-4">Status</th>
                <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeaves.map((leave) => {
                const config = statusConfig[leave.status] || statusConfig['Pending'];
                return (
                  <tr key={leave._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">{leave.leaveType}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(leave.startDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-slate-500">{leave.duration} days</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(leave.expectedReturnDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${config.bg} ${config.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
                        {config.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {(leave.status === 'On Leave' || leave.status === 'Approved' || leave.status === 'Overdue') && (
                        <button
                          onClick={() => handleMarkReturned(leave._id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700
                                   rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Return
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredLeaves.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">No leave requests found</p>
                    {search || filter !== 'All' ? (
                      <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters</p>
                    ) : (
                      <Link href="/employee/leave-request" className="text-blue-600 text-sm font-medium mt-2 inline-block hover:text-blue-700">
                        Submit your first leave request
                      </Link>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}