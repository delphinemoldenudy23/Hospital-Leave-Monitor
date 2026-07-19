'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  Calendar, Plus, Edit2, Trash2, X, Sparkles, Save, ChevronDown
} from 'lucide-react';
import { getSocket, disconnectSocket } from '@/lib/socket';

interface Holiday {
  _id: string;
  name: string;
  date: string;
  year: number;
  isRecurring: boolean;
  description?: string;
}

interface HolidayFormData {
  name: string;
  date: string;
  isRecurring: boolean;
  description: string;
}

export default function HolidayManagement() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState<HolidayFormData>({
    name: '',
    date: '',
    isRecurring: false,
    description: ''
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchHolidays = async (year: number) => {
    try {
      const res = await axios.get(`/holidays?year=${year}`);
      setHolidays(res.data);
    } catch (error) {
      toast.error('Failed to fetch holidays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays(selectedYear);
  }, [selectedYear]);

  // Setup socket connection for real-time updates
  useEffect(() => {
    const socket = getSocket();
    
    // Listen for holiday changes from other admins
    socket.on('holiday-created', (holiday: Holiday) => {
      console.log('Holiday created (admin):', holiday);
      // Refetch holidays for the current year
      fetchHolidays(selectedYear);
    });

    socket.on('holiday-updated', (holiday: Holiday) => {
      console.log('Holiday updated (admin):', holiday);
      // Refetch holidays for the current year
      fetchHolidays(selectedYear);
    });

    socket.on('holiday-deleted', (data: { id: string }) => {
      console.log('Holiday deleted (admin):', data);
      // Refetch holidays for the current year
      fetchHolidays(selectedYear);
    });

    return () => {
      socket.off('holiday-created');
      socket.off('holiday-updated');
      socket.off('holiday-deleted');
      disconnectSocket();
    };
  }, [selectedYear]);

  const handleOpenModal = (holiday?: Holiday) => {
    if (holiday) {
      setEditingHoliday(holiday);
      setFormData({
        name: holiday.name,
        date: holiday.date.split('T')[0],
        isRecurring: holiday.isRecurring,
        description: holiday.description || ''
      });
    } else {
      setEditingHoliday(null);
      setFormData({
        name: '',
        date: '',
        isRecurring: false,
        description: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingHoliday(null);
    setFormData({
      name: '',
      date: '',
      isRecurring: false,
      description: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingHoliday) {
        await axios.put(`/holidays/${editingHoliday._id}`, formData);
        toast.success('Holiday updated successfully');
      } else {
        await axios.post('/holidays', formData);
        toast.success('Holiday created successfully');
      }
      handleCloseModal();
      await fetchHolidays(selectedYear); // Await to ensure UI updates
    } catch (error) {
      toast.error(editingHoliday ? 'Failed to update holiday' : 'Failed to create holiday');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this holiday?')) {
      return;
    }

    try {
      await axios.delete(`/holidays/${id}`);
      toast.success('Holiday deleted successfully');
      await fetchHolidays(selectedYear); // Await to ensure UI updates
    } catch (error) {
      toast.error('Failed to delete holiday');
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Holiday Management</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage company holidays and special dates</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Holiday
          </button>
        </div>
      </div>

      {/* Holidays Grid */}
      {holidays.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-10 h-10 text-amber-500" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-semibold text-lg">No holidays for {selectedYear}</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Click "Add Holiday" to create one</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {holidays.map((holiday) => {
            const holidayDate = new Date(holiday.date);
            const isPast = holidayDate < new Date();
            const isToday = holidayDate.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={holiday._id}
                className={`group relative bg-white dark:bg-slate-800 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${
                  isToday
                    ? 'border-amber-400 shadow-amber-100'
                    : isPast
                    ? 'border-slate-200 dark:border-slate-700 opacity-60'
                    : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-blue-100'
                }`}
              >
                {/* Date Badge */}
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold ${
                  isToday
                    ? 'bg-amber-100 text-amber-700'
                    : isPast
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {isToday ? 'Today' : isPast ? 'Past' : 'Upcoming'}
                </div>

                {/* Card Content */}
                <div className="p-6">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
                    isToday
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                      : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                  }`}>
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>

                  {/* Holiday Name */}
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-1">
                    {holiday.name}
                  </h3>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-3">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium text-slate-900 dark:text-white">
                      {holidayDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Recurring Badge */}
                  {holiday.isRecurring && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium mb-3">
                      <Sparkles className="w-3 h-3" />
                      <span>Recurring</span>
                    </div>
                  )}

                  {/* Description */}
                  {holiday.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                      {holiday.description}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => handleOpenModal(holiday)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(holiday._id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Holiday Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Christmas Day"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 focus:ring-offset-0 dark:focus:ring-offset-slate-800"
                />
                <label htmlFor="isRecurring" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Recurring (repeats annually)
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Add a description for this holiday"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingHoliday ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
