import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function OrganizerRevenue() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    api.get('/payments/organizer').then(res => {
      setPayments(res.data.data);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pt-16 px-6">
      <h1 className="text-3xl font-bold mb-6">Revenue & Payments</h1>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th>Date</th>
              <th>Event</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id} className="border-b">
                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                <td>{p.eventTitle}</td>
                <td>KES {p.amount}</td>
                <td>{p.method}</td>
                <td className="text-green-600">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
