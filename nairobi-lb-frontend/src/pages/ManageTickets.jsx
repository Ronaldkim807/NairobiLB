import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function ManageTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/organizer/tickets'); // ✅ correct route
      setTickets(res.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 px-6">
      <h1 className="text-3xl font-bold mb-6">Manage Tickets</h1>

      {loading && <p className="text-gray-600">Loading tickets…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="bg-white rounded-2xl shadow-sm p-6 overflow-x-auto">
          {tickets.length === 0 ? (
            <p className="text-gray-500">No tickets available.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th>Event</th>
                  <th>Ticket Type</th>
                  <th>Price</th>
                  <th>Sold</th>
                  <th>Available</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b">
                    <td>{t.eventTitle}</td>
                    <td>{t.name}</td>
                    <td>KES {t.price}</td>
                    <td>{t.sold}</td>
                    <td>{t.quantity - t.sold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
