// src/pages/EventDetails.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventsAPI, bookingsAPI, paymentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CalendarIcon, ClockIcon, MapPinIcon, TicketIcon, UserIcon } from '@heroicons/react/24/outline';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [error, setError] = useState('');

  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await eventsAPI.getById(String(id));
      const ev =
        response?.data?.data?.event ??
        response?.data?.event ??
        response?.data ??
        null;

      if (!ev) throw new Error('Event not found');
      setEvent(ev);

      if (ev.ticketTypes?.length) setSelectedTicket(String(ev.ticketTypes[0].id));
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);
  useEffect(() => {
    if ((!selectedTicket || selectedTicket === '') && event?.ticketTypes?.length) {
      setSelectedTicket(String(event.ticketTypes[0].id));
    }
  }, [event, selectedTicket]);

  const selectedTicketType = event?.ticketTypes?.find(t => String(t.id) === String(selectedTicket));
  const subtotal = selectedTicketType ? Number(selectedTicketType.price) * Number(quantity || 0) : 0;
  const serviceFee = Math.round(subtotal * 0.02);
  const finalAmount = subtotal + serviceFee;

  const normalizePhone = (raw) => {
    if (!raw) return '';
    let s = String(raw).trim();
    if (s.startsWith('+')) s = s.substring(1);
    if (s.startsWith('0')) s = `254${s.slice(1)}`;
    return s;
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return navigate('/login', { state: { from: `/events/${id}` } });
    if (!selectedTicket) return alert('Select a ticket type');
    const cleaned = phoneNumber.replace(/\s+/g, '');
    if (!/^(\+?254|0)7\d{8}$/.test(cleaned)) return alert('Enter a valid M-Pesa number');
    const normalizedPhone = normalizePhone(cleaned);
    const qty = Math.max(1, Math.floor(Number(quantity) || 1));
    if (selectedTicketType && Number(selectedTicketType.quantity) < qty) return alert(`Only ${selectedTicketType.quantity} tickets available`);

    setBookingLoading(true);
    try {
      const bookingResp = await bookingsAPI.create({
        eventId: String(event.id),
        ticketTypeId: String(selectedTicketType.id),
        quantity: qty
      });
      const booking = bookingResp?.data?.data?.booking ?? bookingResp?.data?.booking ?? bookingResp?.data ?? null;
      if (!booking?.id) throw new Error('Booking failed');

      const payResp = await paymentsAPI.initiate({
        bookingId: booking.id,
        phoneNumber: normalizedPhone,
        amount: finalAmount
      });

      const payData = payResp?.data?.data ?? payResp?.data ?? {};
      const paymentUrl = payData?.paymentUrl || payData?.redirectUrl || null;

      if (paymentUrl) return window.location.href = paymentUrl;
      alert('Payment initiated. Complete the M-Pesa prompt on your phone.');
      navigate('/my-bookings', { replace: true });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || err?.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading event…</div>;
  if (error || !event) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white px-4">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Event Not Found</h1>
        <p className="text-gray-300">{error || 'The event could not be loaded.'}</p>
        <Link to="/events" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl transition">Browse Events</Link>
      </div>
    </div>
  );

  const formatDate = date => new Date(date).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const formatTime = date => new Date(date).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-16 px-4 md:px-8">
      {/* Event Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-4xl font-bold">{event.title}</h1>
        <p className="text-gray-400 mt-1">Organized by <span className="font-semibold">{event.organizer?.name}</span></p>
        <span className="inline-block bg-green-800 text-green-200 px-3 py-1 rounded-full text-sm mt-2">{event.category}</span>
      </div>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="overflow-hidden rounded-2xl shadow-lg animate-fadeIn">
            <img src={event.imageUrl || '/placeholder.png'} alt={event.title} className="w-full h-96 object-cover" />
          </div>

          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg animate-fadeIn">
            <h2 className="text-2xl font-bold mb-4">About This Event</h2>
            <p className="text-gray-300 leading-relaxed">{event.description}</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg animate-fadeIn">
            <h2 className="text-2xl font-bold mb-4">Event Details</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-green-400" />
                <div>
                  <p className="font-semibold">{formatDate(event.startTime)}</p>
                  <p className="text-gray-400 text-sm">{formatTime(event.startTime)} - {formatTime(event.endTime)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-5 w-5 text-green-400" />
                <div>
                  <p className="font-semibold">{event.venue}</p>
                  <p className="text-gray-400 text-sm">{event.city ?? 'Nairobi, Kenya'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Card */}
        <aside className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg sticky top-24 animate-fadeIn">
            <h3 className="text-xl font-bold mb-4">Get Your Tickets</h3>

            {!showBookingForm ? (
              <>
                <label className="block text-sm font-medium mb-2">Select Ticket Type</label>
                <select
                  value={selectedTicket}
                  onChange={e => { setSelectedTicket(e.target.value); setQuantity(1); }}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-green-400 mb-4"
                >
                  {event.ticketTypes?.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} - KES {Number(t.price).toLocaleString()} ({t.quantity} left)
                    </option>
                  ))}
                </select>

                {selectedTicketType && (
                  <>
                    <label className="block text-sm font-medium mb-2">Quantity</label>
                    <select
                      value={quantity}
                      onChange={e => setQuantity(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-green-400 mb-4"
                    >
                      {Array.from({ length: Math.min(10, selectedTicketType.quantity) }, (_, i) => i+1)
                        .map(n => <option key={n} value={n}>{n} {n>1 ? 'tickets':'ticket'}</option>)
                      }
                    </select>

                    <div className="bg-gray-900 rounded-xl p-4 mb-4 border border-green-600">
                      <div className="flex justify-between mb-2"><span>Subtotal:</span><span>KES {subtotal.toLocaleString()}</span></div>
                      <div className="flex justify-between text-sm"><span>Service fee (2%):</span><span>KES {serviceFee.toLocaleString()}</span></div>
                      <div className="border-t mt-2 pt-2 flex justify-between font-bold text-green-400"><span>Total:</span><span>KES {finalAmount.toLocaleString()}</span></div>
                    </div>

                    <button
                      onClick={() => setShowBookingForm(true)}
                      className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 animate-bounce"
                    >
                      Proceed to Payment
                    </button>
                  </>
                )}
              </>
            ) : (
              <form onSubmit={handleBooking} className="space-y-4">
                <label className="block text-sm font-medium">M-Pesa Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="2547XXXXXXXX or 07XXXXXXXX"
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-green-400"
                  required
                />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowBookingForm(false)} className="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded-xl transition">Back</button>
                  <button type="submit" disabled={bookingLoading} className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-xl font-semibold transition-all transform hover:scale-105">
                    {bookingLoading ? 'Processing…' : `Pay KES ${finalAmount.toLocaleString()}`}
                  </button>
                </div>
              </form>
            )}

            {!isAuthenticated && <div className="mt-4 text-center text-gray-400 text-sm">Please <Link to="/login" className="underline text-green-400">sign in</Link> to book tickets</div>}
          </div>

          <div className="bg-gray-800 rounded-2xl p-6 shadow-lg animate-fadeIn">
            <h4 className="font-semibold mb-2 flex items-center gap-2"><UserIcon className="h-5 w-5 text-green-400"/> Organizer</h4>
            <p className="font-medium">{event.organizer?.name}</p>
            <p className="text-gray-400 text-sm">{event.organizer?.email}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
