'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import Link from 'next/link';

interface EmployeeDashboardData {
  currentLeave: any;
  upcomingLeaves: any[];
  leaveHistory: any[];
}

export default function EmployeeDashboard() {
  const [data, setData] = useState<EmployeeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployeeDashboard();
  }, []);

  const fetchEmployeeDashboard = async () => {
    try {
      const response = await axios.get('/dashboard/employee');
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch employee dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-gray-800">My Dashboard</h1>
        <Link
          href="/employee/leave-request"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Request Leave
        </Link>
      </div>

      {/* Current Leave */}
      {data?.currentLeave && (
        <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Current Leave</h2>
          <p className="text-gray-600">
            You are currently on {data.currentLeave.leaveType} leave. Expected return date:{' '}
            <span className="font-semibold">
              {new Date(data.currentLeave.expectedReturnDate).toLocaleDateString()}
            </span>
          </p>
          <div className="mt-4">
            <Link
              href={`/employee/return-to-duty/${data.currentLeave._id}`}
              className="text-blue-600 font-semibold hover:underline"
            >
              Confirm Return to Duty
            </Link>
          </div>
        </div>
      )}

      {/* Upcoming Leaves */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Leaves</h2>
          {data?.upcomingLeaves && data.upcomingLeaves.length > 0 ? (
            <div className="space-y-3">
              {data.upcomingLeaves.map((leave: any) => (
                <div key={leave._id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800">{leave.leaveType}</h3>
                      <p className="text-gray-600 text-sm">
                        {new Date(leave.startDate).toLocaleDateString()} -{' '}
                        {new Date(leave.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-gray-500 text-sm mt-1">{leave.duration} days</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        leave.status === 'Approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {leave.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No upcoming leaves</p>
          )}
        </div>
      </div>

      {/* Leave History */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Leave History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Leave Type</th>
                  <th className="px-4 py-2 text-left">Start Date</th>
                  <th className="px-4 py-2 text-left">End Date</th>
                  <th className="px-4 py-2 text-left">Duration</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.leaveHistory?.map((leave: any) => (
                  <tr key={leave._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{leave.leaveType}</td>
                    <td className="px-4 py-2">
                      {new Date(leave.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">{leave.duration} days</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          leave.status === 'Returned'
                            ? 'bg-green-100 text-green-800'
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
