'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, Calendar, Users, Building2, Award,
  BarChart3, PieChart as PieChartIcon, Activity, ArrowUp, ArrowDown
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

interface AnalyticsData {
  monthlyTrends: Array<{
    month: string;
    currentYear: number;
    previousYear: number;
    approved: number;
    rejected: number;
    pending: number;
  }>;
  peakPeriod: { month: string; count: number };
  lowPeriod: { month: string; count: number };
  leaveTypeDistribution: Array<{ name: string; value: number; percentage: string }>;
  departmentTrends: Array<{
    name: string;
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    approvalRate: string;
  }>;
  approvalRates: { approved: string; rejected: string; pending: string };
  topEmployees: Array<{
    employeeId: string;
    name: string;
    department: string;
    totalLeaves: number;
    totalDays: number;
  }>;
  yearOverYear: {
    currentYear: { year: number; totalLeaves: number; totalDays: number };
    previousYear: { year: number; totalLeaves: number; totalDays: number };
    growth: { totalLeaves: string; totalDays: string };
  };
  summary: {
    totalRequests: number;
    totalDays: number;
    averageDuration: string;
  };
}

export default function LeaveAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchAnalytics();
  }, [selectedYear]);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`/reports/analytics?year=${selectedYear}`);
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-48 bg-slate-200 rounded mb-2 animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-6 h-80 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No analytics data available</h3>
        <p className="text-slate-500">Start tracking leave requests to see analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Leave Analytics</h1>
          <p className="text-slate-600 mt-1">Comprehensive leave trends and insights</p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
          <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
          <option value={new Date().getFullYear() - 2}>{new Date().getFullYear() - 2}</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${parseFloat(data.yearOverYear.growth.totalLeaves) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {parseFloat(data.yearOverYear.growth.totalLeaves) >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              {Math.abs(parseFloat(data.yearOverYear.growth.totalLeaves))}%
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{data.summary.totalRequests}</div>
          <div className="text-sm text-slate-500">Total Leave Requests</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-emerald-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${parseFloat(data.yearOverYear.growth.totalDays) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {parseFloat(data.yearOverYear.growth.totalDays) >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              {Math.abs(parseFloat(data.yearOverYear.growth.totalDays))}%
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{data.summary.totalDays}</div>
          <div className="text-sm text-slate-500">Total Leave Days</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <div className="text-sm font-medium text-amber-600">Peak</div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{data.peakPeriod.month}</div>
          <div className="text-sm text-slate-500">{data.peakPeriod.count} requests</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-sm font-medium text-purple-600">Low</div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{data.lowPeriod.month}</div>
          <div className="text-sm text-slate-500">{data.lowPeriod.count} requests</div>
        </div>
      </div>

      {/* Monthly Trends Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Monthly Leave Trends</h2>
            <p className="text-sm text-slate-500 mt-1">Year-over-year comparison</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-slate-600">Current Year</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
              <span className="text-slate-600">Previous Year</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.monthlyTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" stroke="#64748b" fontSize={12} fontWeight={500} axisLine={false} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={12} fontWeight={500} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '12px' }} />
            <Area type="monotone" dataKey="currentYear" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCurrent)" />
            <Area type="monotone" dataKey="previousYear" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorPrevious)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Leave Type Distribution & Approval Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Leave Type Distribution</h2>
              <p className="text-sm text-slate-500 mt-1">Breakdown by leave type</p>
            </div>
            <PieChartIcon className="w-5 h-5 text-slate-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.leaveTypeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.leaveTypeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Approval Rates</h2>
              <p className="text-sm text-slate-500 mt-1">Request status breakdown</p>
            </div>
            <Activity className="w-5 h-5 text-slate-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { name: 'Approved', value: parseFloat(data.approvalRates.approved), fill: '#10b981' },
              { name: 'Rejected', value: parseFloat(data.approvalRates.rejected), fill: '#ef4444' },
              { name: 'Pending', value: parseFloat(data.approvalRates.pending), fill: '#f59e0b' }
            ]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} fontWeight={500} axisLine={false} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} fontWeight={500} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '12px' }} formatter={(value: number) => [`${value}%`, 'Rate']} />
              <Bar dataKey="value" radius={[8, 8, 8, 8]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Trends */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Department-wise Leave Trends</h2>
            <p className="text-sm text-slate-500 mt-1">Leave distribution by department</p>
          </div>
          <Building2 className="w-5 h-5 text-slate-400" />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.departmentTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} fontWeight={500} axisLine={false} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={12} fontWeight={500} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '12px' }} />
            <Legend />
            <Bar dataKey="approved" name="Approved" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Employees & Year-over-Year */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Top Leave-Taking Employees</h2>
              <p className="text-sm text-slate-500 mt-1">Employees with most leave requests</p>
            </div>
            <Users className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            {data.topEmployees.slice(0, 5).map((employee, index) => (
              <div key={employee.employeeId} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{employee.name}</div>
                  <div className="text-sm text-slate-500">{employee.department}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-900">{employee.totalLeaves} requests</div>
                  <div className="text-sm text-slate-500">{employee.totalDays} days</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Year-over-Year Comparison</h2>
              <p className="text-sm text-slate-500 mt-1">Annual leave growth</p>
            </div>
            <Award className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-6">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Total Requests</span>
                <span className={`text-sm font-semibold ${parseFloat(data.yearOverYear.growth.totalLeaves) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {parseFloat(data.yearOverYear.growth.totalLeaves) >= 0 ? '+' : ''}{data.yearOverYear.growth.totalLeaves}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-slate-900">{data.yearOverYear.currentYear.totalLeaves}</div>
                  <div className="text-xs text-slate-500">{data.yearOverYear.currentYear.year}</div>
                </div>
                <div className="text-slate-400">vs</div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-600">{data.yearOverYear.previousYear.totalLeaves}</div>
                  <div className="text-xs text-slate-500">{data.yearOverYear.previousYear.year}</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Total Days</span>
                <span className={`text-sm font-semibold ${parseFloat(data.yearOverYear.growth.totalDays) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {parseFloat(data.yearOverYear.growth.totalDays) >= 0 ? '+' : ''}{data.yearOverYear.growth.totalDays}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-slate-900">{data.yearOverYear.currentYear.totalDays}</div>
                  <div className="text-xs text-slate-500">{data.yearOverYear.currentYear.year}</div>
                </div>
                <div className="text-slate-400">vs</div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-600">{data.yearOverYear.previousYear.totalDays}</div>
                  <div className="text-xs text-slate-500">{data.yearOverYear.previousYear.year}</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Average Duration</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{data.summary.averageDuration} days</div>
              <div className="text-xs text-slate-500">Per leave request</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
