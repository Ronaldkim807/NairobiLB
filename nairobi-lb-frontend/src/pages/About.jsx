import React from 'react';

const About = () => {
  const team = [
    {
      name: "John Doe",
      role: "CEO & Founder",
      bio: "Passionate about connecting people through unforgettable experiences in Nairobi.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Jane Smith",
      role: "Head of Events",
      bio: "Expert in curating diverse events that bring the community together.",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Mike Johnson",
      role: "Tech Lead",
      bio: "Building the future of event management with cutting-edge technology.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    }
  ];

  const values = [
    {
      icon: "🎯",
      title: "Excellence",
      description: "We strive for excellence in every event we host and every experience we create."
    },
    {
      icon: "🤝",
      title: "Community",
      description: "Building a vibrant community where people can connect, learn, and grow together."
    },
    {
      icon: "🔒",
      title: "Trust",
      description: "Your trust is our foundation. We ensure secure, reliable, and transparent experiences."
    },
    {
      icon: "🚀",
      title: "Innovation",
      description: "Embracing technology to create seamless and innovative event experiences."
    }
  ];

  const stats = [
    { number: "10,000+", label: "Happy Attendees" },
    { number: "500+", label: "Events Hosted" },
    { number: "200+", label: "Event Organizers" },
    { number: "98%", label: "Satisfaction Rate" }
  ];

  return (
    <div className="pt-16 bg-black text-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-gray-900 to-black">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            About <span className="text-primary-400">NairobiLB</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
            Connecting Nairobi's vibrant community through unforgettable events and experiences.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              NairobiLB is Kenya's premier event management platform, dedicated to bringing people together
              through amazing experiences. From electrifying concerts and inspiring workshops to corporate
              conferences and cultural festivals, we make it easy for event organizers to connect with their
              audiences and for attendees to discover their next unforgettable experience.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-bold text-primary-400 mb-2">{stat.number}</div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Our Values</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, i) => (
              <div key={i} className="text-center p-6 bg-black rounded-lg border border-gray-800">
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-primary-400">{value.title}</h3>
                <p className="text-gray-300">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  Founded in 2024, NairobiLB emerged from a simple idea: Nairobi deserved a world-class
                  platform for discovering and booking events. Our founders, a group of event enthusiasts
                  and tech innovators, saw the potential to transform how Kenyans experience entertainment
                  and learning.
                </p>
                <p>
                  What started as a small team with big dreams has grown into Kenya's most trusted event
                  management platform. We've hosted everything from intimate workshops to massive festivals,
                  always with one goal in mind: creating connections that matter.
                </p>
                <p>
                  Today, we're proud to be the bridge between event organizers and attendees, making it
                  easier than ever to discover, book, and enjoy amazing experiences in Nairobi and beyond.
                </p>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&h=400&fit=crop"
                alt="Nairobi cityscape"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Meet Our Team</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              The passionate individuals behind NairobiLB
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, i) => (
              <div key={i} className="text-center p-6 bg-black rounded-lg border border-gray-800">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-xl font-bold mb-2 text-primary-400">{member.name}</h3>
                <p className="text-primary-300 mb-3">{member.role}</p>
                <p className="text-gray-300 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Join the NairobiLB Community</h2>
          <p className="text-xl text-gray-300 mb-8">
            Whether you're looking to attend amazing events or organize your own, we're here to help
            you create unforgettable experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/events"
              className="bg-white text-black px-8 py-4 rounded-lg font-bold hover:bg-gray-200 transition"
            >
              Explore Events
            </a>
            <a
              href="/create-event"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-white hover:text-black transition"
            >
              Become an Organizer
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
