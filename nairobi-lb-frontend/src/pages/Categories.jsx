// src/pages/Categories.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import { HiLocationMarker, HiCalendar, HiCurrencyDollar } from 'react-icons/hi';

export default function Categories() {
  const [categories, setCategories] = useState(['all']);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await eventsAPI.list();
      const data = res?.data?.data?.events ?? res?.data?.events ?? [];
      if (!Array.isArray(data)) throw new Error('Unexpected events response');

      setEvents(data);
      setFilteredEvents(data);

      const derived = Array.from(new Set(data.map(ev => (ev.category || 'other').toLowerCase())));
      setCategories(['all', ...derived]);
    } catch (err) {
      console.error(err);
      setError('Failed to load events. Please try again later.');
      setEvents([]);
      setFilteredEvents([]);
      setCategories(['all']);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const filterEvents = useCallback(() => {
    let result = events.slice();

    if (selectedCategory !== 'all') {
      result = result.filter(ev => (ev.category || '').toLowerCase() === selectedCategory.toLowerCase());
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(ev =>
        (ev.title || '').toLowerCase().includes(q) ||
        (ev.venue || '').toLowerCase().includes(q)
      );
    }

    setFilteredEvents(result);
  }, [events, selectedCategory, searchTerm]);

  useEffect(() => { filterEvents(); }, [filterEvents]);

  const formatDate = dateString => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return ''; }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-900 text-white pt-16 px-4">
      <div className="max-w-6xl mx-auto py-8 animate-pulse">
        <div className="h-10 bg-gray-700 rounded w-1/3 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-2xl p-6 space-y-4">
              <div className="h-48 bg-gray-700 rounded-xl mb-4" />
              <div className="h-4 bg-gray-600 rounded w-3/4" />
              <div className="h-4 bg-gray-600 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-16 px-4">
      <div className="max-w-6xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 text-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            Browse Categories
          </h1>
          <p className="text-gray-400 mb-6">
            Discover events by category and find your perfect experience
          </p>

          {/* Search Bar */}
          <div className="max-w-md mb-6">
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl font-medium transition-all capitalize ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white shadow-lg'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                {category === 'all' ? 'All Categories' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-700/30 border border-red-600 text-red-200 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Events Grid */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">
              {selectedCategory === 'all' ? 'All Events' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Events`}
              <span className="text-gray-400 text-lg ml-2">({filteredEvents.length})</span>
            </h2>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <HiCalendar className="mx-auto text-6xl mb-4 animate-pulse text-pink-500" />
              <h3 className="text-xl font-semibold mb-2">No events found</h3>
              <p className="text-gray-400">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map(event => (
                <Link
                  key={String(event.id)}
                  to={`/events/${String(event.id)}`}
                  className="bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow transform hover:-translate-y-1 hover:scale-105"
                >
                  <img
                    src={event.image || event.imageUrl || '/placeholder.png'}
                    alt={event.title}
                    onError={e => e.currentTarget.src = '/placeholder.png'}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-5 space-y-3">
                    <span className="inline-block bg-pink-600/30 text-pink-400 px-3 py-1 rounded-full text-xs font-medium capitalize">
                      {event.category || 'other'}
                    </span>
                    <h3 className="font-semibold text-white text-lg line-clamp-2">{event.title}</h3>
                    <div className="space-y-1 text-gray-400 text-sm">
                      <div className="flex items-center space-x-2">
                        <HiLocationMarker className="text-pink-500" />
                        <span>{event.venue}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <HiCalendar className="text-pink-500" />
                        <span>{formatDate(event.startTime)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <HiCurrencyDollar className="text-green-400" />
                        <span className="font-semibold text-green-400">
                          KES {Number(event.price || event.minPrice || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
