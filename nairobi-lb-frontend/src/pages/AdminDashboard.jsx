import React, { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import { CSVLink } from 'react-csv';
import { Bar } from 'react-chartjs-2';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';
import '../styles/adminDashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

const currency = (value) => {
  const amount = Number(value || 0);
  if (Number.isNaN(amount)) return 'KES 0';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function AdminDashboard() {
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const [
          dashboardRes,
          usersRes,
          eventsRes,
          paymentsRes,
        ] = await Promise.all([
          adminAPI.dashboard(),
          adminAPI.users({ page: 1, limit: 200 }),
          adminAPI.events({ page: 1, limit: 200 }),
          adminAPI.payments({ page: 1, limit: 200 }),
        ]);

        if (!active) return;

        const dashboardData = dashboardRes?.data?.data ?? null;
        setDashboard(dashboardData);
        setRecentBookings(dashboardData?.recentBookings ?? []);
        setUsers(usersRes?.data?.data?.users ?? []);
        setEvents(eventsRes?.data?.data?.events ?? []);
        setPayments(paymentsRes?.data?.data?.payments ?? []);
      } catch (err) {
        if (!active) return;
        setError(
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load admin data.'
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const handleRoleChange = async (userId, role) => {
    setActionLoading((prev) => ({ ...prev, [`role-${userId}`]: true }));
    try {
      await adminAPI.updateUserRole(userId, role);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update role.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`role-${userId}`]: false }));
    }
  };

  const handleToggleEvent = async (eventId) => {
    setActionLoading((prev) => ({ ...prev, [`event-${eventId}`]: true }));
    try {
      const res = await adminAPI.toggleEventActive(eventId);
      const updatedEvent = res?.data?.data?.event;
      if (updatedEvent) {
        setEvents((prev) =>
          prev.map((evt) => (evt.id === eventId ? updatedEvent : evt))
        );
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to toggle event.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`event-${eventId}`]: false }));
    }
  };

  const handleDeleteEvent = async (eventId) => {
    const ok = window.confirm('Delete this event? This cannot be undone.');
    if (!ok) return;

    setActionLoading((prev) => ({ ...prev, [`delete-${eventId}`]: true }));
    try {
      await adminAPI.deleteEvent(eventId);
      setEvents((prev) => prev.filter((evt) => evt.id !== eventId));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete event.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`delete-${eventId}`]: false }));
    }
  };

  const handlePaymentStatus = async (paymentId, status) => {
    setActionLoading((prev) => ({ ...prev, [`payment-${paymentId}`]: true }));
    try {
      await adminAPI.updatePaymentStatus(paymentId, status);
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, status } : p))
      );
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update payment.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`payment-${paymentId}`]: false }));
    }
  };

  const stats = dashboard?.stats || {
    totalEvents: 0,
    totalBookings: 0,
    totalUsers: 0,
    totalRevenue: 0,
  };

  const chartData = useMemo(() => {
    const entries = dashboard?.eventsByCategory ?? [];
    const labels = entries.map((item) => item.category);
    const values = entries.map((item) => item?._count?.id ?? 0);

    return {
      labels,
      datasets: [
        {
          label: 'Active Events',
          data: values,
          backgroundColor: ['#38bdf8', '#22c55e', '#f97316', '#facc15', '#a855f7'],
          borderRadius: 10,
          borderSkipped: false,
        },
      ],
    };
  }, [dashboard]);

  const usersCsv = useMemo(
    () =>
      users.map((u) => ({
        id: u.id,
        name: u.name || 'N/A',
        email: u.email,
        role: u.role,
        createdAt: moment(u.createdAt).format('YYYY-MM-DD HH:mm'),
        updatedAt: moment(u.updatedAt).format('YYYY-MM-DD HH:mm'),
        organizedEvents: u._count?.organizedEvents ?? 0,
        bookings: u._count?.bookings ?? 0,
      })),
    [users]
  );

  const eventsCsv = useMemo(
    () =>
      events.map((evt) => ({
        id: evt.id,
        title: evt.title,
        category: evt.category,
        venue: evt.venue,
        city: evt.city,
        startTime: moment(evt.startTime).format('YYYY-MM-DD HH:mm'),
        endTime: moment(evt.endTime).format('YYYY-MM-DD HH:mm'),
        capacity: evt.capacity,
        isActive: evt.isActive ? 'Active' : 'Inactive',
        organizer: evt.organizer?.email || 'N/A',
        bookings: evt._count?.bookings ?? 0,
      })),
    [events]
  );

  const paymentsCsv = useMemo(
    () =>
      payments.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        provider: payment.provider,
        phoneNumber: payment.phoneNumber || 'N/A',
        eventTitle: payment.booking?.event?.title || 'N/A',
        userEmail: payment.booking?.user?.email || 'N/A',
        ticketType: payment.booking?.ticketType?.name || 'N/A',
        createdAt: moment(payment.createdAt).format('YYYY-MM-DD HH:mm'),
      })),
    [payments]
  );

  return (
    <div className="admin-shell min-h-screen pt-16 pb-12 text-slate-100 bg-slate-950">
      <section className="admin-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs admin-pill mb-3">
                Admin Control Center
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                Welcome back, {user?.name || 'Admin'}.
              </h1>
              <p className="text-slate-300 mt-2 max-w-2xl">
                Monitor platform health, manage users, and export data for deeper analysis.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <CSVLink
                data={usersCsv}
                filename="nairobiLB-users.csv"
                className="px-4 py-2 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-100 hover:bg-sky-500/30"
              >
                Export Users CSV
              </CSVLink>
              <CSVLink
                data={eventsCsv}
                filename="nairobiLB-events.csv"
                className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 hover:bg-emerald-500/30"
              >
                Export Events CSV
              </CSVLink>
              <CSVLink
                data={paymentsCsv}
                filename="nairobiLB-payments.csv"
                className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-100 hover:bg-amber-500/30"
              >
                Export Payments CSV
              </CSVLink>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-8">
        {error && (
          <div className="admin-card rounded-xl px-4 py-3 text-rose-200 border border-rose-500/40">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Total Events', value: stats.totalEvents },
            { label: 'Total Bookings', value: stats.totalBookings },
            { label: 'Total Users', value: stats.totalUsers },
            { label: 'Total Revenue', value: currency(stats.totalRevenue) },
          ].map((stat) => (
            <div key={stat.label} className="admin-card rounded-2xl p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
              <p className="text-2xl font-semibold mt-2">{stat.value}</p>
              <p className="text-slate-400 text-sm mt-1">Live platform totals</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,0.8fr] gap-6">
          <div className="admin-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Active Events by Category</h2>
              <span className="admin-mono text-xs text-slate-400">Live</span>
            </div>
            {chartData.labels.length === 0 ? (
              <p className="text-slate-400">No active events data available.</p>
            ) : (
              <div className="h-72">
                <Bar
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { ticks: { color: '#cbd5f5' }, grid: { color: 'rgba(148,163,184,0.15)' } },
                      y: { ticks: { color: '#cbd5f5' }, grid: { color: 'rgba(148,163,184,0.15)' } },
                    },
                  }}
                />
              </div>
            )}
          </div>

          <div className="admin-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Bookings</h2>
            <div className="space-y-4">
              {recentBookings.length === 0 && (
                <p className="text-slate-400">No recent bookings yet.</p>
              )}
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{booking.event?.title || 'Event'}</p>
                    <p className="text-sm text-slate-400">
                      {booking.user?.name || booking.user?.email || 'Guest'} · {booking.ticketType?.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {moment(booking.createdAt).format('MMM DD, YYYY HH:mm')}
                    </p>
                  </div>
                  <span className="admin-mono text-xs px-2 py-1 rounded-lg bg-slate-800/70 border border-slate-600/40">
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">User & Role Management</h2>
            <span className="text-sm text-slate-400">{users.length} users</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm admin-table">
              <thead>
                <tr className="text-left text-slate-300">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Bookings</th>
                  <th className="px-4 py-3">Organizer Events</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-800/60">
                    <td className="px-4 py-3">{u.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-300">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        className="bg-slate-900/70 border border-slate-700 rounded-lg px-2 py-1"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={actionLoading[`role-${u.id}`]}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="ORGANIZER">ORGANIZER</option>
                        <option value="USER">USER</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">{u._count?.bookings ?? 0}</td>
                    <td className="px-4 py-3">{u._count?.organizedEvents ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Event Operations</h2>
            <span className="text-sm text-slate-400">{events.length} events</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm admin-table">
              <thead>
                <tr className="text-left text-slate-300">
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Bookings</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt) => (
                  <tr key={evt.id} className="border-b border-slate-800/60">
                    <td className="px-4 py-3">
                      <p className="font-medium">{evt.title}</p>
                      <p className="text-xs text-slate-400">{evt.venue}</p>
                    </td>
                    <td className="px-4 py-3">{evt.category}</td>
                    <td className="px-4 py-3">{evt._count?.bookings ?? 0}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs ${
                          evt.isActive
                            ? 'bg-emerald-500/20 text-emerald-200'
                            : 'bg-rose-500/20 text-rose-200'
                        }`}
                      >
                        {evt.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex flex-wrap gap-2">
                      <Link
                        to={`/organizer/edit/${evt.id}`}
                        className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-100 border border-indigo-400/40 hover:bg-indigo-500/30"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/organizer/event/${evt.id}/bookings`}
                        className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-100 border border-cyan-400/40 hover:bg-cyan-500/30"
                      >
                        View Bookings
                      </Link>
                      <button
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700"
                        onClick={() => handleToggleEvent(evt.id)}
                        disabled={actionLoading[`event-${evt.id}`]}
                      >
                        Toggle
                      </button>
                      <button
                        className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-200 border border-rose-400/40 hover:bg-rose-500/30"
                        onClick={() => handleDeleteEvent(evt.id)}
                        disabled={actionLoading[`delete-${evt.id}`]}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Payment Reconciliation</h2>
            <span className="text-sm text-slate-400">{payments.length} payments</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm admin-table">
              <thead>
                <tr className="text-left text-slate-300">
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-800/60">
                    <td className="px-4 py-3">{payment.booking?.event?.title || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-300">{payment.booking?.user?.email || 'N/A'}</td>
                    <td className="px-4 py-3">{currency(payment.amount)}</td>
                    <td className="px-4 py-3">
                      <span className="admin-mono text-xs px-2 py-1 rounded-lg bg-slate-800/70 border border-slate-600/40">
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="bg-slate-900/70 border border-slate-700 rounded-lg px-2 py-1"
                        value={payment.status}
                        onChange={(e) => handlePaymentStatus(payment.id, e.target.value)}
                        disabled={actionLoading[`payment-${payment.id}`]}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="SUCCESS">SUCCESS</option>
                        <option value="FAILED">FAILED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {loading && (
          <div className="text-center text-slate-400">Loading admin data...</div>
        )}
      </div>
    </div>
  );
}
