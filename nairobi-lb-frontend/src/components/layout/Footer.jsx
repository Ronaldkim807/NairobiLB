import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TicketIcon,
  FolderIcon,
  PencilIcon,
  BuildingLibraryIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
  ClipboardDocumentIcon,
  ArrowUpIcon,
  LockClosedIcon,
  StarIcon,
  RocketLaunchIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [showChatbot, setShowChatbot] = useState(false);

  const quickLinks = [
    { name: 'Browse Events', path: '/events', icon: TicketIcon },
    { name: 'Event Categories', path: '/categories', icon: FolderIcon },
    { name: 'Become Organizer', path: '/organize', icon: PencilIcon },
    { name: 'About Us', path: '/about', icon: BuildingLibraryIcon },
  ];

  const supportLinks = [
    { name: 'Help Center', path: '/help', icon: QuestionMarkCircleIcon },
    { name: 'Contact Support', path: '/contact', icon: ChatBubbleLeftRightIcon },
    { name: 'FAQs', path: '/faq', icon: BookOpenIcon },
    { name: 'Booking Guide', path: '/guide', icon: ClipboardDocumentIcon },
  ];

  const legalLinks = [
    { name: 'Terms of Service', path: '/terms' },
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Cookie Policy', path: '/cookies' },
    { name: 'Refund Policy', path: '/refunds' },
  ];

  const socialLinks = [
    { name: 'Facebook', url: 'https://facebook.com', icon: BuildingLibraryIcon },
    { name: 'Twitter', url: 'https://twitter.com', icon: RocketLaunchIcon },
    { name: 'Instagram', url: 'https://instagram.com', icon: StarIcon },
    { name: 'LinkedIn', url: 'https://linkedin.com', icon: PencilIcon },
  ];

  const contactInfo = [
    { detail: 'hello@nairobilb.com', icon: EnvelopeIcon },
    { detail: '+254 716012357', icon: PhoneIcon },
    { detail: 'Nairobi, Kenya', icon: MapPinIcon },
  ];

  const handleChatbotToggle = () => {
    setShowChatbot(!showChatbot);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log('Chatbot triggered from footer');
  };

  return (
    <footer className="bg-black text-white relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">

          {/* Brand & Description */}
          <div className="lg:col-span-2 animate-fadeInUp">
            <Link to="/" className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-black font-bold text-sm">NLB</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">Nairobi<span className="text-green-400">LB</span></h3>
                <p className="text-gray-400 text-sm">Live & Book Events</p>
              </div>
            </Link>
            <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
              Discover and book unforgettable events in Nairobi. From concerts to workshops, we connect you with amazing experiences.
            </p>

            <div className="space-y-2">
              {contactInfo.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex items-center space-x-3 text-gray-400 hover:text-white transition-colors duration-300">
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{item.detail}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="animate-fadeInUp delay-100">
            <h4 className="text-lg font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors duration-300 group"
                    >
                      <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="text-sm">{link.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Support Links */}
          <div className="animate-fadeInUp delay-200">
            <h4 className="text-lg font-semibold mb-4 text-white">Support & Help</h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors duration-300 group"
                    >
                      <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="text-sm">{link.name}</span>
                    </Link>
                  </li>
                );
              })}
              <li>
                <button
                  onClick={handleChatbotToggle}
                  className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors duration-300 group w-full text-left"
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-sm">AI Assistant</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Connect & Social */}
          <div className="animate-fadeInUp delay-300">
            <h4 className="text-lg font-semibold mb-4 text-white">Connect With Us</h4>
            <div className="flex space-x-4 mb-6">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center hover:bg-green-400 hover:text-black transition-colors duration-300 group"
                    aria-label={social.name}
                  >
                    <Icon className="w-5 h-5 group-hover:scale-125 transition-transform" />
                  </a>
                );
              })}
            </div>

            <div className="bg-gray-900/50 backdrop-blur-md rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">M</span>
                </div>
                <span className="text-sm font-semibold text-green-400">M-Pesa Partner</span>
              </div>
              <p className="text-xs text-gray-400">
                Secure payments powered by Safaricom M-Pesa
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8 animate-fadeInUp delay-400">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-wrap justify-center md:justify-start gap-6">
              {legalLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-gray-500 hover:text-green-400 text-sm transition-colors duration-300"
                >
                  {link.name}
                </Link>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center space-x-2 text-gray-500 hover:text-green-400 transition-colors duration-300 group"
              >
                <span className="text-sm">Back to Top</span>
                <ArrowUpIcon className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
              </button>
              <div className="text-gray-500 text-sm">
                &copy; {currentYear} Nairobi Live & Book. All rights reserved.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-6 mt-6 pt-6 border-t border-gray-800 text-gray-400 text-xs animate-fadeInUp delay-500">
            <div className="flex items-center space-x-2">
              <LockClosedIcon className="w-4 h-4" />
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center space-x-2">
              <StarIcon className="w-4 h-4" />
              <span>Trusted Platform</span>
            </div>
            <div className="flex items-center space-x-2">
              <RocketLaunchIcon className="w-4 h-4" />
              <span>Instant Confirmations</span>
            </div>
            <div className="flex items-center space-x-2">
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              <span>AI Assistant Available</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
