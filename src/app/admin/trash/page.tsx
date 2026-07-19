'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  Trash2, RotateCcw, AlertTriangle, Search, RefreshCw, X
} from 'lucide-react';

export default function AdminTrashPage() {
  const [deletedLeaves, setDeletedLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDeletedLeaves();
  }, []);

  const fetchDeletedLeaves = async () => {
    try {
      const res = await axios.get('/leaves/trash/all');
      setDeletedLeaves(res.data);
    } catch (error) {
      toast.error('Failed to fetch deleted leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await axios.put(`/leaves/${id}/restore`);
      toast.success('Leave request restored');
      await fetchDeletedLeaves(); // Await to ensure UI updates
    } catch (error) {
      toast.error('Failed to restore leave request');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this leave request? This action cannot be undone.')) {
      return;
    }
    try {
      await axios.delete(`/leaves/${id}/permanent`);
      toast.success('Leave request permanently deleted');
      await fetchDeletedLeaves(); // Await to ensure UI updates
    } catch (error) {
      toast.error('Failed to permanently delete leave request');
    }
  };

  const filteredLeaves = deletedLeaves.filter(leave => {
    const matchesSearch =
      (leave.employeeId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (leave.employeeId?.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (leave.leaveType || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-9 w-48 bg-slate-200 rounded mb-2 animate-pulse"></div>
            <div className="h-5 w-64 bg-slate-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse"></div>
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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Trash</h1>
          <p className="text-slate-600 mt-1">Restore or permanently delete leave requests</p>
        </div>
        <button
          onClick={fetchDeletedLeaves}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Refresh</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by employee, department, or leave type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Empty State */}
      {filteredLeaves.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <Trash2 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Trash is empty</h3>
          <p className="text-slate-500">No deleted leave requests found</p>
        </div>
      ) : (
        /* Table */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Leave Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Deleted By</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Deleted At</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{leave.employeeId?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{leave.employeeId?.department || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{leave.leaveType}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="text-xs">
                        <div>Start: {new Date(leave.startDate).toLocaleDateString()}</div>
                        <div>Return: {new Date(leave.expectedReturnDate).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{leave.deletedBy?.email || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {leave.deletedAt ? new Date(leave.deletedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRestore(leave._id)}
                          className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors"
                          title="Restore"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(leave._id)}
                          className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                          title="Delete Permanently"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
