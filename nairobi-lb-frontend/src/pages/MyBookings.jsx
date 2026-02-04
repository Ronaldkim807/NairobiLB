// src/pages/MyBookings.jsx
import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import html2canvas from "html2canvas";
import { bookingsAPI } from "../services/api";
import { buildTicketPayload, generateQrDataUrl } from "../services/qrApi";
import {
  CalendarDaysIcon,
  MapPinIcon,
  TicketIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export default function MyBookings() {
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [modalBooking, setModalBooking] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  const ticketRef = useRef(null);

  /* ---------------- FETCH BOOKINGS ---------------- */
  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingsAPI.myBookings();

      const data =
        res?.data?.data?.bookings ||
        res?.data?.bookings ||
        res?.data?.data ||
        [];

      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- FILTER LOGIC ---------------- */
  const now = new Date();

  const filteredBookings = bookings.filter((b) => {
    const eventDate = new Date(b.event.startTime);
    const status = String(b.status || "").toUpperCase();

    if (activeTab === "upcoming")
      return eventDate >= now && status !== "CANCELLED";

    if (activeTab === "past") return eventDate < now;

    if (activeTab === "cancelled") return status === "CANCELLED";

    return true;
  });

  /* ---------------- QR CODE ---------------- */
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

  /* ---------------- DOWNLOAD ---------------- */
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

  /* ---------------- CANCEL BOOKING ---------------- */
  const cancelBooking = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;

    try {
      setProcessingId(id);
      await bookingsAPI.cancel(id);
      loadBookings();
    } catch (err) {
      alert("Failed to cancel booking.");
    } finally {
      setProcessingId(null);
    }
  };

  /* ---------------- UI ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading bookings…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <p className="text-gray-400">
            View tickets, cancel bookings & track past events
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-3">
          {["upcoming", "past", "cancelled"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl capitalize transition ${
                activeTab === tab
                  ? "bg-green-600"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filteredBookings.length === 0 ? (
          <div className="text-gray-400 text-center py-16">
            No {activeTab} bookings found.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredBookings.map((b) => {
              const eventDate = new Date(b.event.startTime);
              const isUpcoming = eventDate >= now && String(b.status || "").toUpperCase() !== "CANCELLED";

              return (
                <div key={b.id} className="bg-gray-900 rounded-2xl p-6 space-y-4">
                  <h3 className="text-xl font-semibold">{b.event.title}</h3>

                  <div className="text-gray-400 text-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="h-5 w-5" />
                      {eventDate.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-5 w-5" />
                      {b.event.venue}
                    </div>
                    <div className="flex items-center gap-2">
                      <TicketIcon className="h-5 w-5" />
                      {b.ticketType.name} × {b.quantity}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    {isUpcoming && (
                      <button
                        onClick={() => openTicket(b)}
                        className="px-4 py-2 bg-green-600 rounded-xl hover:bg-green-700"
                      >
                        View Ticket
                      </button>
                    )}

                    <Link
                      to={`/events/${b.event.id}`}
                      className="px-4 py-2 bg-gray-700 rounded-xl hover:bg-gray-600"
                    >
                      Event
                    </Link>

                    {isUpcoming && (
                      <button
                        disabled={processingId === b.id}
                        onClick={() => cancelBooking(b.id)}
                        className="px-4 py-2 bg-red-600 rounded-xl hover:bg-red-700 flex items-center gap-2"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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
                {modalBooking.event.title}
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
                  {modalBooking.ticketType.name} × {modalBooking.quantity}
                </p>
                <p>
                  Ref: {modalBooking.bookingReference || modalBooking.id}
                </p>
                <p>
                  {new Date(
                    modalBooking.event.startTime
                  ).toLocaleString()}
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
