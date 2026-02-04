import express from 'express';
import prisma from '../utils/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes in this file require admin authentication
router.use(authenticateToken);
router.use(requireRole(['ADMIN']));

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    // Get total counts
    const totalEvents = await prisma.event.count();
    const totalBookings = await prisma.booking.count();
    const totalUsers = await prisma.user.count();
    
    // Get total revenue from successful payments
    const totalRevenue = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'SUCCESS' }
    });

    // Get recent bookings with user and event info
    const recentBookings = await prisma.booking.findMany({
      take: 10,
      include: {
        event: { 
          select: { 
            title: true,
            startTime: true 
          } 
        },
        user: { 
          select: { 
            name: true, 
            email: true 
          } 
        },
        ticketType: { 
          select: { 
            name: true 
          } 
        },
        payments: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get events by category for analytics
    const eventsByCategory = await prisma.event.groupBy({
      by: ['category'],
      _count: { id: true },
      where: { isActive: true }
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalEvents,
          totalBookings,
          totalUsers,
          totalRevenue: totalRevenue._sum.amount || 0
        },
        recentBookings,
        eventsByCategory
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all users with pagination and filtering
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;

    const where = {};
    
    if (role && role !== 'all') {
      where.role = role;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            organizedEvents: true,
            bookings: true
          }
        }
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count({ where });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'ORGANIZER', 'USER'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Prevent admin from removing their own admin role
    if (id === req.user.id && role !== 'ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove your own admin role'
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all events with advanced filtering
router.get('/events', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      category, 
      organizerId,
      search 
    } = req.query;

    const where = {};
    
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (organizerId) {
      where.organizerId = organizerId;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } }
      ];
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        organizer: { 
          select: { 
            name: true, 
            email: true 
          } 
        },
        ticketTypes: true,
        _count: { 
          select: { 
            bookings: true 
          } 
        }
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.event.count({ where });

    // Get unique categories for filter options
    const categories = await prisma.event.findMany({
      select: { category: true },
      distinct: ['category']
    });

    res.json({
      success: true,
      data: {
        events,
        categories: categories.map(c => c.category),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Toggle event active status
router.put('/events/:id/toggle-active', async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({ 
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if event has active bookings before deactivating
    if (event.isActive && event._count.bookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate event with active bookings'
      });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { isActive: !event.isActive }
    });

    res.json({
      success: true,
      message: `Event ${updatedEvent.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { event: updatedEvent }
    });

  } catch (error) {
    console.error('Toggle event active error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete event (only if no bookings)
router.delete('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event._count.bookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete event with existing bookings'
      });
    }

    // Delete event and associated ticket types (cascade)
    await prisma.event.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all payments with filtering
router.get('/payments', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      provider,
      startDate, 
      endDate 
    } = req.query;

    const where = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (provider && provider !== 'all') {
      where.provider = provider;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            event: { 
              select: { 
                title: true,
                startTime: true 
              } 
            },
            user: { 
              select: { 
                name: true, 
                email: true 
              } 
            },
            ticketType: {
              select: {
                name: true
              }
            }
          }
        }
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.payment.count({ where });

    // Get payment statistics
    const paymentStats = await prisma.payment.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true }
    });

    res.json({
      success: true,
      data: {
        payments,
        stats: paymentStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update payment status (for manual reconciliation)
router.put('/payments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      });
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        booking: true
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: { 
        status,
        // Store admin notes for manual updates
        ...(notes && { adminNotes: notes })
      }
    });

    // If payment is marked as success, update booking status
    if (status === 'SUCCESS' && payment.booking) {
      await prisma.booking.update({
        where: { id: payment.booking.id },
        data: { status: 'CONFIRMED' }
      });
    }

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: { payment: updatedPayment }
    });

  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get financial reports
router.get('/reports/financial', async (req, res) => {
  try {
    const { period = 'month' } = req.query; // day, week, month, year
    
    let groupByFormat = '%Y-%m';
    if (period === 'day') groupByFormat = '%Y-%m-%d';
    if (period === 'week') groupByFormat = '%Y-%U';
    if (period === 'year') groupByFormat = '%Y';

    // This would require raw SQL for date grouping
    const revenueReport = await prisma.payment.groupBy({
      by: ['createdAt'],
      where: {
        status: 'SUCCESS',
        createdAt: {
          gte: new Date(new Date().getFullYear(), 0, 1) // Current year
        }
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Get top events by revenue
    const topEvents = await prisma.payment.groupBy({
      by: ['bookingId'],
      where: {
        status: 'SUCCESS'
      },
      _sum: {
        amount: true
      },
      orderBy: {
        _sum: {
          amount: 'desc'
        }
      },
      take: 10
    });

    // Populate event details for top events
    const topEventsWithDetails = await Promise.all(
      topEvents.map(async (event) => {
        const booking = await prisma.booking.findUnique({
          where: { id: event.bookingId },
          include: {
            event: {
              select: {
                title: true,
                category: true
              }
            }
          }
        });
        
        return {
          ...event,
          eventTitle: booking?.event?.title,
          category: booking?.event?.category
        };
      })
    );

    res.json({
      success: true,
      data: {
        revenueReport,
        topEvents: topEventsWithDetails
      }
    });

  } catch (error) {
    console.error('Financial reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;