import React from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

const EventCard = ({ event }) => {
  const navigate = useNavigate();

  const handleEventClick = () => {
    navigate(`/events/${event.id}`);
  };

  const getCategoryColor = (category) => {
    const colors = {
      music: 'from-purple-500 to-pink-500',
      sports: 'from-green-500 to-blue-500',
      conference: 'from-blue-500 to-cyan-500',
      workshop: 'from-orange-500 to-red-500',
      festival: 'from-yellow-500 to-orange-500',
      theater: 'from-indigo-500 to-purple-500',
    };
    return colors[category?.toLowerCase()] || 'from-gray-500 to-gray-700';
  };

  const formatDate = (date) => {
    return moment(date).format('MMM DD, YYYY');
  };

  const formatTime = (date) => {
    return moment(date).format('h:mm A');
  };

  return (
    <div
      onClick={handleEventClick}
      className="group bg-gray-900 rounded-lg shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-800 hover:border-primary-400"
    >
      {/* Event Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${getCategoryColor(event.category)}`}>
            {event.category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 bg-black/50 rounded-full text-xs font-medium text-white backdrop-blur-sm">
            {event.availableTickets} left
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <div className="text-white">
            <div className="flex items-center space-x-2 text-sm">
              <span>📍</span>
              <span className="truncate">{event.venue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Event Content */}
      <div className="p-5">
        {/* Date and Time */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-dark-400">
            <span>📅 {formatDate(event.startTime)}</span>
            <span>•</span>
            <span>🕒 {formatTime(event.startTime)}</span>
          </div>
          {event.isPopular && (
            <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full text-xs font-medium">
              Popular
            </span>
          )}
        </div>

        {/* Event Title */}
        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {event.title}
        </h3>

        {/* Event Description */}
        <p className="text-gray-600 dark:text-dark-300 text-sm mb-4 line-clamp-2">
          {event.description}
        </p>

        {/* Price and Action */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              KES {event.minPrice?.toLocaleString()}
            </span>
            {event.maxPrice > event.minPrice && (
              <span className="text-gray-500 dark:text-dark-400 text-sm ml-1">
                - {event.maxPrice?.toLocaleString()}
              </span>
            )}
          </div>
          <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 transform group-hover:scale-105">
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
