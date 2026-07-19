'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import toast from 'react-hot-toast';
import { User, Camera } from 'lucide-react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [formData, setFormData] = useState({
    staffId: '', name: '', department: '', position: '', phoneNumber: '', email: ''
  });

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try { const res = await axios.get('/employees'); setEmployees(res.data); }
    catch (error) { toast.error('Failed to fetch employees'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await axios.put(`/employees/${editingEmployee._id}`, formData);
        toast.success('Employee updated successfully');
      } else {
        await axios.post('/employees', formData);
        toast.success('Employee added successfully');
      }
      setShowModal(false); setEditingEmployee(null);
      setFormData({ staffId: '', name: '', department: '', position: '', phoneNumber: '', email: '' });
      await fetchEmployees(); // Await to ensure UI updates
    } catch (error: any) { toast.error(error.response?.data?.message || 'Operation failed'); }
  };

  const handleEdit = (employee: any) => {
    setEditingEmployee(employee);
    setFormData({ staffId: employee.staffId, name: employee.name, department: employee.department, position: employee.position, phoneNumber: employee.phoneNumber, email: employee.email });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      try { await axios.delete(`/employees/${id}`); toast.success('Employee deleted successfully'); await fetchEmployees(); }
      catch (error) { toast.error('Failed to delete employee'); }
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>, employeeId: string) => {
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
      await axios.post(`/employees/${employeeId}/profile-picture`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Profile picture uploaded successfully');
      await fetchEmployees(); // Await to ensure UI updates
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-9 w-40 bg-slate-200 rounded mb-2 animate-pulse"></div>
            <div className="h-5 w-56 bg-slate-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-36 bg-slate-200 rounded-xl animate-pulse"></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-6">
                <div className="h-5 w-24 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-5 w-36 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-5 w-28 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-5 w-32 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-5 w-28 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-5 w-44 bg-slate-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-slate-900">Employees</h1><p className="text-slate-600 mt-1">Manage hospital staff members</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"><span>➕</span><span>Add Employee</span></button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr><th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Photo</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Staff ID</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Name</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Department</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Position</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Phone</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Email</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th></tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {employees.map((employee) => {
                const profilePictureUrl = employee.profilePicture 
                  ? `http://localhost:5001/uploads/profile-pictures/${employee.profilePicture}`
                  : null;
                return (
                  <tr key={employee._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                          {profilePictureUrl ? (
                            <img 
                              src={profilePictureUrl} 
                              alt={employee.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center ${profilePictureUrl ? 'hidden' : ''}`}>
                            <User className="w-6 h-6 text-slate-400" />
                          </div>
                        </div>
                        <label className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                          <Camera className="w-3 h-3 text-white" />
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={(e) => handleProfilePictureUpload(e, employee._id)}
                            disabled={uploadingPicture}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{employee.staffId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{employee.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{employee.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{employee.position}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{employee.phoneNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{employee.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <button onClick={() => handleEdit(employee)} className="text-blue-600 hover:text-blue-800 font-semibold text-sm">Edit</button>
                      <button onClick={() => handleDelete(employee._id)} className="text-red-600 hover:text-red-800 font-semibold text-sm">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{editingEmployee ? 'Edit Employee' : 'Add Employee'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {['staffId','name','department','position','phoneNumber','email'].map(field => (
                <div key={field}>
                  <label className="block text-slate-700 font-semibold mb-2 capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                  <input type={field === 'email' ? 'email' : field === 'phoneNumber' ? 'tel' : 'text'} value={(formData as any)[field]} onChange={(e) => setFormData({...formData, [field]: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200" required />
                </div>
              ))}
              <div className="flex gap-4">
                <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30">{editingEmployee ? 'Update' : 'Add'}</button>
                <button type="button" onClick={() => { setShowModal(false); setEditingEmployee(null); setFormData({ staffId: '', name: '', department: '', position: '', phoneNumber: '', email: '' }); }} className="flex-1 px-6 py-3 bg-white text-slate-700 font-semibold rounded-xl border-2 border-slate-200 transition-all duration-300 hover:bg-slate-50 hover:border-slate-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}