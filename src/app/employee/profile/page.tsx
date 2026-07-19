'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import toast from 'react-hot-toast';
import { Camera, Upload, User } from 'lucide-react';

interface UserProfile {
  _id: string;
  email: string;
  role: string;
  employeeId?: {
    _id: string;
    staffId: string;
    name: string;
    department: string;
    position: string;
    phoneNumber: string;
    email: string;
    profilePicture?: string;
  };
}

export default function EmployeeProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    email: '',
  });
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
      if (response.data.employeeId) {
        setFormData({
          phoneNumber: response.data.employeeId.phoneNumber || '',
          email: response.data.employeeId.email || response.data.email,
        });
      }
    } catch (error) {
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.employeeId?._id) return;

    setSaving(true);
    try {
      await axios.put(`/employees/${profile.employeeId._id}`, {
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        name: profile.employeeId.name,
        staffId: profile.employeeId.staffId,
        department: profile.employeeId.department,
        position: profile.employeeId.position,
      });
      toast.success('Profile updated successfully');
      await fetchProfile(); // Await to ensure UI updates
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.employeeId?._id) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only image files are allowed (jpeg, jpg, png, gif, webp)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploadingPicture(true);
    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const response = await axios.post(`/employees/${profile.employeeId._id}/profile-picture`, formData, {
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

  const profilePictureUrl = profile.employeeId?.profilePicture 
    ? `http://localhost:5001/uploads/profile-pictures/${profile.employeeId.profilePicture}`
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-600 mt-1">View and update your profile information</p>
      </div>

      {/* Profile Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4 mb-6 p-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-blue-100 flex items-center justify-center">
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
                <User className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
              <Camera className="w-4 h-4 text-white" />
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
            <h2 className="text-xl font-bold text-slate-900">{profile.employeeId?.name || 'N/A'}</h2>
            <p className="text-slate-600">{profile.employeeId?.position || 'N/A'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 px-6 pb-6">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Staff ID</p>
            <p className="text-lg font-semibold text-slate-900">{profile.employeeId?.staffId || 'N/A'}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Department</p>
            <p className="text-lg font-semibold text-slate-900">{profile.employeeId?.department || 'N/A'}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Role</p>
            <p className="text-lg font-semibold text-slate-900 capitalize">{profile.role}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Email</p>
            <p className="text-lg font-semibold text-slate-900">{profile.email}</p>
          </div>
        </div>
      </div>

      {/* Edit Profile Card */}
      {profile.employeeId && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Edit Profile</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900
                         focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                         transition-all duration-200"
                placeholder="Enter your phone number"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900
                         focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                         transition-all duration-200"
                placeholder="Enter your email"
                required
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500
                       text-white font-semibold rounded-xl transition-all duration-300
                       shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        </div>
      )}

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