// src/pages/Events.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import { HiLocationMarker, HiCalendar, HiCurrencyDollar } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    date: searchParams.get('date') || '',
  });

  const categories = [
    'All Categories',
    'music',
    'sports', 
    'conference',
    'arts',
    'food',
    'business',
    'technology',
    'education',
    'health',
    'networking'
  ];

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchParams.get('category') && searchParams.get('category') !== 'All Categories') params.category = searchParams.get('category');
      if (searchParams.get('search')) params.search = searchParams.get('search');
      if (searchParams.get('date')) params.date = searchParams.get('date');

      const response = await eventsAPI.list(params);
      const data = response?.data?.data?.events ?? [];
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    const newSearchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) newSearchParams.set(k, v);
    });
    setSearchParams(newSearchParams);
  };

  const clearFilters = () => {
    setFilters({ category: '', search: '', date: '' });
    setSearchParams({});
  };

  const canCreateEvents = user?.role === 'ORGANIZER' || user?.role === 'ADMIN';
  const canEditEvents = canCreateEvents;

  const formatDate = dateStr => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch { return ''; }
  };

  return (
    <div className="min-h-screen bg-gray-900 pt-16 text-white">
      {/* Header */}
      <div className="bg-black/90 shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Discover Events</h1>
            <p className="mt-1 text-gray-400">
              Find amazing events happening in and around Nairobi
            </p>
          </div>

          {isAuthenticated && canCreateEvents && (
            <Link
              to="/create-event"
              className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              Create Event
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-black/80 shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Search Events
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search by name, venue..."
                className="w-full px-4 py-2 border border-gray-700 bg-gray-800 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white placeholder-gray-400"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-4 py-2 border border-gray-700 bg-gray-800 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white"
              >
                {categories.map(category => (
                  <option key={category} value={category} className="bg-gray-800 text-white">
                    {category === 'All Categories' ? category : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className="w-full px-4 py-2 border border-gray-700 bg-gray-800 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white"
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-gray-700 text-gray-200 rounded-xl hover:bg-gray-600 transition-colors font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-800 rounded-2xl h-80"></div>
          ))
        ) : events.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <HiCalendar className="mx-auto text-6xl mb-4 text-purple-500 animate-bounce" />
            <h3 className="text-xl font-semibold mb-2">No events found</h3>
            <p className="text-gray-400 mb-6">
              Try adjusting your search filters or check back later for new events.
            </p>
            <button
              onClick={clearFilters}
              className="bg-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-600 transition-all"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          events.map(event => (
            <div
              key={event.id}
              className="bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 hover:scale-105"
            >
              <Link to={`/events/${event.id}`}>
                <img
                  src={event.imageUrl || '/placeholder.png'}
                  alt={event.title}
                  onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
                  className="w-full h-48 object-cover"
                />
              </Link>
              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-block bg-purple-900/30 text-purple-400 px-3 py-1 rounded-full text-xs font-medium capitalize">
                    {event.category || 'other'}
                  </span>
                  {canEditEvents && (
                    <Link
                      to={`/organizer/edit/${event.id}`}
                      className="text-xs px-3 py-1 rounded-full bg-slate-700/70 text-slate-200 hover:bg-slate-600"
                    >
                      Edit
                    </Link>
                  )}
                </div>
                <Link to={`/events/${event.id}`}>
                  <h3 className="font-semibold text-white text-lg line-clamp-2">{event.title}</h3>
                </Link>
                <div className="space-y-1 text-gray-300 text-sm">
                  <div className="flex items-center space-x-2">
                    <HiLocationMarker className="text-purple-500" />
                    <span>{event.venue}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <HiCalendar className="text-purple-500" />
                    <span>{formatDate(event.startTime)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <HiCurrencyDollar className="text-green-500" />
                    <span className="font-semibold text-green-400">
                      KES {Number(event.minPrice || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
