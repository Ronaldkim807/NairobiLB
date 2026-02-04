import React, { useState, useRef, useEffect } from 'react';
import { useChatBot } from '../../hooks/useChatBot';
import './ChatBot.css';

const ChatBot = ({ isOpen, onClose }) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
  } = useChatBot();

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    sendMessage(inputMessage);
    setInputMessage('');
  };

  const handleRetry = () => {
    const lastUserMessage = [...messages]
      .reverse()
      .find(msg => msg.role === 'user');

    if (lastUserMessage) {
      sendMessage(lastUserMessage.content);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chatbot-overlay">
      <div className="chatbot-container">
        {/* Header */}
        <div className="chatbot-header">
          <h3>Nairobi Assistant 🤖</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        {/* Messages */}
        <div className="chatbot-messages">
          {messages.length === 0 && (
            <div className="welcome-message">
              <p><strong>Welcome to Nairobi Live & Book! 🎉</strong></p>
              <p>I'm your Nairobi Assistant, here to help you find and book amazing events!</p>
              <ul>
                <li>🔍 <strong>Browse Events:</strong> Ask me about events by category, date, or location</li>
                <li>🎭 <strong>Search:</strong> Tell me what type of event you're looking for (music, sports, conferences, etc.)</li>
                <li>📅 <strong>Upcoming:</strong> Ask about events this week, weekend, or specific dates</li>
                <li>🎫 <strong>Book Tickets:</strong> Get help with ticket availability and booking process</li>
                <li>💳 <strong>M-Pesa:</strong> Learn about our secure mobile payment system</li>
              </ul>
              <p><strong>What can I help you discover today?</strong></p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-content">{msg.content}</div>
            </div>
          ))}

          {isLoading && (
            <div className="message assistant">
              <div className="message-content loading">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}

          {error && (
            <div className="message assistant">
              <div className="message-content error">
                <p>Connection problem 😔</p>
                <button onClick={handleRetry} className="retry-btn">
                  Retry
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="chatbot-input-form">
          <input
            type="text"
            placeholder="Ask about events, tickets, or bookings..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !inputMessage.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBot;
