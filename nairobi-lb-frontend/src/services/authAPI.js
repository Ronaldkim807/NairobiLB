// src/services/authAPI.js
import api from './api';

/**
 * NOTE:
 * - api already has interceptors and automatically attaches token from localStorage.
 * - These functions return axios promises (so caller should await and handle response.data).
 */

export function login(payload) {
  return api.post('/auth/login', payload);
}

export function register(payload) {
  return api.post('/auth/register', payload);
}

export function getCurrentUser() {
  return api.get('/auth/me');
}

export function refreshToken(body) {
  return api.post('/auth/refresh', body);
}

export function logout() {
  return api.post('/auth/logout');
}

const authAPI = {
  login,
  register,
  getCurrentUser,
  refreshToken,
  logout,
};

export default authAPI;
