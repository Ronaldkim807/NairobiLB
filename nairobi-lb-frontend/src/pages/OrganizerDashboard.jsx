// src/pages/OrganizerDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api, { organizerAPI } from '../services/api';
import { CSVLink } from 'react-csv';
import {
  HomeIcon,
  CalendarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  TicketIcon,
  CheckCircleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import '../styles/organizerDashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState('');
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [revenueByMonth, setRevenueByMonth] = useState([]);
  const [topEvents, setTopEvents] = useState([]);

  // Fetch organizer events
  useEffect(() => {
    fetchOrganizerEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrganizerEvents = async () => {
    try {
      setLoading(true);
      setInsightsLoading(true);
      setError('');
      setInsightsError('');

      const [eventsResp, insightsResp] = await Promise.all([
        api.get('/events/organizer/my-events'),
        organizerAPI.insights()
      ]);

      const data = eventsResp?.data?.data?.events ?? eventsResp?.data?.events ?? [];
      setEvents(Array.isArray(data) ? data : []);

      const insights = insightsResp?.data?.data ?? {};
      setRecentBookings(Array.isArray(insights.recentBookings) ? insights.recentBookings : []);
      setRecentPayments(Array.isArray(insights.recentPayments) ? insights.recentPayments : []);
      setRevenueByMonth(Array.isArray(insights.revenueByMonth) ? insights.revenueByMonth : []);
      setTopEvents(Array.isArray(insights.topEvents) ? insights.topEvents : []);
    } catch (err) {
      console.error(err);
      setError('Failed to load events.');
      setInsightsError('Failed to load insights.');
      setEvents([]);
    } finally {
      setLoading(false);
      setInsightsLoading(false);
    }
  };

  // Stats computation
  const stats = useMemo(() => {
    const totalEvents = events.length;
    const activeEvents = events.filter(e => e.isActive || e.status?.toLowerCase() === 'active').length;
    const totalBookings = events.reduce((sum, e) => sum + (e._count?.bookings || 0), 0);
    const totalRevenue = events.reduce((sum, e) => {
      const rev = typeof e.revenue === 'number' ? e.revenue : e.estimatedRevenue || 0;
      return sum + rev;
    }, 0);
    const revenueAvailable = events.some(e => typeof e.revenue === 'number' || typeof e.estimatedRevenue === 'number');
    return { totalEvents, activeEvents, totalBookings, totalRevenue, revenueAvailable };
  }, [events]);

  // Event actions
  const handleEdit = (id) => navigate(`/organizer/edit/${id}`);
  const handleViewBookings = (id) => navigate(`/organizer/event/${id}/bookings`);
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event permanently?')) return;
    try {
      setDeletingId(id);
      await api.delete(`/events/${id}`);
      await fetchOrganizerEvents();
      alert('Event deleted.');
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  };

  // CSV data
  const csvData = events.map(e => ({
    Title: e.title,
    Date: new Date(e.startTime).toLocaleDateString(),
    Status: e.isActive || e.status?.toLowerCase() === 'active' ? 'Active' : e.status ?? 'Inactive',
    Bookings: e._count?.bookings ?? 0,
    Revenue: typeof e.revenue === 'number' ? e.revenue : e.estimatedRevenue || 0
  }));

  // Chart data
  const chartData = {
    labels: events.map(e => e.title),
    datasets: [
      {
        label: 'Bookings',
        data: events.map(e => e._count?.bookings ?? 0),
        backgroundColor: 'rgba(59, 130, 246, 0.65)',
      },
      {
        label: 'Revenue (KES)',
        data: events.map(e => typeof e.revenue === 'number' ? e.revenue : e.estimatedRevenue || 0),
        backgroundColor: 'rgba(34, 211, 238, 0.55)',
      }
    ]
  };

  const revenueChartData = {
    labels: revenueByMonth.map((item) => {
      const [year, month] = item.month.split('-');
      const d = new Date(Number(year), Number(month) - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }),
    datasets: [
      {
        label: 'Revenue (KES)',
        data: revenueByMonth.map((item) => Number(item.total || 0)),
        backgroundColor: 'rgba(34, 211, 238, 0.5)',
      }
    ]
  };

  const revenueChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: '#cbd5f5' } },
      title: { display: true, text: 'Revenue by Month', color: '#e2e8f0' }
    },
    scales: {
      x: { ticks: { color: '#cbd5f5' }, grid: { color: 'rgba(148,163,184,0.2)' } },
      y: { ticks: { color: '#cbd5f5' }, grid: { color: 'rgba(148,163,184,0.2)' } }
    }
  };

  const activityTimeline = useMemo(() => {
    const bookingItems = recentBookings.map((b) => ({
      id: `booking-${b.id}`,
      type: 'booking',
      title: b.event?.title || 'Event booking',
      subtitle: `${b.user?.name || b.user?.email || 'Guest'} · ${b.ticketType?.name || 'Ticket'}`,
      amount: b.totalAmount ? `KES ${Number(b.totalAmount).toLocaleString()}` : null,
      time: b.createdAt ? new Date(b.createdAt) : null
    }));

    const paymentItems = recentPayments.map((p) => ({
      id: `payment-${p.id}`,
      type: 'payment',
      title: p.booking?.event?.title || 'Payment received',
      subtitle: p.booking?.user?.name || p.booking?.user?.email || 'Customer',
      amount: p.amount ? `KES ${Number(p.amount).toLocaleString()}` : null,
      time: p.createdAt ? new Date(p.createdAt) : null
    }));

    return [...bookingItems, ...paymentItems]
      .filter((item) => item.time)
      .sort((a, b) => b.time - a.time)
      .slice(0, 10);
  }, [recentBookings, recentPayments]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: '#cbd5f5' } },
      title: { display: true, text: 'Events Analytics', color: '#e2e8f0' }
    },
    scales: {
      x: { ticks: { color: '#cbd5f5' }, grid: { color: 'rgba(148,163,184,0.2)' } },
      y: { ticks: { color: '#cbd5f5' }, grid: { color: 'rgba(148,163,184,0.2)' } }
    }
  };

  return (
    <div className="organizer-shell min-h-screen text-slate-100">
      {/* Sidebar */}
      <aside className="organizer-sidebar hidden lg:flex">
        <div className="organizer-brand">
          <div className="organizer-brand-icon">
            <HomeIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Organizer</p>
            <p className="text-xl font-semibold">Studio</p>
          </div>
        </div>

        <nav className="organizer-nav">
          <Link to="/organizer" className="organizer-link active">
            <HomeIcon className="h-5 w-5" /> Dashboard
          </Link>
          <Link to="/create-event" className="organizer-link">
            <CalendarIcon className="h-5 w-5" /> Create Event
          </Link>
          <Link to="/organizer/analytics" className="organizer-link">
            <ChartBarIcon className="h-5 w-5" /> Analytics
          </Link>
          <Link to="/organizer/manage-tickets" className="organizer-link">
            <TicketIcon className="h-5 w-5" /> Tickets
          </Link>
          <Link to="/organizer/settings" className="organizer-link">
            <Cog6ToothIcon className="h-5 w-5" /> Settings
          </Link>
        </nav>

        <div className="organizer-profile">
          <p className="text-xs text-slate-400">Signed in as</p>
          <p className="font-semibold">{user?.name}</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="organizer-main">
        <section className="organizer-hero">
          <div>
            <p className="organizer-pill">Organizer Command</p>
            <h1 className="text-3xl md:text-4xl font-semibold">Welcome back, {user?.name || 'Organizer'}.</h1>
            <p className="text-slate-300 mt-2 max-w-2xl">
              Track your events, monitor revenue, and keep everything running smoothly.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate('/create-event')} className="organizer-cta">
              Create Event
            </button>
            <button onClick={fetchOrganizerEvents} className="organizer-ghost">
              Refresh
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[
            { label: 'Total Events', value: stats.totalEvents, icon: CalendarIcon, tone: 'tone-indigo' },
            { label: 'Active Events', value: stats.activeEvents, icon: CheckCircleIcon, tone: 'tone-emerald' },
            { label: 'Total Bookings', value: stats.totalBookings, icon: TicketIcon, tone: 'tone-amber' },
            { label: 'Revenue', value: stats.revenueAvailable ? `KES ${stats.totalRevenue.toLocaleString()}` : 'N/A', icon: CurrencyDollarIcon, tone: 'tone-cyan' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className={`organizer-card ${stat.tone}`}
            >
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{stat.label}</p>
                <p className="text-2xl font-semibold mt-2">{stat.value}</p>
              </div>
              <stat.icon className="h-8 w-8" />
            </motion.div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[1.2fr,0.8fr] gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="organizer-panel"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Revenue Overview</h3>
              <CSVLink data={csvData} filename="events.csv" className="organizer-ghost">
                Export CSV
              </CSVLink>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-slate-300">Available to withdraw</p>
                <p className="text-xl font-semibold text-emerald-300">
                  {stats.revenueAvailable ? `KES ${stats.totalRevenue.toLocaleString()}` : 'KES 0'}
                </p>
              </div>
              <button className="organizer-withdraw" disabled>
                Withdraw (coming soon)
              </button>
              <p className="text-xs text-slate-500">
                Withdrawals will be enabled after payout verification is complete.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="organizer-panel"
          >
            <h3 className="text-lg font-semibold mb-4">Events Analytics</h3>
            <Bar data={chartData} options={chartOptions} />
          </motion.div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[0.7fr,1.3fr] gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="organizer-panel"
          >
            <h3 className="text-lg font-semibold mb-4">Top Events</h3>
            {insightsLoading ? (
              <p className="text-slate-400">Loading leaderboard…</p>
            ) : insightsError ? (
              <p className="text-rose-300">{insightsError}</p>
            ) : topEvents.length === 0 ? (
              <p className="text-slate-400">No revenue data yet.</p>
            ) : (
              <div className="space-y-3">
                {topEvents.map((ev, idx) => (
                  <div key={ev.id} className="organizer-leader">
                    <div className="organizer-rank">{idx + 1}</div>
                    <div className="flex-1">
                      <p className="font-semibold">{ev.title}</p>
                      <p className="text-xs text-slate-400">{ev.count} payments</p>
                    </div>
                    <p className="text-emerald-300 font-semibold">KES {Number(ev.total || 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="organizer-panel"
          >
            <h3 className="text-lg font-semibold mb-4">Revenue by Month</h3>
            {insightsLoading ? (
              <p className="text-slate-400">Loading revenue chart…</p>
            ) : revenueByMonth.length === 0 ? (
              <p className="text-slate-400">No revenue yet.</p>
            ) : (
              <Bar data={revenueChartData} options={revenueChartOptions} />
            )}
          </motion.div>
        </section>

        <section className="organizer-panel">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <span className="text-xs text-slate-500">Bookings & payments</span>
          </div>
          {insightsLoading ? (
            <p className="text-slate-400">Loading activity…</p>
          ) : activityTimeline.length === 0 ? (
            <p className="text-slate-400">No recent activity yet.</p>
          ) : (
            <div className="organizer-timeline">
              {activityTimeline.map((item) => (
                <div key={item.id} className={`organizer-activity ${item.type}`}>
                  <div className="organizer-activity-dot" />
                  <div className="organizer-activity-body">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs text-slate-400">{item.subtitle}</p>
                  </div>
                  <div className="text-right">
                    {item.amount && <p className="text-emerald-300 text-sm font-semibold">{item.amount}</p>}
                    <p className="text-xs text-slate-500">
                      {item.time?.toLocaleString() || '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="organizer-panel">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Your Events</h3>
            <button onClick={() => navigate('/organizer/analytics')} className="organizer-ghost">
              View Analytics
            </button>
          </div>
          {loading ? (
            <p className="text-slate-400">Loading events…</p>
          ) : error ? (
            <p className="text-rose-300">{error}</p>
          ) : events.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No events yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {events.map((ev) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="organizer-event"
                >
                  <div>
                    <h4 className="text-lg font-semibold">{ev.title}</h4>
                    <p className="text-sm text-slate-400">{new Date(ev.startTime).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`organizer-status ${ev.isActive || ev.status?.toLowerCase() === 'active' ? 'active' : 'inactive'}`}>
                      {ev.isActive || ev.status?.toLowerCase() === 'active' ? 'Active' : ev.status ?? 'Inactive'}
                    </span>
                    <span className="organizer-badge">{ev._count?.bookings ?? 0} bookings</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button onClick={() => handleViewBookings(ev.id)} className="organizer-action action-blue">Bookings</button>
                    <button onClick={() => handleEdit(ev.id)} className="organizer-action action-indigo">Edit</button>
                    <button onClick={() => handleDelete(ev.id)} disabled={deletingId === ev.id} className="organizer-action action-rose">
                      {deletingId === ev.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <div className="text-center">
          <button onClick={() => navigate('/organizer')} className="organizer-cta">
            Back to Organizer Panel
          </button>
        </div>
      </main>
    </div>
  );
}
