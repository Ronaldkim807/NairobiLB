// src/hooks/useChatBot.js
import { useState, useCallback } from 'react';
import { chatbotService } from '../services/chatbotService';

export const useChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (message) => {
    if (!message.trim()) return;

    // Add user message immediately
    const userMessage = { role: 'user', content: message, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Get conversation history for context
      const conversationHistory = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({ role: msg.role, content: msg.content }));

      const response = await chatbotService.sendMessage(message, conversationHistory);
      
      if (response.success) {
        const assistantMessage = { 
          role: 'assistant', 
          content: response.data.response, 
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(response.message || 'Failed to get response from chatbot');
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      setError(err.message);
      // Don't add error message to messages array to avoid duplication
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages
  };
};