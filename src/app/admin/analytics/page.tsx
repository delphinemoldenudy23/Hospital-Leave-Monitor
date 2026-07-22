import dynamic from 'next/dynamic';

const LeaveAnalytics = dynamic(() => import('@/components/LeaveAnalytics'), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  ),
  ssr: false
});

export default function AnalyticsPage() {
  return <LeaveAnalytics />;
}
