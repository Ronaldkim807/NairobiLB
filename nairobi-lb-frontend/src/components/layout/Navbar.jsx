// src/components/layout/Navbar.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  HomeIcon,
  TicketIcon,
  FolderIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const BASE_NAVIGATION = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Events', href: '/events', icon: TicketIcon },
  { name: 'Categories', href: '/categories', icon: FolderIcon },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const location = useLocation();
  const navigate = useNavigate();

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 10);
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [handleScroll]);

  useEffect(() => setIsOpen(false), [location.pathname]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const navigation = useMemo(() => {
    const nav = [...BASE_NAVIGATION];
    if (isAuthenticated) {
      if (user?.role === 'ORGANIZER') {
        nav.push({ name: 'Organizer', href: '/organizer', icon: ChartBarIcon });
      } else if (user?.role === 'ADMIN') {
        nav.push({ name: 'Admin', href: '/admin', icon: Cog6ToothIcon });
      } else {
        nav.push({ name: 'My Tickets', href: '/dashboard', icon: TicketIcon });
      }
    }
    return nav;
  }, [isAuthenticated, user?.role]);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
      setIsOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/', { replace: true });
    }
  };

  const NavItem = ({ item, mobile = false }) => {
    const IconComponent = item.icon;
    const baseStyles = mobile 
      ? `flex items-center space-x-3 w-full px-4 py-3 rounded-xl font-medium transition-all ${
          isActive(item.href)
            ? 'bg-primary-500 text-white shadow-lg'
            : 'text-gray-300 hover:bg-gray-800'
        }`
      : `flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
          isActive(item.href)
            ? 'bg-primary-500 text-white shadow-lg shadow-primary-200'
            : scrolled
            ? 'text-gray-300 hover:text-primary-500 hover:bg-gray-800'
            : 'text-white hover:text-primary-200 hover:bg-white/10'
        }`;

    return (
      <button
        onClick={() => {
          navigate(item.href);
          if (mobile) setIsOpen(false);
        }}
        className={baseStyles}
      >
        <IconComponent className="w-5 h-5" />
        <span>{item.name}</span>
      </button>
    );
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 ${isDarkMode ? 'bg-black' : 'bg-white border-b border-slate-200'}`}
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center space-x-3 group"
              aria-label="Home"
            >
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-nairobi-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-sm">NLB</span>
              </div>
              <div className="hidden sm:block">
                <h1 className={`font-bold text-xl ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Nairobi<span className="text-primary-400">LB</span>
                </h1>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                  Live & Book Events
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </div>

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isDarkMode ? 'bg-gray-900 hover:bg-gray-800 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <div className="flex items-center space-x-6">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                    Hi, {user?.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className={`px-4 py-2 font-medium transition-all duration-200 ${
                      isDarkMode ? 'text-gray-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className={`px-4 py-2 font-medium rounded-lg transition-all duration-200 ${
                      isDarkMode ? 'bg-black text-white border border-gray-600 hover:bg-gray-800' : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className={`px-6 py-2 rounded-lg font-medium border transition-all duration-200 ${
                      isDarkMode ? 'bg-black text-white border-gray-600 hover:bg-gray-800' : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? scrolled
                    ? 'text-gray-300 hover:bg-gray-800'
                    : 'text-white hover:bg-white/10'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className={`md:hidden absolute top-16 left-0 right-0 backdrop-blur-md shadow-xl ${
            isDarkMode ? 'bg-black/95 border-t border-gray-700' : 'bg-white/95 border-t border-slate-200'
          }`}>
            <div className="px-4 py-3 space-y-2">
              {navigation.map((item) => (
                <NavItem key={item.name} item={item} mobile />
              ))}

             

              <div className={`pt-4 space-y-2 ${isDarkMode ? 'border-t border-gray-700' : 'border-t border-slate-200'}`}>
                {isAuthenticated ? (
                  <>
                    <div className={`px-4 py-2 text-sm ${isDarkMode ? 'text-gray-600' : 'text-slate-500'}`}>
                      Signed in as <strong>{user?.name}</strong>
                    </div>
                    <button
                      onClick={handleLogout}
                      className={`w-full text-center py-3 rounded-xl font-medium transition-colors ${
                        isDarkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { navigate('/login'); setIsOpen(false); }}
                      className={`w-full text-center py-3 rounded-xl font-medium transition-colors ${
                        isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => { navigate('/register'); setIsOpen(false); }}
                      className="w-full text-center py-3 bg-gradient-to-r from-primary-500 to-nairobi-500 text-white rounded-xl font-medium shadow-lg"
                    >
                      Get Started
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default React.memo(Navbar);
