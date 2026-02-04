// src/pages/BookEvent.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventsAPI, bookingsAPI, paymentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TicketIcon, CurrencyDollarIcon, CalendarIcon } from '@heroicons/react/24/outline';

export default function BookEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [ticketTypeId, setTicketTypeId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadEvent = async () => {
    try {
      const res = await eventsAPI.getById(id);
      const ev = res?.data?.data?.event ?? res?.data?.event ?? null;
      setEvent(ev);
      if (ev?.ticketTypes?.length) setTicketTypeId(ev.ticketTypes[0].id);
    } catch (err) {
      console.error(err);
      setError('Failed to load event');
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: `/events/${id}/book` } });
      return;
    }
    if (!ticketTypeId) {
      setError('Select a ticket type');
      return;
    }
    const qty = parseInt(quantity, 10);
    if (Number.isNaN(qty) || qty <= 0) {
      setError('Quantity must be positive');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // create booking
      const bookingRes = await bookingsAPI.create({ eventId: id, ticketTypeId, quantity: qty });
      const booking = bookingRes?.data?.data?.booking ?? bookingRes?.data?.booking;
      if (!booking) throw new Error('Booking failed');

      // initiate payment
      try {
        const payRes = await paymentsAPI.initiate({ bookingId: booking.id, amount: booking.totalAmount });
        const paymentUrl = payRes?.data?.data?.paymentUrl ?? payRes?.data?.paymentUrl;
        if (paymentUrl) return window.location.href = paymentUrl;
        navigate('/my-bookings');
      } catch {
        navigate('/my-bookings');
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  if (!event) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">{error || 'Loading event...'}</div>;
  }

  const selectedTicket = event.ticketTypes.find(tt => tt.id === ticketTypeId);
  const totalPrice = selectedTicket ? Number(selectedTicket.price) * Number(quantity || 0) : 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-16 px-4 md:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Event Info */}
        <div className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3">
              <img
                src={event.imageUrl || '/placeholder.png'}
                alt={event.title}
                className="w-full h-64 object-cover md:h-full"
              />
            </div>
            <div className="md:flex-1 p-6 space-y-4">
              <h1 className="text-3xl font-bold">{event.title}</h1>
              <p className="text-gray-300 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" /> {new Date(event.startTime).toLocaleString()}
              </p>
              <p className="text-gray-400">{event.description}</p>

              {/* Booking Form */}
              <form onSubmit={handleBook} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ticket Type</label>
                  <select
                    value={ticketTypeId || ''}
                    onChange={(e) => setTicketTypeId(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {event.ticketTypes.map(tt => (
                      <option key={tt.id} value={tt.id}>
                        {tt.name} — KES {Number(tt.price).toLocaleString()} ({tt.quantity} left)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedTicket?.quantity || 1}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-32 px-3 py-2 rounded-xl bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="pt-2 text-gray-300">
                  Total: <span className="font-bold text-lg">KES {totalPrice.toLocaleString()}</span>
                </div>

                {error && <p className="text-red-500">{error}</p>}

                <div className="flex gap-4 mt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold transition"
                  >
                    {loading ? 'Booking…' : 'Book & Pay'}
                  </button>
                  <Link
                    to={`/events/${id}`}
                    className="px-6 py-3 border border-gray-600 rounded-xl hover:bg-gray-700 transition"
                  >
                    Back
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Event Details & Ticket Types */}
        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
          <h2 className="text-2xl font-bold">Ticket Types</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {event.ticketTypes.map(tt => (
              <div key={tt.id} className="bg-gray-700 rounded-xl p-4 flex justify-between items-center hover:scale-105 transition">
                <div>
                  <p className="font-semibold">{tt.name}</p>
                  <p className="text-gray-300">KES {Number(tt.price).toLocaleString()}</p>
                  <p className="text-gray-400 text-sm">{tt.quantity} tickets left</p>
                </div>
                <TicketIcon className="h-8 w-8 text-orange-400" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
