'use client';
import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  Shield, UserPlus, Edit, Trash2, Search, Plus, Mail, Lock, User,
  ChevronDown, RefreshCw, Settings, ToggleLeft, ToggleRight, Key, X
} from 'lucide-react';
import PinModal from '@/components/PinModal';

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'admin',
    staffId: '',
    name: '',
    department: 'Administration',
    position: '',
    phoneNumber: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showActionPinModal, setShowActionPinModal] = useState(false);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [toggling, setToggling] = useState(false);
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [changePinForm, setChangePinForm] = useState({ currentPin: '', newPin: '' });
  const [changingPin, setChangingPin] = useState(false);

  useEffect(() => {
    const userRole = localStorage.getItem('role');
    if (userRole === 'generalAdmin') {
      setShowPinModal(true);
    }
    fetchAdmins();
    fetchSystemSettings();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await axios.get('/auth/admins');
      setAdmins(res.data);
    } catch (error) {
      toast.error('Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  const handlePinVerified = () => {
    setIsPinVerified(true);
    setShowPinModal(false);
  };

  const fetchSystemSettings = async () => {
    try {
      const res = await axios.get('/system-settings');
      setSystemSettings(res.data);
    } catch (error) {
      setSystemSettings({ adminApprovalPermission: true });
    }
  };

  const toggleApprovalPermission = async () => {
    setPendingAction(() => async () => {
      setToggling(true);
      try {
        const newValue = !systemSettings.adminApprovalPermission;
        await axios.put('/system-settings/approval-permission', {
          adminApprovalPermission: newValue
        });
        await fetchSystemSettings(); // Await to ensure UI updates
      } catch (error) {
        console.error('Failed to update approval permission');
      } finally {
        setToggling(false);
      }
    });
    setShowActionPinModal(true);
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPin(true);

    try {
      await axios.put('/system-settings/security-pin', changePinForm);
      toast.success('PIN updated successfully');
      setShowChangePinModal(false);
      setChangePinForm({ currentPin: '', newPin: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update PIN');
    } finally {
      setChangingPin(false);
    }
  };

  const handlePinVerifiedForAction = () => {
    setShowPinModal(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.post('/auth/admins', formData);
      toast.success('Admin created successfully');
      setShowCreateModal(false);
      setFormData({
        email: '',
        password: '',
        role: 'admin',
        staffId: '',
        name: '',
        department: 'Administration',
        position: '',
        phoneNumber: ''
      });
      await fetchAdmins(); // Await to ensure UI updates
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async (id: string, newRole: string) => {
    try {
      await axios.put(`/auth/admins/${id}/role`, { role: newRole });
      toast.success('Role updated successfully');
      await fetchAdmins(); // Await to ensure UI updates
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm('Are you sure you want to delete this admin?')) {
      return;
    }
    try {
      await axios.delete(`/auth/admins/${id}`);
      toast.success('Admin deleted successfully');
      await fetchAdmins(); // Await to ensure UI updates
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete admin');
    }
  };

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch =
      (admin.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (admin.employeeId?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-48 bg-slate-200 rounded animate-pulse"></div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Admin Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage system administrators</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Admin</span>
        </button>
      </div>

      {/* System Settings - General Admin Only */}
      {isPinVerified && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Admin Approval Permission</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {systemSettings?.adminApprovalPermission
                    ? 'Admins can approve/reject leave requests'
                    : 'Only General Admin can approve/reject requests'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowChangePinModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-600 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all text-sm font-medium text-purple-700 dark:text-purple-300"
              >
                <Key className="w-4 h-4" />
                <span>Change PIN</span>
              </button>
              <button
                onClick={toggleApprovalPermission}
                disabled={toggling}
                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border-2 border-purple-300 dark:border-purple-600 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {toggling ? (
                  <RefreshCw className="w-5 h-5 text-purple-600 animate-spin" />
                ) : systemSettings?.adminApprovalPermission ? (
                  <>
                    <ToggleRight className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-700 dark:text-purple-300">ON</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5 text-slate-400" />
                    <span className="font-medium text-slate-600 dark:text-slate-400">OFF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {isPinVerified && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Total</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{admins.length}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Total Admins</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">General</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{admins.filter(a => a.role === 'generalAdmin').length}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">General Admins</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Admin</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{admins.filter(a => a.role === 'admin').length}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Regular Admins</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-slate-600" />
              </div>
              <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-full">Security</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">PIN</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Protected</div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredAdmins.map((admin) => (
                <tr key={admin._id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-white">{admin.employeeId?.name || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{admin.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                      admin.role === 'generalAdmin'
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : 'bg-blue-100 text-blue-800 border-blue-200'
                    }`}>
                      <Shield className="w-3 h-3" />
                      {admin.role === 'generalAdmin' ? 'General Admin' : 'Admin'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{admin.employeeId?.department || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {admin.role !== 'generalAdmin' && (
                        <>
                          <button
                            onClick={() => handleUpdateRole(admin._id, admin.role === 'admin' ? 'generalAdmin' : 'admin')}
                            className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                            title="Change Role"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAdmin(admin._id)}
                            className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {admin.role === 'generalAdmin' && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">Protected</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Admin</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="admin@hospital.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter password"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="admin">Admin</option>
                  <option value="generalAdmin">General Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Staff ID</label>
                <input
                  type="text"
                  value={formData.staffId}
                  onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="ADMIN001"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Administration"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Position</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Hospital Administrator"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="+1234567890"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Create Admin'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PinModal
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          if (!isPinVerified) {
            window.location.href = '/admin/dashboard';
          }
        }}
        onSuccess={handlePinVerified}
        title="Admin Management Access"
        description="Enter your security PIN to access admin management"
      />

      {/* PIN Verification Modal for Actions */}
      <PinModal
        isOpen={showActionPinModal}
        onClose={() => {
          setShowActionPinModal(false);
          setPendingAction(null);
        }}
        onSuccess={handlePinVerifiedForAction}
        title="Security Verification"
        description="Enter your security PIN to perform this action"
      />

      {/* Change PIN Modal */}
      {showChangePinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Key className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Change Security PIN</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Update your security PIN</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowChangePinModal(false);
                  setChangePinForm({ currentPin: '', newPin: '' });
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleChangePin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Current PIN</label>
                <input
                  type="password"
                  value={changePinForm.currentPin}
                  onChange={(e) => setChangePinForm({ ...changePinForm, currentPin: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-center text-2xl tracking-widest"
                  placeholder="••••"
                  maxLength={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">New PIN</label>
                <input
                  type="password"
                  value={changePinForm.newPin}
                  onChange={(e) => setChangePinForm({ ...changePinForm, newPin: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-center text-2xl tracking-widest"
                  placeholder="••••"
                  maxLength={4}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={changingPin}
                  className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {changingPin ? 'Updating...' : 'Update PIN'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePinModal(false);
                    setChangePinForm({ currentPin: '', newPin: '' });
                  }}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
