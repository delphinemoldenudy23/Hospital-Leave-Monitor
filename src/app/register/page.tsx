'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Calendar, UserPlus, Building2, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    staffId: '',
    department: '',
    position: '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await axios.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        name: `${formData.firstName} ${formData.lastName}`,
        phoneNumber: formData.phone,
        staffId: formData.staffId,
        department: formData.department,
        position: formData.position,
      });

      toast.success('Registration successful. Please login.');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative flex items-center justify-center px-4 py-8" style={{ backgroundImage: "url('/wallpaper.png')" }}>
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-white/90"></div>
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <img src="/wallpaper.png" alt="Maranova Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-navy-900 text-xl">Maranova</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-strong p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Building2 className="w-4 h-4" />
              <span>Employee Portal</span>
            </div>
            <h1 className="text-3xl font-bold text-navy-900">Create Account</h1>
            <p className="text-navy-600 mt-2">Register as an employee</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-navy-700 font-semibold mb-2 text-sm">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-field text-sm"
                  placeholder="First name"
                  required
                />
              </div>
              <div>
                <label className="block text-navy-700 font-semibold mb-2 text-sm">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-field text-sm"
                  placeholder="Last name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-navy-700 font-semibold mb-2 text-sm">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field text-sm"
                placeholder="your.email@company.com"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-navy-700 font-semibold mb-2 text-sm">
                  Staff ID
                </label>
                <input
                  type="text"
                  name="staffId"
                  value={formData.staffId}
                  onChange={handleChange}
                  className="input-field text-sm"
                  placeholder="ST-001"
                  required
                />
              </div>
              <div>
                <label className="block text-navy-700 font-semibold mb-2 text-sm">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field text-sm"
                  placeholder="Phone number"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-navy-700 font-semibold mb-2 text-sm">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="input-field text-sm"
                  placeholder="Department"
                  required
                />
              </div>
              <div>
                <label className="block text-navy-700 font-semibold mb-2 text-sm">
                  Position
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="input-field text-sm"
                  placeholder="Position"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-navy-700 font-semibold mb-2 text-sm">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field text-sm"
                placeholder="Create password"
                required
              />
            </div>

            <div>
              <label className="block text-navy-700 font-semibold mb-2 text-sm">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field text-sm"
                placeholder="Confirm password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>{loading ? 'Creating account...' : 'Create Account'}</span>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-navy-100">
            <p className="text-center text-navy-600 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-primary-600 font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Admin Portal Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-navy-500">
            Administrator?{' '}
            <Link href="/admin/login" className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1">
              Access Admin Portal <ArrowRight className="w-4 h-4" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}