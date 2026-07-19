'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import axios from '@/lib/axios';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles, Bell } from 'lucide-react';
import { getSocket, disconnectSocket } from '@/lib/socket';

interface Holiday {
  _id: string;
  name: string;
  date: string;
  year: number;
  isRecurring: boolean;
  description?: string;
}

interface HolidayCalendarProps {
  isAdmin?: boolean;
  onHolidayClick?: (holiday: Holiday) => void;
}

export default function HolidayCalendar({ isAdmin = false, onHolidayClick }: HolidayCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  const fetchHolidays = useCallback(async (year: number) => {
    setLoading(true);
    try {
      const res = await axios.get(`/holidays?year=${year}`);
      setHolidays(res.data);
      
      // Check for upcoming holidays (within 7 days)
      const today = new Date();
      const upcomingHolidays = res.data.filter((h: Holiday) => {
        const holidayDate = new Date(h.date);
        const diffTime = holidayDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      });
      
      if (upcomingHolidays.length > 0) {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    } catch (error) {
      console.error('Failed to fetch holidays:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup socket connection for real-time updates
  useEffect(() => {
    const socket = getSocket();
    
    // Listen for holiday changes
    socket.on('holiday-created', (holiday: Holiday) => {
      console.log('Holiday created:', holiday);
      // Refetch holidays for the current year
      fetchHolidays(currentDate.getFullYear());
    });

    socket.on('holiday-updated', (holiday: Holiday) => {
      console.log('Holiday updated:', holiday);
      // Refetch holidays for the current year
      fetchHolidays(currentDate.getFullYear());
    });

    socket.on('holiday-deleted', (data: { id: string }) => {
      console.log('Holiday deleted:', data);
      // Refetch holidays for the current year
      fetchHolidays(currentDate.getFullYear());
    });

    return () => {
      socket.off('holiday-created');
      socket.off('holiday-updated');
      socket.off('holiday-deleted');
      disconnectSocket();
    };
  }, [currentDate.getFullYear(), fetchHolidays]);

  useEffect(() => {
    fetchHolidays(currentDate.getFullYear());
  }, [currentDate.getFullYear(), fetchHolidays]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const monthNames = useMemo(() => [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ], []);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Get upcoming holidays for notification - memoized to prevent recalculation
  const upcomingHolidays = useMemo(() => {
    const today = new Date();
    return holidays.filter(h => {
      const holidayDate = new Date(h.date);
      const diffTime = holidayDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    });
  }, [holidays]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      {/* Holiday Notification Banner */}
      {showNotification && upcomingHolidays.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6 animate-in slide-in-from-top">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">
                Upcoming Holiday{upcomingHolidays.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-amber-700">
                {upcomingHolidays.map(h => h.name).join(', ')}
              </p>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-amber-600" />
            </button>
          </div>
        </div>
      )}

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        {holidays.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{holidays.length} holiday{holidays.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Holidays Grid */}
      {holidays.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-semibold text-lg">No holidays this month</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Check another month or wait for upcoming holidays</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {holidays.map((holiday) => {
            const holidayDate = new Date(holiday.date);
            const isPast = holidayDate < new Date();
            const isToday = holidayDate.toDateString() === new Date().toDateString();
            const daysUntil = Math.ceil((holidayDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            
            return (
              <div
                key={holiday._id}
                className={`group relative bg-white dark:bg-slate-800 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${
                  isToday
                    ? 'border-amber-400 shadow-amber-100 ring-2 ring-amber-200'
                    : isPast
                    ? 'border-slate-200 dark:border-slate-700 opacity-60'
                    : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-blue-100'
                }`}
              >
                {/* Status Badge */}
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold ${
                  isToday
                    ? 'bg-amber-100 text-amber-700'
                    : isPast
                    ? 'bg-slate-100 text-slate-600'
                    : daysUntil <= 7
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {isToday ? 'Today' : isPast ? 'Past' : daysUntil <= 7 ? `In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}` : 'Upcoming'}
                </div>

                {/* Card Content */}
                <div className="p-6">
                  {/* Date Circle */}
                  <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center mb-4 ${
                    isToday
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                      : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                  }`}>
                    <span className="text-white text-2xl font-bold">
                      {holidayDate.getDate()}
                    </span>
                    <span className="text-white text-xs font-medium uppercase">
                      {holidayDate.toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                  </div>

                  {/* Holiday Name */}
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-1">
                    {holiday.name}
                  </h3>

                  {/* Full Date */}
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-3">
                    <CalendarIcon className="w-4 h-4" />
                    <span className="font-medium text-slate-900 dark:text-white">
                      {holidayDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Recurring Badge */}
                  {holiday.isRecurring && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium mb-3">
                      <Sparkles className="w-3 h-3" />
                      <span>Annual Holiday</span>
                    </div>
                  )}

                  {/* Description */}
                  {holiday.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                      {holiday.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
