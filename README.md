# NairobiLB

## Overview

NairobiLB is a comprehensive event management platform designed to streamline the process of organizing, booking, and managing events in Nairobi and beyond. The platform allows users to discover events, book tickets, and make payments seamlessly via M-Pesa integration. Organizers can create and manage events, track analytics, and handle ticket sales. Admins have full oversight with dedicated dashboards.

The project consists of two main components:
- **Backend**: A Node.js/Express API server with Prisma ORM for database management, M-Pesa STK Push for payments, and OpenAI-powered chatbot for user assistance.
- **Frontend**: A React-based web application with Tailwind CSS for styling, providing a responsive and user-friendly interface.

## Features

### User Features
- **Event Discovery**: Browse and search for events by category, location, and date.
- **User Authentication**: Secure login and registration with JWT tokens.
- **Event Booking**: Book tickets for events with real-time availability checks.
- **Payment Integration**: Secure payments via M-Pesa STK Push.
- **User Dashboard**: View personal bookings, manage profile, and track event history.
- **Chatbot Support**: AI-powered chatbot for assistance and queries.

### Organizer Features
- **Event Creation**: Create and manage events with detailed information, ticket types, and pricing.
- **Analytics Dashboard**: Track event performance, ticket sales, and revenue.
- **Ticket Management**: Manage ticket types, quantities, and pricing.
- **Booking Oversight**: View and manage bookings for organized events.
- **Revenue Tracking**: Monitor earnings and generate reports.

### Admin Features
- **System Oversight**: Full administrative control over users, events, and bookings.
- **User Management**: Manage user roles and permissions.
- **Event Moderation**: Approve or reject events before publication.
- **Analytics and Reports**: Comprehensive system-wide analytics.

## Tech Stack

### Backend
- **Node.js**: Runtime environment.
- **Express.js**: Web framework for API development.
- **Prisma**: ORM for database management with PostgreSQL.
- **M-Pesa API**: For STK Push payments.
- **OpenAI**: For chatbot functionality.
- **JWT**: For authentication.
- **bcryptjs**: For password hashing.
- **CORS, Helmet, Morgan**: For security and logging.

### Frontend
- **React**: JavaScript library for building user interfaces.
- **React Router**: For client-side routing.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Axios**: For HTTP requests.
- **Chart.js**: For data visualization in dashboards.
- **Framer Motion**: For animations.
- **React Hot Toast**: For notifications.

### Database
- **PostgreSQL**: Relational database managed via Prisma.

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL database
- M-Pesa API credentials (for payments)
- OpenAI API key (for chatbot)

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd nairobi-lb-backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the backend root with the following:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/nairobilb"
   JWT_SECRET="your_jwt_secret"
   MPESA_CONSUMER_KEY="your_mpesa_consumer_key"
   MPESA_CONSUMER_SECRET="your_mpesa_consumer_secret"
   MPESA_SHORTCODE="your_mpesa_shortcode"
   MPESA_PASSKEY="your_mpesa_passkey"
   OPENAI_API_KEY="your_openai_api_key"
   ```

4. Run Prisma migrations:
   ```
   npm run prisma:push
   npm run prisma:generate
   ```

5. Seed the database (optional):
   ```
   node prisma/seed.js
   ```

6. Start the server:
   ```
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd nairobi-lb-frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

The frontend will run on `http://localhost:3000` and the backend on `http://localhost:5000` (or as configured).

## Usage

1. **Access the Application**: Open your browser and go to `http://localhost:3000`.
2. **Register/Login**: Create an account or log in as a user, organizer, or admin.
3. **Explore Events**: Browse events on the home page or events page.
4. **Book Events**: Select an event, choose tickets, and complete payment via M-Pesa.
5. **Manage Events (Organizers)**: Use the organizer dashboard to create and manage events.
6. **Admin Controls**: Access admin dashboard for system management.

### API Endpoints
- `GET /api/events`: Fetch all events.
- `POST /api/auth/login`: User login.
- `POST /api/bookings`: Create a booking.
- `POST /api/payments/stkpush`: Initiate M-Pesa payment.
- Refer to backend routes for full API documentation.

## Testing

### Backend Tests
Run individual test files:
```
npm run test:token
npm run test:stk
```

### Frontend Tests
```
npm test
```

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Commit changes: `git commit -m 'Add your feature'`.
4. Push to the branch: `git push origin feature/your-feature`.
5. Open a pull request.

## License

This project is licensed under the ISC License.

## Contact

For support or inquiries, email support@nairobiLB.co.ke.
