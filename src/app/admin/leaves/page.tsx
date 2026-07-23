'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import toast from 'react-hot-toast';
import { getSocket } from '@/lib/socket';
import {
  Search, Filter, Download, ChevronDown, Check, X, UserCheck,
  Calendar, Clock, AlertTriangle, MoreVertical, ArrowUpDown, Trash2
} from 'lucide-react';

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('startDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  useEffect(() => {
    fetchLeaves();
    fetchSystemSettings();
    setUserRole(localStorage.getItem('role') || '');

   const socket = getSocket();

if (!socket) {
  return;
}

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
      debounceTimer = setTimeout(() => fetchLeaves(), 300);
    };
    
    const handleUpdate = (data: any) => {
      console.log('Leave request updated:', data);
      // Debounce to prevent rapid successive calls
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchLeaves(), 300);
    };

    socket.on('new-leave-request', handleNewLeave);
    socket.on('leave-request-updated', handleUpdate);

    return () => {
      clearTimeout(debounceTimer);
      socket.off('new-leave-request', handleNewLeave);
      socket.off('leave-request-updated', handleUpdate);
    };
  }, [currentPage]);

  const fetchLeaves = async () => {
    try {
      const res = await axios.get('/leaves', {
        params: { page: currentPage, limit: itemsPerPage }
      });
      setLeaves(res.data.leaveRequests);
      setPagination(res.data.pagination);
    }
    catch (error) { toast.error('Failed to fetch leave requests'); }
    finally { setLoading(false); }
  };

  const fetchSystemSettings = async () => {
    try {
      const res = await axios.get('/system-settings/approval-permission');
      setSystemSettings(res.data);
    } catch (error) {
      // If endpoint fails, default to permission OFF for security
      setSystemSettings({ adminApprovalPermission: false });
    }
  };

  const handleApprove = async (id: string) => {
    // Check if admin has approval permission
    if (!systemSettings?.adminApprovalPermission && userRole !== 'generalAdmin') {
      toast.error('Admin approval is currently disabled. Only General Admin can approve requests.');
      return;
    }
    
    // Optimistic update
    const previousLeaves = [...leaves];
    setLeaves(leaves.map(leave => 
      leave._id === id ? { ...leave, status: 'Approved' } : leave
    ));
    
    try {
      await axios.put(`/leaves/${id}/approve`);
      toast.success('Leave request approved');
      await fetchLeaves(); // Await to ensure data is refreshed
    }
    catch (error) { 
      toast.error('Failed to approve leave request');
      setLeaves(previousLeaves); // Revert on error
    }
  };

  const handleReject = async () => {
    // Check if admin has approval permission
    if (!systemSettings?.adminApprovalPermission && userRole !== 'generalAdmin') {
      toast.error('Admin approval is currently disabled. Only General Admin can reject requests.');
      return;
    }
    
    // Optimistic update
    const previousLeaves = [...leaves];
    setLeaves(leaves.map(leave => 
      leave._id === selectedLeave._id ? { ...leave, status: 'Rejected' } : leave
    ));
    
    try {
      await axios.put(`/leaves/${selectedLeave._id}/reject`, { rejectionReason });
      toast.success('Leave request rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedLeave(null);
      await fetchLeaves(); // Await to ensure data is refreshed
    }
    catch (error) { 
      toast.error('Failed to reject leave request');
      setLeaves(previousLeaves); // Revert on error
    }
  };

  const handleMarkReturned = async (id: string) => {
    // Optimistic update
    const previousLeaves = [...leaves];
    setLeaves(leaves.map(leave => 
      leave._id === id ? { ...leave, status: 'Returned' } : leave
    ));
    
    try {
      await axios.put(`/leaves/${id}/return`);
      toast.success('Employee marked as returned');
      await fetchLeaves(); // Await to ensure data is refreshed
    }
    catch (error) { 
      toast.error('Failed to mark as returned');
      setLeaves(previousLeaves); // Revert on error
    }
  };

  const handleSoftDelete = async (id: string) => {
    if (!confirm('Are you sure you want to move this leave request to trash?')) {
      return;
    }
    try {
      await axios.delete(`/leaves/${id}`);
      toast.success('Leave request moved to trash');
      await fetchLeaves(); // Await to ensure data is refreshed
    }
    catch (error) { toast.error('Failed to move to trash'); }
  };

  const filteredLeaves = leaves.filter(leave => {
    const matchesSearch =
      (leave.employeeId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (leave.employeeId?.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (leave.leaveType || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || leave.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedLeaves = [...filteredLeaves].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'startDate') {
      comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    } else if (sortBy === 'duration') {
      comparison = a.duration - b.duration;
    } else if (sortBy === 'name') {
      comparison = (a.employeeId?.name || '').localeCompare(b.employeeId?.name || '');
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const paginatedLeaves = sortedLeaves.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sortedLeaves.length / itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'On Leave':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Overdue':
        return 'bg-red-200 text-red-900 border-red-300';
      case 'Pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return Check;
      case 'Rejected':
        return X;
      case 'On Leave':
        return Calendar;
      case 'Overdue':
        return AlertTriangle;
      case 'Pending':
        return Clock;
      default:
        return Clock;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-9 w-48 bg-slate-200 rounded mb-2 animate-pulse"></div>
            <div className="h-5 w-64 bg-slate-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-36 bg-slate-200 rounded-xl animate-pulse"></div>
        </div>
        <div className="flex gap-4">
          <div className="h-10 flex-1 bg-slate-200 rounded-xl animate-pulse"></div>
          <div className="h-10 w-96 bg-slate-200 rounded-xl animate-pulse"></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-5 w-32 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-5 w-28 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-5 w-20 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-5 w-28 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-5 w-24 bg-slate-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Leave Requests</h1>
          <p className="text-slate-600 mt-1">Review and manage employee leave requests</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Export</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by employee, department, or leave type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Filter className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">
                {statusFilter === 'all' ? 'All Status' : statusFilter}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-200 z-10">
                <div className="p-2">
                  {['all', 'Pending', 'Approved', 'Rejected', 'On Leave', 'Overdue'].map((status) => (
                    <button
                      key={status}
                      onClick={() => { setStatusFilter(status); setShowFilterDropdown(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        statusFilter === status ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {status === 'all' ? 'All Status' : status}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sort */}
          <button
            onClick={() => { setSortBy('startDate'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <ArrowUpDown className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Sort by Date</span>
          </button>
        </div>
      </div>

      {/* Overdue Alert */}
      {filteredLeaves.some(l => l.status === 'Overdue') && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-sm font-medium text-red-900">
              {filteredLeaves.filter(l => l.status === 'Overdue').length} overdue return{filteredLeaves.filter(l => l.status === 'Overdue').length > 1 ? 's' : ''} detected
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Employee ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Leave Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLeaves.map((leave) => {
                const StatusIcon = getStatusIcon(leave.status);
                return (
                  <tr key={leave._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{leave.employeeId?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{leave.employeeId?.staffId || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{leave.employeeId?.department || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{leave.employeeId?.email || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{leave.leaveType}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="text-xs">
                        <div>Start: {new Date(leave.startDate).toLocaleDateString()}</div>
                        <div>Return: {new Date(leave.expectedReturnDate).toLocaleDateString()}</div>
                        <div className="text-slate-500">{leave.duration} days</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate" title={leave.reason || ''}>{leave.reason || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(leave.status)}`}>
                        <StatusIcon className="w-3 h-3" />
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {leave.status === 'Pending' && (
                          <>
                            {(systemSettings?.adminApprovalPermission || userRole === 'generalAdmin') && (
                              <button
                                onClick={() => handleApprove(leave._id)}
                                className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            {(systemSettings?.adminApprovalPermission || userRole === 'generalAdmin') && (
                              <button
                                onClick={() => { setSelectedLeave(leave); setShowRejectModal(true); }}
                                className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                        {(leave.status === 'On Leave' || leave.status === 'Approved' || leave.status === 'Overdue') && (
                          <button
                            onClick={() => handleMarkReturned(leave._id)}
                            className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                            title="Mark as Returned"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleSoftDelete(leave._id)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          title="Move to Trash"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-slate-700 transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pageNum = Math.max(1, currentPage - 2) + i;
                if (pageNum > pagination.pages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                disabled={currentPage === pagination.pages}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-slate-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Reject Leave Request</h2>
                <p className="text-sm text-slate-600 mt-1">
                  {selectedLeave?.employeeId?.name}'s {selectedLeave?.leaveType} leave
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Rejection Reason</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                  rows={4}
                  placeholder="Please provide a reason for rejection..."
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
                >
                  Reject Request
                </button>
                <button
                  onClick={() => { setShowRejectModal(false); setRejectionReason(''); setSelectedLeave(null); }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}