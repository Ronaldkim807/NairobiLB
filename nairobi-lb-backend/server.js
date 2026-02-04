import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import fetch from 'node-fetch'; // For keep-alive ping

// Routes
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import chatbotRoutes from './routes/chatbot.js';
import organizerRoutes from './routes/organizer.js';
import bookingRoutes from './routes/bookings.js';
import paymentRoutes from './routes/payments.js';

dotenv.config();

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(helmet());

// Allowed origins from environment or fallback
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://nairobi-lb-frontend.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // allow Postman, curl
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `CORS policy: The origin ${origin} is not allowed`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= API ROUTES ================= */
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);

/* ================= HEALTH CHECK ================= */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

/* ================= 403 HANDLER ================= */
app.use((err, req, res, next) => {
  if (err.status === 403) {
    return res.status(403).json({
      success: false,
      message: err.message || 'Forbidden: You do not have permission to access this resource'
    });
  }
  next(err);
});

/* ================= ERROR HANDLING ================= */
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

/* ================= 404 HANDLER ================= */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 NairobiLB Backend running on port ${PORT}`);

  // ================= KEEP FREE RENDER AWAKE =================
  if (process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL) {
    const pingUrl = process.env.FRONTEND_URL;
    setInterval(async () => {
      try {
        await fetch(pingUrl);
        console.log('🌙 Keep-alive ping sent to frontend to prevent sleeping');
      } catch (err) {
        console.error('❌ Keep-alive ping failed:', err.message);
      }
    }, 14 * 60 * 1000); // every 14 minutes
  }
});
