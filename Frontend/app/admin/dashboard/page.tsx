'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardData {
  totalEmployees: number;
  employeesOnLeave: number;
  returningWithin7Days: number;
  overdueEmployees: number;
  recentLeaves: any[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const dashResponse = await axios.get('/dashboard/admin');
      const statsResponse = await axios.get('/dashboard/statistics');

      setData(dashResponse.data);
      setStatistics(statsResponse.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-gray-800">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-500 text-white p-6 rounded-lg">
          <h3 className="text-gray-200 text-sm font-semibold">Total Employees</h3>
          <p className="text-3xl font-bold mt-2">{data?.totalEmployees || 0}</p>
        </div>
        <div className="bg-green-500 text-white p-6 rounded-lg">
          <h3 className="text-gray-100 text-sm font-semibold">On Leave</h3>
          <p className="text-3xl font-bold mt-2">{data?.employeesOnLeave || 0}</p>
        </div>
        <div className="bg-yellow-500 text-white p-6 rounded-lg">
          <h3 className="text-gray-100 text-sm font-semibold">Returning Soon (7 days)</h3>
          <p className="text-3xl font-bold mt-2">{data?.returningWithin7Days || 0}</p>
        </div>
        <div className="bg-red-500 text-white p-6 rounded-lg">
          <h3 className="text-gray-100 text-sm font-semibold">Overdue</h3>
          <p className="text-3xl font-bold mt-2">{data?.overdueEmployees || 0}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Leave by Type</h2>
          {statistics?.leaveByType && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statistics.leaveByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0066cc" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Trend</h2>
          {statistics?.monthlyStats && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={statistics.monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#0066cc" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Leaves */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Leave Requests</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Employee</th>
                  <th className="px-4 py-2 text-left">Leave Type</th>
                  <th className="px-4 py-2 text-left">Start Date</th>
                  <th className="px-4 py-2 text-left">End Date</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentLeaves?.map((leave: any) => (
                  <tr key={leave._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">
                      {leave.employee?.firstName} {leave.employee?.lastName}
                    </td>
                    <td className="px-4 py-2">{leave.leaveType}</td>
                    <td className="px-4 py-2">
                      {new Date(leave.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          leave.status === 'Approved'
                            ? 'bg-green-100 text-green-800'
                            : leave.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
