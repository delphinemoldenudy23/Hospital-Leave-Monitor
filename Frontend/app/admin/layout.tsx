'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'admin') {
      router.push('/auth/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    router.push('/auth/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-6">
        <h1 className="text-2xl font-bold mb-8">Hospital System</h1>
        <nav className="space-y-4">
          <Link
            href="/admin/dashboard"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/employees"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            Employees
          </Link>
          <Link
            href="/admin/leaves"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            Leave Requests
          </Link>
          <Link
            href="/admin/departments"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            Departments
          </Link>
          <Link
            href="/admin/reports"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            Reports
          </Link>
          <Link
            href="/admin/notifications"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            Notifications
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 rounded hover:bg-gray-800 transition mt-8"
          >
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}
