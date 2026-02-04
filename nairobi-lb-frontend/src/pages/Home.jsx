import React from 'react';
import { Link } from 'react-router-dom';
import { FaMusic, FaFutbol, FaBriefcase, FaTools, FaTheaterMasks, FaFire } from 'react-icons/fa';

const Home = () => {

  const categories = [
    { name: "Music", icon: <FaMusic size={32} />, count: "45 Events", color: "from-gray-800 to-gray-900", href: "/events?category=music" },
    { name: "Sports", icon: <FaFutbol size={32} />, count: "32 Events", color: "from-gray-800 to-gray-900", href: "/events?category=sports" },
    { name: "Conference", icon: <FaBriefcase size={32} />, count: "28 Events", color: "from-gray-800 to-gray-900", href: "/events?category=conference" },
    { name: "Workshop", icon: <FaTools size={32} />, count: "19 Events", color: "from-gray-800 to-gray-900", href: "/events?category=workshop" },
    { name: "Festival", icon: <FaFire size={32} />, count: "15 Events", color: "from-gray-800 to-gray-900", href: "/events?category=festival" },
    { name: "Theater", icon: <FaTheaterMasks size={32} />, count: "12 Events", color: "from-gray-800 to-gray-900", href: "/events?category=theater" },
  ];

  const stats = [
    { number: "10,000+", label: "Happy Attendees" },
    { number: "500+", label: "Events Hosted" },
    { number: "200+", label: "Event Organizers" },
    { number: "98%", label: "Satisfaction Rate" },
  ];

  return (
    <div className="pt-16 bg-black">

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20"></div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Discover Nairobi's Pulse
          </h1>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/events"
              className="bg-white text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-200 transition"
            >
              Explore Events
            </Link>

            <Link
              to="/create-event"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-black transition"
            >
              Organize Event
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-black">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, i) => (
            <div key={i}>
              <div className="text-4xl font-bold text-white">{stat.number}</div>
              <div className="text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-black">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white">Browse by Passion</h2>
            <p className="text-xl text-gray-400">Find events that ignite your interests</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, i) => (
              <Link
                key={i}
                to={category.href}
                className="bg-gray-900 p-6 rounded-lg shadow hover:shadow-xl transition text-center hover:bg-gray-800"
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center`}>
                  {category.icon}
                </div>
                <h3 className="font-bold text-white">{category.name}</h3>
                <p className="text-sm text-gray-500">{category.count}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to Experience Nairobi?</h2>
        <p className="text-xl mb-8 text-gray-300">
          Join our community and never miss amazing events.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/register"
            className="bg-white text-black px-8 py-4 rounded-lg font-bold hover:bg-gray-200 transition"
          >
            Start Your Journey
          </Link>

          <Link
            to="/events"
            className="border-2 border-white px-8 py-4 rounded-lg font-bold hover:bg-white hover:text-black transition"
          >
            Browse Events
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
