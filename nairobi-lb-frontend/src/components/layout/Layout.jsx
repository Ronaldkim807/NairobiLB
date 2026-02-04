import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import ChatToggle from '../chatbot/ChatToggle';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const Layout = ({ children }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-500 ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-black text-white'
      }`}
    >
      
      {/* Navbar */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <Navbar />
      </motion.div>

      {/* Main content */}
      <main className="flex-1 w-full mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={children.key || 'main-content'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className={`backdrop-blur-md rounded-xl p-6 shadow-xl ${
              isLight ? 'bg-white/70 border border-slate-200' : 'bg-gray-900/30'
            }`}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <Footer />
      </motion.div>

      {/* Global Chatbot Toggle */}
      <ChatToggle />
    </div>
  );
};

export default Layout;
