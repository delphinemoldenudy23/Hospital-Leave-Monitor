'use client';

import HolidayCalendar from '@/components/HolidayCalendar';

export default function EmployeeHolidaysPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Holidays</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">View company holidays and special dates</p>
      </div>
      <HolidayCalendar isAdmin={false} />
    </div>
  );
}
