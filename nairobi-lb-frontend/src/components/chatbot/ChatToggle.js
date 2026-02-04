import React, { useState } from 'react';
import ChatBot from './ChatBot';

const ChatToggle = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      {/* Chat toggle button */}
      <button 
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-primary-500 to-nairobi-500 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg hover:shadow-primary-200 transition-all duration-200 shadow-lg flex items-center space-x-2"
        onClick={() => setIsChatOpen(true)}
      >
        <span>💬</span>
        <span>Ask Nairobi Assistant</span>
      </button>
      
      {/* Chatbot component */}
      <ChatBot 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </>
  );
};

export default ChatToggle;