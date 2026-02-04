// routes/organizer.js
import express from 'express';
import prisma from '../utils/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/organizer/analytics
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const organizerId = req.user.id;

    const events = await prisma.event.findMany({
      where: { organizerId },
      include: {
        bookings: {
          include: {
            payments: { where: { status: 'SUCCESS' }, select: { amount: true } },
          },
        },
      },
    });

    let totalRevenue = 0;
    let totalTickets = 0;

    const eventStats = events.map(event => {
      const eventRevenue = event.bookings.reduce((sum, b) => {
        const payTotal = (b.payments || []).reduce((acc, p) => acc + Number(p.amount || 0), 0);
        return sum + payTotal;
      }, 0);
      const ticketsSold = event.bookings.reduce((sum, b) => sum + Number(b.quantity || 0), 0);

      totalRevenue += eventRevenue;
      totalTickets += ticketsSold;

      return { id: event.id, title: event.title, revenue: eventRevenue };
    });

    const conversionRate = events.length === 0 ? 0 : ((totalTickets / (events.length * 100)) * 100).toFixed(1);

    res.json({
      success: true,
      data: { totalRevenue, totalTickets, conversionRate, events: eventStats },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Analytics failed' });
  }
});

// GET /api/organizer/events/:id/bookings
router.get('/events/:id/bookings', authenticateToken, async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, title: true, organizerId: true, startTime: true }
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizerId !== organizerId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to view bookings for this event' });
    }

    const bookings = await prisma.booking.findMany({
      where: { eventId: id },
      include: {
        user: { select: { name: true, email: true } },
        ticketType: { select: { name: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: { event, bookings } });
  } catch (err) {
    console.error('Organizer event bookings error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load event bookings' });
  }
});

// GET /api/organizer/insights
// Returns revenue by month, top events, and recent activity
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const organizerId = req.user.id;
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [recentBookings, recentPayments, paymentsForMonth, paymentsForTop] = await Promise.all([
      prisma.booking.findMany({
        where: { event: { organizerId } },
        include: {
          event: { select: { id: true, title: true, startTime: true } },
          user: { select: { name: true, email: true } },
          ticketType: { select: { name: true } },
          payments: { orderBy: { createdAt: 'desc' }, take: 1 }
        },
        orderBy: { createdAt: 'desc' },
        take: 8
      }),
      prisma.payment.findMany({
        where: {
          status: 'SUCCESS',
          booking: { event: { organizerId } }
        },
        include: {
          booking: {
            select: {
              id: true,
              event: { select: { id: true, title: true } },
              user: { select: { name: true, email: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 8
      }),
      prisma.payment.findMany({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: from },
          booking: { event: { organizerId } }
        },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.payment.findMany({
        where: {
          status: 'SUCCESS',
          booking: { event: { organizerId } }
        },
        select: {
          amount: true,
          booking: { select: { event: { select: { id: true, title: true } } } }
        }
      })
    ]);

    const revenueMap = new Map();
    for (let i = 0; i < 12; i += 1) {
      const d = new Date(from.getFullYear(), from.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      revenueMap.set(key, 0);
    }
    paymentsForMonth.forEach((p) => {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const current = revenueMap.get(key) || 0;
      revenueMap.set(key, current + Number(p.amount || 0));
    });
    const revenueByMonth = Array.from(revenueMap.entries()).map(([month, total]) => ({ month, total }));

    const topMap = new Map();
    paymentsForTop.forEach((p) => {
      const event = p.booking?.event;
      if (!event) return;
      const current = topMap.get(event.id) || { id: event.id, title: event.title, total: 0, count: 0 };
      current.total += Number(p.amount || 0);
      current.count += 1;
      topMap.set(event.id, current);
    });
    const topEvents = Array.from(topMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        recentBookings,
        recentPayments,
        revenueByMonth,
        topEvents
      }
    });
  } catch (err) {
    console.error('Organizer insights error:', err);
    res.status(500).json({ success: false, message: 'Failed to load organizer insights' });
  }
});

// GET /api/organizer/tickets
router.get('/tickets', authenticateToken, async (req, res) => {
  try {
    const organizerId = req.user.id;

    const ticketTypes = await prisma.ticketType.findMany({
      where: { event: { organizerId } },
      include: { event: { select: { title: true } } },
    });

    const tickets = ticketTypes.map(t => ({
      id: t.id,
      eventTitle: t.event.title,
      name: t.name,
      price: t.price,
      sold: t.sold || 0,
      quantity: t.quantity,
    }));

    res.json({ success: true, data: tickets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to load tickets' });
  }
});

export default router;
