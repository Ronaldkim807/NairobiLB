import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { TicketIcon } from '@heroicons/react/24/outline';

export default function ViewBookings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEventAndBookings();
  }, [id]);

  const fetchEventAndBookings = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`/organizer/events/${id}/bookings`);
      const payload = response?.data?.data ?? {};
      setEvent(payload.event || null);
      setBookings(Array.isArray(payload.bookings) ? payload.bookings : []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/organizer')}
            className="text-primary-600 hover:text-primary-800 mb-4 inline-flex items-center"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Event Bookings</h1>
          {event && (
            <p className="text-gray-600 mt-2">
              Bookings for: <strong>{event.title}</strong>
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Bookings</h3>
            <p className="text-gray-600 mt-1">View and manage bookings for this event</p>
          </div>

          <div className="p-6">
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <TicketIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-600">
                  Bookings will appear here once attendees start booking tickets for this event.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {booking.user?.name || 'Anonymous User'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {booking.user?.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          Booked on {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {booking.quantity} ticket{booking.quantity > 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-gray-600">
                        {booking.ticketType?.name}
                      </p>
                      <p className="text-sm font-medium text-green-600">
                        KES {booking.totalAmount?.toLocaleString()}
                      </p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${
                        booking.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
