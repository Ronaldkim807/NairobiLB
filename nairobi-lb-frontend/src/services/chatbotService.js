// src/services/chatbotService.js
import api from './api';

export const chatbotService = {
  async sendMessage(message, conversationHistory = []) {
    try {
      const response = await api.post('/chatbot/chat', { 
        message, 
        conversationHistory 
      });
      return response.data;
    } catch (error) {
      console.error('Chatbot API error:', error);
      throw error;
    }
  },

  async searchEvents(searchParams) {
    try {
      const response = await api.post('/chatbot/search-events', searchParams);
      return response.data;
    } catch (error) {
      console.error('Search events error:', error);
      throw error;
    }
  },

  async getCategories() {
    try {
      const response = await api.get('/chatbot/categories');
      return response.data;
    } catch (error) {
      console.error('Get categories error:', error);
      throw error;
    }
  },

  async getSuggestions(limit = 5) {
    try {
      const response = await api.get(`/chatbot/suggestions?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Get suggestions error:', error);
      throw error;
    }
  }
};