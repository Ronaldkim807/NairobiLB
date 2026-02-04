// src/pages/UserDashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api, { bookingsAPI } from "../services/api";
import html2canvas from "html2canvas";
import { buildTicketPayload, generateQrDataUrl } from "../services/qrApi";
import {
  CalendarDaysIcon,
  MapPinIcon,
  TicketIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalBooking, setModalBooking] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  const ticketRef = useRef(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/bookings/my-bookings");

      let bookingsData = [];

      if (Array.isArray(res.data)) bookingsData = res.data;
      else if (Array.isArray(res.data?.data)) bookingsData = res.data.data;
      else if (Array.isArray(res.data?.bookings)) bookingsData = res.data.bookings;
      else if (Array.isArray(res.data?.data?.bookings))
        bookingsData = res.data.data.bookings;

      setBookings(bookingsData);
    } catch (err) {
      console.error(err);
      setError("Failed to load your bookings.");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const now = new Date();

  const normalizedBookings = useMemo(() => (
    bookings.map((b) => ({
      ...b,
      statusUpper: String(b.status || "").toUpperCase(),
      startTime: b.event?.startTime ? new Date(b.event.startTime) : null,
    }))
  ), [bookings]);

  const upcomingBookings = normalizedBookings.filter(
    (b) => b.startTime && b.startTime >= now && b.statusUpper !== "CANCELLED"
  );

  const pastBookings = normalizedBookings.filter(
    (b) => b.startTime && b.startTime < now
  );

  const cancelledBookings = normalizedBookings.filter(
    (b) => b.statusUpper === "CANCELLED"
  );

  const totalTickets = normalizedBookings.reduce(
    (sum, b) => sum + Number(b.quantity || b.ticketsCount || 1),
    0
  );

  const totalSpent = normalizedBookings.reduce((sum, b) => {
    const payment = Array.isArray(b.payments) ? b.payments[0] : null;
    const isSuccess = String(payment?.status || "").toUpperCase() === "SUCCESS";
    return sum + (isSuccess ? Number(payment?.amount || b.totalAmount || 0) : 0);
  }, 0);

  const nextEvent = upcomingBookings
    .sort((a, b) => a.startTime - b.startTime)[0];

  const openTicket = async (booking) => {
    setQrLoading(true);
    try {
      const payload = buildTicketPayload(booking, user);
      const qrUrl = await generateQrDataUrl(payload, 360);
      setModalBooking({
        ...booking,
        qrUrl,
        payload,
      });
    } catch (err) {
      console.error(err);
      setModalBooking({
        ...booking,
        qrUrl: null,
        payload: null,
      });
    } finally {
      setQrLoading(false);
    }
  };

  const downloadTicket = async () => {
    if (!ticketRef.current) return;

    const canvas = await html2canvas(ticketRef.current, {
      scale: 2,
      backgroundColor: "#0b0f1a",
    });

    const link = document.createElement("a");
    link.download = `ticket-${modalBooking.bookingReference || modalBooking.id}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const cancelBooking = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;

    try {
      setProcessingId(id);
      await bookingsAPI.cancel(id);
      fetchBookings();
    } catch (err) {
      alert("Failed to cancel booking.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
          Welcome, {user?.name || "User"}
          </h1>
          <p className="text-gray-400 mt-1">
            Track your events, manage tickets, and download QR passes instantly.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/events")}
            className="px-4 py-2 bg-gray-800 rounded-xl hover:bg-gray-700 transition"
          >
            Browse Events
          </button>
          <button
            onClick={() => navigate("/my-bookings")}
            className="px-4 py-2 bg-purple-600 rounded-xl hover:bg-purple-700 transition"
          >
            Manage My Bookings
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {[
          { label: "Total Bookings", value: bookings.length },
          { label: "Upcoming Events", value: upcomingBookings.length },
          { label: "Cancelled", value: cancelledBookings.length },
          { label: "Total Tickets", value: totalTickets },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700"
          >
            <p className="text-gray-400 text-sm uppercase tracking-widest">{stat.label}</p>
            <p className="text-3xl font-bold mt-2">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr,0.6fr] gap-6 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-lg"
        >
          <h2 className="text-lg font-semibold mb-4">Next Event</h2>
          {nextEvent ? (
            <div className="space-y-2 text-gray-300">
              <p className="text-xl font-semibold text-white">{nextEvent.event?.title}</p>
              <p className="flex items-center gap-2">
                <CalendarDaysIcon className="h-5 w-5 text-purple-400" />
                {nextEvent.startTime?.toLocaleString()}
              </p>
              <p className="flex items-center gap-2">
                <MapPinIcon className="h-5 w-5 text-purple-400" />
                {nextEvent.event?.venue}
              </p>
            </div>
          ) : (
            <p className="text-gray-400">No upcoming events yet.</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-lg"
        >
          <h2 className="text-lg font-semibold mb-4">Spend & Activity</h2>
          <div className="space-y-3 text-gray-300">
            <div className="flex items-center justify-between">
              <span>Total Spent</span>
              <span className="font-semibold text-green-400">KES {totalSpent.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Past Events</span>
              <span className="font-semibold">{pastBookings.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Active Tickets</span>
              <span className="font-semibold">{upcomingBookings.length}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            My Upcoming & Pending Events
          </h2>

          {/* ✅ FIXED NAVIGATION */}
          <button
            onClick={() => navigate("/my-bookings")}
            className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition"
          >
            Manage My Bookings
          </button>
        </div>

        {loading && <p className="text-gray-400">Loading bookings…</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && upcomingBookings.length === 0 && (
          <p className="text-gray-400 text-center py-6">
            You don’t have any upcoming bookings yet.
          </p>
        )}

        {!loading && upcomingBookings.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {upcomingBookings.map((b) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-900 rounded-2xl p-6 space-y-4 border border-gray-700 hover:border-purple-500/60 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">{b.event?.title || "Event"}</h3>
                    <p className="text-gray-400 text-sm">{b.event?.venue}</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-300 uppercase tracking-wider">
                    {b.statusUpper || "PENDING"}
                  </span>
                </div>

                <div className="text-gray-400 text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="h-5 w-5 text-purple-400" />
                    {b.startTime?.toLocaleString() || "—"}
                  </div>
                  <div className="flex items-center gap-2">
                    <TicketIcon className="h-5 w-5 text-purple-400" />
                    {b.ticketType?.name || "Ticket"} × {Number(b.quantity || 1)}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => openTicket(b)}
                    className="px-4 py-2 bg-green-600 rounded-xl hover:bg-green-700"
                  >
                    View Ticket
                  </button>
                  <button
                    onClick={() => navigate(`/events/${b.event?.id}`)}
                    className="px-4 py-2 bg-gray-700 rounded-xl hover:bg-gray-600"
                  >
                    Event
                  </button>
                  <button
                    disabled={processingId === b.id}
                    onClick={() => cancelBooking(b.id)}
                    className="px-4 py-2 bg-red-600 rounded-xl hover:bg-red-700 flex items-center gap-2"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ---------------- MODAL ---------------- */}
      {modalBooking && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm relative">

            <button
              onClick={() => setModalBooking(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            <div ref={ticketRef} className="space-y-4 text-center">
              <h2 className="text-xl font-bold">
                {modalBooking.event?.title}
              </h2>

              {qrLoading ? (
                <div className="w-48 h-48 mx-auto rounded-xl bg-gray-800 animate-pulse" />
              ) : (
                <img
                  src={modalBooking.qrUrl || "/placeholder.png"}
                  alt="QR Code"
                  className="w-48 h-48 mx-auto bg-gray-950 p-2 rounded-xl"
                />
              )}

              <div className="text-sm text-gray-400 space-y-1">
                <p>
                  {modalBooking.ticketType?.name} × {modalBooking.quantity}
                </p>
                <p>
                  Ref: {modalBooking.bookingReference || modalBooking.id}
                </p>
                <p>
                  {modalBooking.startTime?.toLocaleString()}
                </p>
              </div>
            </div>

            <button
              onClick={downloadTicket}
              disabled={qrLoading}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-green-600 py-2 rounded-xl hover:bg-green-700 disabled:opacity-60"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Download Ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
