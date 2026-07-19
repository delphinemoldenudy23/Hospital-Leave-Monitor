'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import toast from 'react-hot-toast';
import { Camera, User, Shield, Mail, Building2 } from 'lucide-react';

interface AdminProfile {
  _id: string;
  email: string;
  role: string;
  profilePicture?: string;
  employeeId?: {
    _id: string;
    staffId: string;
    name: string;
    department: string;
    position: string;
    phoneNumber: string;
    email: string;
  };
}

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/auth/me');
      setProfile(response.data);
    } catch (error) {
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only image files are allowed (jpeg, jpg, png, gif, webp)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploadingPicture(true);
    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const response = await axios.post('/auth/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Profile picture uploaded successfully');
      await fetchProfile(); // Await to ensure UI updates
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setChangingPassword(true);
    try {
      await axios.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Failed to load profile</p>
      </div>
    );
  }

  const profilePictureUrl = profile.profilePicture 
    ? `http://localhost:5001/uploads/profile-pictures/${profile.profilePicture}`
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-600 mt-1">View and manage your admin profile</p>
      </div>

      {/* Profile Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-6 mb-6 p-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-blue-100 flex items-center justify-center">
              {profilePictureUrl ? (
                <img 
                  src={profilePictureUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-full h-full flex items-center justify-center ${profilePictureUrl ? 'hidden' : ''}`}>
                <User className="w-12 h-12 text-blue-600" />
              </div>
            </div>
            <label className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
              <Camera className="w-5 h-5 text-white" />
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleProfilePictureUpload}
                disabled={uploadingPicture}
                className="hidden"
              />
            </label>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-slate-900">
                {profile.employeeId?.name || 'Admin User'}
              </h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold capitalize">
                {profile.role}
              </span>
            </div>
            <p className="text-slate-600">{profile.employeeId?.position || 'System Administrator'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 px-6 pb-6">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-slate-500" />
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Email</p>
            </div>
            <p className="text-lg font-semibold text-slate-900">{profile.email}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-slate-500" />
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Role</p>
            </div>
            <p className="text-lg font-semibold text-slate-900 capitalize">{profile.role}</p>
          </div>
          {profile.employeeId && (
            <>
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Department</p>
                </div>
                <p className="text-lg font-semibold text-slate-900">{profile.employeeId.department}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-slate-500" />
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Staff ID</p>
                </div>
                <p className="text-lg font-semibold text-slate-900">{profile.employeeId.staffId}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Account Information</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-3 border-b border-slate-100">
            <span className="text-slate-600">Account Type</span>
            <span className="font-semibold text-slate-900 capitalize">{profile.role}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-slate-100">
            <span className="text-slate-600">Email Verified</span>
            <span className="font-semibold text-emerald-600">Yes</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-slate-600">Member Since</span>
            <span className="font-semibold text-slate-900">
              {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            </span>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-slate-700 font-semibold mb-2">Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900
                       focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                       transition-all duration-200"
              placeholder="Enter your current password"
              required
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-2">New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900
                       focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                       transition-all duration-200"
              placeholder="Enter your new password (min 6 characters)"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-2">Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900
                       focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                       transition-all duration-200"
              placeholder="Confirm your new password"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={changingPassword}
            className="w-full px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-600
                     text-white font-semibold rounded-xl transition-all duration-300
                     shadow-lg shadow-slate-500/25 hover:shadow-xl hover:shadow-slate-500/30
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {changingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
