'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Redirect based on role
      const role = localStorage.getItem('role');
      router.push(role === 'admin' ? '/admin/dashboard' : '/employee/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-6">
          Hospital Leave Management System
        </h1>
        <p className="text-xl text-blue-100 mb-12">
          Monitor and manage staff leave periods efficiently
        </p>
        <div className="space-x-4">
          <Link
            href="/auth/login"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="inline-block bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
