import axios from 'axios';

/**
 * Normalize host so REACT_APP_API_URL can be:
 * - http://localhost:5000
 * - http://localhost:5000/
 * - http://localhost:5000/api
 * And baseURL becomes: <host>/api
 */
function normalizeHost(raw) {
  if (!raw) return raw;
  let host = raw.replace(/\/+$/, '');
  if (host.endsWith('/api')) host = host.slice(0, -4);
  return host;
}

const RAW_API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_BASE_URL = `${normalizeHost(RAW_API)}/api`;

/* -------------------------------------------------- */
/* Axios instance */
/* -------------------------------------------------- */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

/* -------------------------------------------------- */
/* Auth header helpers */
/* -------------------------------------------------- */
export function setAuthHeader(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

/* -------------------------------------------------- */
/* Request interceptor (auto attach token) */
/* -------------------------------------------------- */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* -------------------------------------------------- */
/* Response interceptor (refresh token once) */
/* -------------------------------------------------- */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const refreshRes = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken }
        );

        const newToken =
          refreshRes.data?.data?.accessToken ||
          refreshRes.data?.accessToken;

        if (!newToken) throw new Error('Refresh failed');

        localStorage.setItem('token', newToken);
        setAuthHeader(newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setAuthHeader(null);
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

/* ==================================================
   AUTH API
================================================== */
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

/* ==================================================
   EVENTS API
================================================== */
export const eventsAPI = {
  list: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
};

/* ==================================================
   ORGANIZER API (🔥 FIXED ANALYTICS PATH)
================================================== */
export const organizerAPI = {
  analytics: () => api.get('/organizer/analytics'),
  insights: () => api.get('/organizer/insights'),
  myEvents: () => api.get('/organizer/events'),
  tickets: () => api.get('/organizer/tickets'),
};

/* ==================================================
   BOOKINGS API
================================================== */
export const bookingsAPI = {
  create: (data) => api.post('/bookings', data),
  myBookings: () => api.get('/bookings/my-bookings'),
  cancel: (id) => api.put(`/bookings/${id}/cancel`),
};

/* ==================================================
   PAYMENTS API
================================================== */
export const paymentsAPI = {
  initiate: (data) => api.post('/payments/initiate', data),
  status: (id) => api.get(`/payments/${id}/status`),
};

/* ==================================================
   CHATBOT API
================================================== */
export const chatbotAPI = {
  sendMessage: (message, history = []) =>
    api.post('/chatbot/chat', { message, conversationHistory: history }),

  searchEvents: (params) =>
    api.post('/chatbot/search-events', params),

  categories: () =>
    api.get('/chatbot/categories'),

  suggestions: (limit = 5) =>
    api.get(`/chatbot/suggestions?limit=${limit}`),
};

/* ==================================================
   ADMIN API
================================================== */
export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  users: (params) => api.get('/admin/users', { params }),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  events: (params) => api.get('/admin/events', { params }),
  toggleEventActive: (id) => api.put(`/admin/events/${id}/toggle-active`),
  deleteEvent: (id) => api.delete(`/admin/events/${id}`),
  payments: (params) => api.get('/admin/payments', { params }),
  updatePaymentStatus: (id, status, notes) =>
    api.put(`/admin/payments/${id}/status`, { status, notes }),
  financialReport: (period = 'month') =>
    api.get('/admin/reports/financial', { params: { period } }),
};

export default api;
