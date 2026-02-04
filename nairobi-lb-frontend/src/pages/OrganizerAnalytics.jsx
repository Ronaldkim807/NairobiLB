import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { CurrencyDollarIcon, TicketIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function OrganizerAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/organizer/analytics'); // ✅ correct route
      setStats(res.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8 text-gray-600">Loading analytics…</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!stats) return <div className="p-8 text-gray-600">No analytics available.</div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-16 px-6">
      <h1 className="text-3xl font-bold mb-6">Event Analytics</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Revenue" value={`KES ${Number(stats.totalRevenue || 0).toLocaleString()}`} icon={<CurrencyDollarIcon className="h-8 w-8 text-green-600" />} />
        <StatCard title="Total Tickets Sold" value={Number(stats.totalTickets || 0)} icon={<TicketIcon className="h-8 w-8 text-blue-600" />} />
        <StatCard title="Conversion Rate" value={`${Number(stats.conversionRate || 0)}%`} icon={<ChartBarIcon className="h-8 w-8 text-purple-600" />} />
      </div>

      {/* Revenue by Event */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue by Event</h3>
        {stats.events?.length === 0 ? (
          <p className="text-gray-500">No events found.</p>
        ) : (
          <ul className="space-y-3">
            {stats.events?.map((ev) => (
              <li key={ev.id} className="flex justify-between border-b pb-2">
                <span>{ev.title}</span>
                <span className="font-semibold">KES {Number(ev.revenue || 0).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* StatCard component */
const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm flex justify-between items-center">
    <div>
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
    <span className="text-3xl">{icon}</span>
  </div>
);
