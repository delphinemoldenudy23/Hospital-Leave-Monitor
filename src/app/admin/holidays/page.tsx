'use client';

import HolidayManagement from '@/components/HolidayManagement';

export default function HolidaysPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Holidays</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Manage company holidays and special dates</p>
      </div>
      <HolidayManagement />
    </div>
  );
}
