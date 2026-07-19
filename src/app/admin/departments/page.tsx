'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import toast from 'react-hot-toast';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    try { const res = await axios.get('/departments'); setDepartments(res.data); }
    catch (error) { toast.error('Failed to fetch departments'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDepartment) { await axios.put(`/departments/${editingDepartment._id}`, formData); toast.success('Department updated'); }
      else { await axios.post('/departments', formData); toast.success('Department added'); }
      setShowModal(false); setEditingDepartment(null); setFormData({ name: '', description: '' }); await fetchDepartments();
    } catch (error: any) { toast.error(error.response?.data?.message || 'Operation failed'); }
  };

  const handleEdit = (dept: any) => { setEditingDepartment(dept); setFormData({ name: dept.name, description: dept.description }); setShowModal(true); };
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure?')) { try { await axios.delete(`/departments/${id}`); toast.success('Deleted'); await fetchDepartments(); } catch (error) { toast.error('Failed'); } }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-slate-900">Departments</h1><p className="text-slate-600 mt-1">Manage hospital departments</p></div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"><span>➕</span><span>Add Department</span></button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm"><div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50"><tr><th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Name</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Description</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th></tr></thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {departments.map((dept) => (
              <tr key={dept._id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{dept.name}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{dept.description || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <button onClick={() => handleEdit(dept)} className="text-blue-600 hover:text-blue-800 font-semibold text-sm">Edit</button>
                  <button onClick={() => handleDelete(dept._id)} className="text-red-600 hover:text-red-800 font-semibold text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{editingDepartment ? 'Edit Department' : 'Add Department'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-slate-700 font-semibold mb-2">Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200" required /></div>
              <div><label className="block text-slate-700 font-semibold mb-2">Description</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none" rows={3} /></div>
              <div className="flex gap-4"><button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30">{editingDepartment ? 'Update' : 'Add'}</button><button type="button" onClick={() => { setShowModal(false); setEditingDepartment(null); setFormData({ name: '', description: '' }); }} className="flex-1 px-6 py-3 bg-white text-slate-700 font-semibold rounded-xl border-2 border-slate-200 transition-all duration-300 hover:bg-slate-50 hover:border-slate-300">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}