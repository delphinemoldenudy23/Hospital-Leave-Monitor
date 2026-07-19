'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  Calendar, CalendarX, Download, Filter, Building2, Users, FileText,
  TrendingUp, AlertTriangle, CheckCircle, Clock, ChevronDown,
  BarChart3, FileSpreadsheet, Printer
} from 'lucide-react';

export default function ReportsPage() {
  const [currentLeave, setCurrentLeave] = useState<any[]>([]);
  const [overdueLeave, setOverdueLeave] = useState<any[]>([]);
  const [departmentReport, setDepartmentReport] = useState<any>(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [monthlyStats, setMonthlyStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('excel');

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      const [currentRes, overdueRes] = await Promise.all([
        axios.get('/reports/current-leave'),
        axios.get('/reports/overdue')
      ]);
      setCurrentLeave(currentRes.data);
      setOverdueLeave(overdueRes.data);
    } catch (error) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentReport = async () => {
    if (!selectedDepartment) return;
    try {
      const res = await axios.get(`/reports/department/${selectedDepartment}`);
      setDepartmentReport(res.data);
    }
    catch (error) {
      toast.error('Failed to fetch department report');
    }
  };

  const fetchMonthlyStats = async () => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    try {
      const res = await axios.get(`/reports/monthly-statistics?year=${year}&month=${month}`);
      setMonthlyStats(res.data);
    }
    catch (error) {
      toast.error('Failed to fetch monthly statistics');
    }
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    toast.success(`Exporting report as ${format.toUpperCase()}...`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-9 w-36 bg-slate-200 rounded mb-2 animate-pulse"></div>
            <div className="h-5 w-56 bg-slate-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-64 bg-slate-200 rounded-xl animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200/80">
              <div className="h-12 w-12 bg-slate-200 rounded-xl mb-4 animate-pulse"></div>
              <div className="h-8 w-16 bg-slate-200 rounded mb-2 animate-pulse"></div>
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-12 w-12 bg-slate-200 rounded-xl animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-48 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-4 w-64 bg-slate-200 rounded animate-pulse"></div>
                </div>
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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reports</h1>
          <p className="text-slate-600 mt-1">Leave reports and analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Filter className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Filter</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 z-10">
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date Range</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                    <input
                      type="text"
                      placeholder="All departments"
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => { setShowFilterDropdown(false); fetchDepartmentReport(); }}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="text-sm">Export Excel</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span className="text-sm">Export PDF</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Current on Leave</p>
              <p className="text-2xl font-bold text-slate-900">{currentLeave.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Overdue</p>
              <p className="text-2xl font-bold text-slate-900">{overdueLeave.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">This Month Approved</p>
              <p className="text-2xl font-bold text-slate-900">{monthlyStats?.approved || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Pending Requests</p>
              <p className="text-2xl font-bold text-slate-900">{monthlyStats?.pending || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Leave Report */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Current Leave</h2>
              <p className="text-sm text-slate-600">Employees currently on leave</p>
            </div>
          </div>
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
        <div className="space-y-3">
          {currentLeave.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl">
              <CalendarX className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">No employees currently on leave</p>
            </div>
          ) : (
            currentLeave.map((leave) => (
              <div key={leave._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{leave.employeeId?.name || 'N/A'}</p>
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">{leave.leaveType}</span> • {leave.employeeId?.department || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">Returns: {new Date(leave.expectedReturnDate).toLocaleDateString()}</p>
                  <p className="text-xs text-slate-500">{leave.duration} days</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Overdue Employees */}
      <div className="bg-white rounded-2xl p-6 border border-red-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Overdue Returns</h2>
              <p className="text-sm text-slate-600">Employees who have not returned as scheduled</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
            {overdueLeave.length} overdue
          </span>
        </div>
        <div className="space-y-3">
          {overdueLeave.length === 0 ? (
            <div className="text-center py-12 bg-green-50 rounded-xl">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <p className="text-green-700 font-medium">No overdue employees</p>
            </div>
          ) : (
            overdueLeave.map((leave) => (
              <div key={leave._id} className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-900">{leave.employeeId?.name || 'N/A'}</p>
                    <p className="text-sm text-red-700">
                      <span className="font-medium">{leave.leaveType}</span> • {leave.employeeId?.department || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-900">Was due: {new Date(leave.expectedReturnDate).toLocaleDateString()}</p>
                  <p className="text-xs text-red-600">
                    {Math.ceil((new Date().getTime() - new Date(leave.expectedReturnDate).getTime()) / (1000 * 60 * 60 * 24))} days overdue
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Department Report */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Department Report</h2>
            <p className="text-sm text-slate-600">View statistics by department</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Enter department name..."
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              onKeyDown={(e) => (e as any).key === 'Enter' && fetchDepartmentReport()}
            />
          </div>
          <button
            onClick={fetchDepartmentReport}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Generate Report
          </button>
        </div>
        {departmentReport && (
          <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 border border-purple-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{departmentReport.department}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 border border-purple-100">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Total Employees</p>
                <p className="text-2xl font-bold text-purple-600">{departmentReport.totalEmployees}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-purple-100">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Leave Requests</p>
                <p className="text-2xl font-bold text-purple-600">{departmentReport.leaveRequests?.length || 0}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-purple-100">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">On Leave</p>
                <p className="text-2xl font-bold text-purple-600">{currentLeave.filter(l => l.employeeId?.department === selectedDepartment).length}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-purple-100">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Overdue</p>
                <p className="text-2xl font-bold text-purple-600">{overdueLeave.filter(l => l.employeeId?.department === selectedDepartment).length}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Statistics */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Monthly Statistics</h2>
              <p className="text-sm text-slate-600">Current month leave overview</p>
            </div>
          </div>
          <button
            onClick={fetchMonthlyStats}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Refresh Stats
          </button>
        </div>
        {monthlyStats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-blue-100">
              <p className="text-sm text-slate-600 font-medium mb-2">Total Requests</p>
              <p className="text-3xl font-bold text-blue-600">{monthlyStats.total}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-6 border border-emerald-100">
              <p className="text-sm text-slate-600 font-medium mb-2">Approved</p>
              <p className="text-3xl font-bold text-emerald-600">{monthlyStats.approved}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl p-6 border border-red-100">
              <p className="text-sm text-slate-600 font-medium mb-2">Rejected</p>
              <p className="text-3xl font-bold text-red-600">{monthlyStats.rejected}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-6 border border-amber-100">
              <p className="text-sm text-slate-600 font-medium mb-2">Pending</p>
              <p className="text-3xl font-bold text-amber-600">{monthlyStats.pending}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-xl">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">Click the button above to load this month's statistics</p>
          </div>
        )}
      </div>
    </div>
  );
}