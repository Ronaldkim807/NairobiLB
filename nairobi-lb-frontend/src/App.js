// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import { ProtectedRoute, ProtectedRoleRoute } from './components/auth/ProtectedRoute';

// Public pages
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import BookEvent from './pages/BookEvent';
import Categories from './pages/Categories';
import Unauthorized from './pages/Unauthorized';

// User pages
import UserDashboard from './pages/UserDashboard';
import MyBookings from './pages/MyBookings';

// Organizer pages
import OrganizerDashboard from './pages/OrganizerDashboard';
import OrganizerAnalytics from './pages/OrganizerAnalytics';
import ManageTickets from './pages/ManageTickets';
import OrganizerRevenue from './pages/OrganizerRevenue';
import CreateEvent from './pages/CreateEvent';
import EditEvent from './pages/EditEvent';
import ViewBookings from './pages/ViewBookings';

// Admin
import AdminDashboard from './pages/AdminDashboard';

// Misc
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>

              {/* ================= PUBLIC ROUTES ================= */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetails />} />
              <Route path="/events/:id/book" element={<BookEvent />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* ================= AUTHENTICATED USER ================= */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="/my-bookings" element={<MyBookings />} />
              </Route>

              {/* ================= ORGANIZER & ADMIN ================= */}
              <Route element={<ProtectedRoleRoute allowedRoles={['ORGANIZER', 'ADMIN']} />}>
                <Route path="/organizer" element={<OrganizerDashboard />} />
                <Route path="/organizer/analytics" element={<OrganizerAnalytics />} />
                <Route path="/organizer/manage-tickets" element={<ManageTickets />} />
                <Route path="/organizer/revenue" element={<OrganizerRevenue />} />
                <Route path="/organizer/edit/:id" element={<EditEvent />} />
                <Route path="/organizer/event/:id/bookings" element={<ViewBookings />} />
                <Route path="/create-event" element={<CreateEvent />} />
              </Route>

              {/* ================= ADMIN ONLY ================= */}
              <Route element={<ProtectedRoleRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>

              {/* ================= 404 ================= */}
              <Route path="*" element={<NotFound />} />

            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

/* ================= SUPPORT PAGES ================= */

function Contact() {
  return (
    <div className="min-h-screen pt-16 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-4">Contact Support</h1>
      <p className="text-gray-300">
        Our support team is here to help you. Email us at
        <strong className="text-white"> support@nairobiLB.co.ke</strong>
      </p>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen pt-16 flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-gray-300">Page not found</p>
    </div>
  );
}

export default App;
