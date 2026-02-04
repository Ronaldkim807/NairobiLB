import React from 'react';
import EventCard from './EventCard';

const EventsGrid = ({ events, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm animate-pulse">
            <div className="h-48 bg-gray-300 dark:bg-dark-700 rounded-t-2xl"></div>
            <div className="p-5 space-y-3">
              <div className="h-4 bg-gray-300 dark:bg-dark-700 rounded w-3/4"></div>
              <div className="h-6 bg-gray-300 dark:bg-dark-700 rounded w-full"></div>
              <div className="h-4 bg-gray-300 dark:bg-dark-700 rounded w-1/2"></div>
              <div className="flex justify-between">
                <div className="h-8 bg-gray-300 dark:bg-dark-700 rounded w-1/3"></div>
                <div className="h-8 bg-gray-300 dark:bg-dark-700 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎭</div>
        <h3 className="text-xl font-semibold text-white mb-2">No events found</h3>
        <p className="text-dark-300">Try adjusting your search filters or check back later for new events.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
};

export default EventsGrid;